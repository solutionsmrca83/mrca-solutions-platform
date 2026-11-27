-- ==============================================================================
-- MRCA SOLUTIONS — AUTOMATED CRM, QUOTE ESTIMATOR & SUPPORT BOT SCHEMA ($0 API)
-- Archivo: supabase/crm_bot_schema.sql
-- Descripción:
--   1. Tablas: crm_leads, support_tickets, bot_chat_logs, bot_settings
--   2. Incluye project_scope y advance_percentage (25 o 40) para cotizaciones
--   3. Row Level Security (RLS) estricto
--   4. Protección de UPDATE para client_name, company_name, estimated_budget y
--      contract_terms restringida exclusivamente a superadmin
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 0. FUNCIONES DE APOYO Y GOBERNANZA RBAC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Verifica si el usuario autenticado pertenece al equipo administrativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role::text IN ('superadmin', 'owner', 'partner', 'stealth_partner', 'employee')
  )
  OR LOWER(COALESCE(auth.jwt()->>'email', '')) IN (
    'solutionsmrca83@gmail.com',
    'jefe@mrcasolutions.com',
    'admin@mrcasolutions.com',
    'founder@mrcasolutions.com',
    'owner@mrcasolutions.com',
    'ciso@mrcasolutions.com'
  );
$$;

-- Verifica si el usuario autenticado posee privilegios estrictos de SUPERADMIN
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role::text IN ('superadmin', 'owner')
  )
  OR LOWER(COALESCE(auth.jwt()->'user_metadata'->>'role', '')) IN ('superadmin', 'owner')
  OR LOWER(COALESCE(auth.jwt()->>'email', '')) IN (
    'solutionsmrca83@gmail.com',
    'jefe@mrcasolutions.com',
    'founder@mrcasolutions.com',
    'owner@mrcasolutions.com',
    'ciso@mrcasolutions.com'
  );
$$;

-- ==============================================================================
-- 1. TABLA: crm_leads (Cotizador Estimado + Auto-Aceptación de Clientes B2B)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name         TEXT NOT NULL,
  company_name        TEXT NOT NULL,
  email               TEXT NOT NULL,
  service_type        TEXT NOT NULL,
  project_scope       TEXT NOT NULL DEFAULT 'Profesional / Empresarial',
  estimated_budget    TEXT DEFAULT 'Por definir en consultoría',
  advance_percentage  INTEGER NOT NULL DEFAULT 25 CHECK (advance_percentage IN (25, 40)),
  status              TEXT NOT NULL DEFAULT 'Nuevo'
                      CHECK (status IN ('Nuevo', 'Aceptado Automáticamente', 'En Contrato', 'Rechazado')),
  bot_notes           TEXT,
  contract_terms      TEXT,
  auto_accepted       BOOLEAN NOT NULL DEFAULT FALSE,
  session_id          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bloque idempotente por si crm_leads ya existía de una versión previa
DO $$
BEGIN
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS project_scope TEXT NOT NULL DEFAULT 'Profesional / Empresarial';
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS advance_percentage INTEGER NOT NULL DEFAULT 25;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS contract_terms TEXT;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS session_id TEXT;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.crm_leads'::regclass
      AND conname = 'crm_leads_advance_percentage_check'
  ) THEN
    ALTER TABLE public.crm_leads
      ADD CONSTRAINT crm_leads_advance_percentage_check
      CHECK (advance_percentage IN (25, 40));
  END IF;
END $$;

COMMENT ON TABLE public.crm_leads IS
  'Prospectos cotizados y aceptados automáticamente por el Asistente Ejecutivo MRCA (Costo $0 MXN).';

CREATE INDEX IF NOT EXISTS idx_crm_leads_email      ON public.crm_leads (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_crm_leads_status     ON public.crm_leads (status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_scope      ON public.crm_leads (project_scope);
CREATE INDEX IF NOT EXISTS idx_crm_leads_auto       ON public.crm_leads (auto_accepted);
CREATE INDEX IF NOT EXISTS idx_crm_leads_session    ON public.crm_leads (session_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created    ON public.crm_leads (created_at DESC);

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger estricto de protección de columnas financieras y titulares:
-- SOLO SUPERADMIN puede modificar client_name, company_name, estimated_budget,
-- advance_percentage o contract_terms
CREATE OR REPLACE FUNCTION public.enforce_crm_leads_superadmin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.client_name IS DISTINCT FROM OLD.client_name
    OR NEW.company_name IS DISTINCT FROM OLD.company_name
    OR NEW.estimated_budget IS DISTINCT FROM OLD.estimated_budget
    OR NEW.advance_percentage IS DISTINCT FROM OLD.advance_percentage
    OR NEW.contract_terms IS DISTINCT FROM OLD.contract_terms
  ) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Permiso denegado: Solo superadmin puede modificar client_name, company_name, estimated_budget o términos contractuales.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_protect_superadmin_fields ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_protect_superadmin_fields
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_crm_leads_superadmin_fields();

-- Protección equivalente para términos contractuales en client_contracts (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_contracts'
  ) THEN
    CREATE OR REPLACE FUNCTION public.enforce_client_contracts_superadmin_terms()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    BEGIN
      IF (
        NEW.title IS DISTINCT FROM OLD.title
        OR NEW.content IS DISTINCT FROM OLD.content
      ) AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Permiso denegado: Solo superadmin puede modificar términos contractuales.';
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS trg_client_contracts_superadmin_terms ON public.client_contracts;
    CREATE TRIGGER trg_client_contracts_superadmin_terms
      BEFORE UPDATE ON public.client_contracts
      FOR EACH ROW EXECUTE FUNCTION public.enforce_client_contracts_superadmin_terms();
  END IF;
END $$;

-- ==============================================================================
-- 2. TABLA: support_tickets (Soporte Nivel 1 Bot + Escalación a Especialistas)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email    TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Soporte General',
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'Media'
                  CHECK (priority IN ('Baja', 'Media', 'Alta', 'Crítica', 'low', 'medium', 'critical')),
  status          TEXT NOT NULL DEFAULT 'Abierto'
                  CHECK (status IN ('Abierto', 'Resuelto por Bot', 'Escalado a Humano', 'open', 'in_progress', 'resolved')),
  bot_resolution  TEXT,
  session_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bloque idempotente para actualizar instancias previas de support_tickets sin perder datos
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS client_email TEXT NOT NULL DEFAULT '';
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Soporte General';
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS bot_resolution TEXT;
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS session_id TEXT;
  ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'support_tickets'
      AND column_name = 'client_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.support_tickets ALTER COLUMN client_id DROP NOT NULL;
  END IF;

  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.support_tickets'::regclass
      AND contype = 'c'
      AND (
        pg_get_constraintdef(oid) ILIKE '%priority%'
        OR pg_get_constraintdef(oid) ILIKE '%status%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
  END LOOP;

  ALTER TABLE public.support_tickets
    ADD CONSTRAINT support_tickets_priority_check
    CHECK (priority IN ('Baja', 'Media', 'Alta', 'Crítica', 'low', 'medium', 'critical'));

  ALTER TABLE public.support_tickets
    ADD CONSTRAINT support_tickets_status_check
    CHECK (status IN ('Abierto', 'Resuelto por Bot', 'Escalado a Humano', 'open', 'in_progress', 'resolved'));
END $$;

COMMENT ON TABLE public.support_tickets IS
  'Tickets de soporte nivel 1 resueltos automáticamente por el bot y casos escalados a especialistas humanos.';

CREATE INDEX IF NOT EXISTS idx_support_tickets_user      ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email     ON public.support_tickets (LOWER(client_email));
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority  ON public.support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_session   ON public.support_tickets (session_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created   ON public.support_tickets (created_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. TABLA: bot_chat_logs (Historial Conversacional y Conteo de Cotizaciones)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bot_chat_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT NOT NULL,
  user_email        TEXT,
  sender            TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message           TEXT NOT NULL,
  action_triggered  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bot_chat_logs IS
  'Bitácora de conversaciones, cotizaciones estimadas y soporte del Asistente MRCA.';

CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_session ON public.bot_chat_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_email   ON public.bot_chat_logs (LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_action  ON public.bot_chat_logs (action_triggered);
CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_created ON public.bot_chat_logs (created_at ASC);

-- ==============================================================================
-- 4. TABLA: bot_settings (Interruptor Maestro de Auto-Aceptación — Solo Superadmin)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bot_settings (
  key         TEXT PRIMARY KEY,
  value_bool  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.bot_settings (key, value_bool)
VALUES ('auto_accept_enabled', TRUE)
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS trg_bot_settings_updated_at ON public.bot_settings;
CREATE TRIGGER trg_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) ESTRICTA
-- ==============================================================================

ALTER TABLE public.crm_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_chat_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings    ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: crm_leads
-- • INSERT público/cliente para cotización y onboarding automatizado
-- • SELECT propio para clientes autenticados; lectura completa para is_admin()
-- • UPDATE administrativo para is_admin(), pero el trigger bloquea cambios en
--   client_name, company_name, estimated_budget, advance_percentage y contract_terms
--   para cualquier rol distinto a superadmin
-- • DELETE exclusivo de superadmin
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "crm_leads__public_insert" ON public.crm_leads;
CREATE POLICY "crm_leads__public_insert"
  ON public.crm_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "crm_leads__select_own_or_admin" ON public.crm_leads;
CREATE POLICY "crm_leads__select_own_or_admin"
  ON public.crm_leads FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  );

DROP POLICY IF EXISTS "crm_leads__admin_update" ON public.crm_leads;
CREATE POLICY "crm_leads__admin_update"
  ON public.crm_leads FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "crm_leads__superadmin_delete" ON public.crm_leads;
CREATE POLICY "crm_leads__superadmin_delete"
  ON public.crm_leads FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- ------------------------------------------------------------------------------
-- RLS: support_tickets
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "tickets__client_read_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets__client_insert_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets__client_update_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets__admin_delete" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets__public_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets__select_own_or_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets__update_own_or_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets__admin_delete" ON public.support_tickets;

CREATE POLICY "support_tickets__public_insert"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "support_tickets__select_own_or_admin"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
    OR LOWER(COALESCE(client_email, '')) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  );

CREATE POLICY "support_tickets__update_own_or_admin"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
    OR LOWER(COALESCE(client_email, '')) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  )
  WITH CHECK (
    public.is_admin()
    OR auth.uid() = user_id
    OR LOWER(COALESCE(client_email, '')) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  );

CREATE POLICY "support_tickets__admin_delete"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: bot_chat_logs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "bot_chat_logs__public_insert" ON public.bot_chat_logs;
CREATE POLICY "bot_chat_logs__public_insert"
  ON public.bot_chat_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "bot_chat_logs__select_own_or_admin" ON public.bot_chat_logs;
CREATE POLICY "bot_chat_logs__select_own_or_admin"
  ON public.bot_chat_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR LOWER(COALESCE(user_email, '')) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  );

DROP POLICY IF EXISTS "bot_chat_logs__superadmin_delete" ON public.bot_chat_logs;
CREATE POLICY "bot_chat_logs__superadmin_delete"
  ON public.bot_chat_logs FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- ------------------------------------------------------------------------------
-- RLS: bot_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "bot_settings__public_read" ON public.bot_settings;
CREATE POLICY "bot_settings__public_read"
  ON public.bot_settings FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "bot_settings__superadmin_write" ON public.bot_settings;
CREATE POLICY "bot_settings__superadmin_write"
  ON public.bot_settings FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
