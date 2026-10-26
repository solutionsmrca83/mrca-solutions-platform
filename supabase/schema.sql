-- ==============================================================================
-- MRCA SOLUTIONS — SUPABASE ENTERPRISE DATABASE SCHEMA v2.4
-- Zero-Trust RBAC + Row Level Security (RLS)
-- Ejecutar en Supabase > SQL Editor > New Query
-- ==============================================================================

-- ============================================================
-- 0. EXTENSIONS (habilitar primero)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ==============================================================================
-- 1. ENUM TYPES — Roles, Estados y Categorías
-- ==============================================================================

CREATE TYPE user_role AS ENUM ('owner', 'stealth_partner', 'client');

CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'paused', 'rejected');

CREATE TYPE engineering_category AS ENUM (
  'web_apps',
  'databases',
  'custom_scripts',
  'security'
);

CREATE TYPE ledger_status AS ENUM ('LEDGER OK', 'PENDING', 'DISPERSED');

CREATE TYPE gateway_type AS ENUM ('stripe', 'spei');

CREATE TYPE message_category AS ENUM ('critical', 'high', 'normal', 'audit');

CREATE TYPE ticket_status AS ENUM ('leads', 'negotiation', 'active');


-- ==============================================================================
-- 2. TABLA: user_profiles
-- Extiende auth.users de Supabase con roles RBAC y metadatos de seguridad.
-- ==============================================================================

CREATE TABLE public.user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                user_role NOT NULL DEFAULT 'client',
  full_name           TEXT,
  company_name        TEXT,
  representative_name TEXT,
  stealth_token_hash  TEXT UNIQUE,
  is_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by         UUID REFERENCES auth.users(id),
  approved_at         TIMESTAMPTZ,
  budget_tier         TEXT,
  service_category    engineering_category DEFAULT 'web_apps',
  compliance_privacy  BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_terms    BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS
  'Perfil extendido de cada usuario. El campo role implementa RBAC Zero-Trust. '
  'Los clientes requieren is_approved=true para acceder al portal B2B.';

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_is_approved ON public.user_profiles(is_approved);
CREATE INDEX idx_user_profiles_stealth ON public.user_profiles(stealth_token_hash);


-- ==============================================================================
-- 3. TABLA: client_project_proposals
-- ==============================================================================

CREATE TABLE public.client_project_proposals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name        TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email               TEXT NOT NULL,
  project_title       TEXT NOT NULL,
  description         TEXT,
  category            engineering_category NOT NULL DEFAULT 'web_apps',
  budget_tier         TEXT NOT NULL DEFAULT 'Adaptable a Presupuesto / Viabilidad',
  status              proposal_status NOT NULL DEFAULT 'pending',
  compliance_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by         UUID REFERENCES public.user_profiles(id),
  reviewed_at         TIMESTAMPTZ,
  reviewer_notes      TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_client ON public.client_project_proposals(client_id);
CREATE INDEX idx_proposals_status ON public.client_project_proposals(status);


-- ==============================================================================
-- 4. TABLA: secure_messages
-- ==============================================================================

CREATE TABLE public.secure_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  recipient_id      UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  proposal_id       UUID REFERENCES public.client_project_proposals(id) ON DELETE SET NULL,
  encrypted_subject  TEXT NOT NULL,
  encrypted_payload  TEXT NOT NULL,
  cipher_hash        TEXT,
  category          message_category NOT NULL DEFAULT 'normal',
  client_company    TEXT,
  sender_role       user_role,
  server_ip_hash    TEXT,
  read              BOOLEAN NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender   ON public.secure_messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.secure_messages(recipient_id);
CREATE INDEX idx_messages_proposal ON public.secure_messages(proposal_id);
CREATE INDEX idx_messages_read     ON public.secure_messages(read);
CREATE INDEX idx_messages_created  ON public.secure_messages(created_at DESC);


-- ==============================================================================
-- 5. TABLA: ledger_entries
-- ==============================================================================

CREATE TABLE public.ledger_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  client_name     TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency        CHAR(3) NOT NULL DEFAULT 'MXN',
  service         TEXT NOT NULL,
  gateway         TEXT NOT NULL,
  gateway_type    gateway_type NOT NULL,
  tx_hash         TEXT NOT NULL,
  status          ledger_status NOT NULL DEFAULT 'PENDING',
  dispersed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_client  ON public.ledger_entries(client_id);
CREATE INDEX idx_ledger_status  ON public.ledger_entries(status);
CREATE INDEX idx_ledger_gateway ON public.ledger_entries(gateway_type);
CREATE INDEX idx_ledger_created ON public.ledger_entries(created_at DESC);


-- ==============================================================================
-- 6. TABLA: kanban_tickets
-- ==============================================================================

CREATE TABLE public.kanban_tickets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'General',
  category_badge      TEXT,
  category_badge_color TEXT DEFAULT 'cyan',
  amount_est          TEXT,
  lead_score          INT CHECK (lead_score >= 0 AND lead_score <= 100),
  sla_note            TEXT,
  status              ticket_status NOT NULL DEFAULT 'leads',
  assigned_to         UUID REFERENCES public.user_profiles(id),
  proposal_id         UUID REFERENCES public.client_project_proposals(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON public.kanban_tickets(status);
CREATE INDEX idx_tickets_assigned ON public.kanban_tickets(assigned_to);


-- ==============================================================================
-- 7. TABLA: audit_log (INMUTABLE)
-- ==============================================================================

CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role  user_role,
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor  ON public.audit_log(actor_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- Inmutabilidad del log
CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO public.audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO public.audit_log DO INSTEAD NOTHING;


-- ==============================================================================
-- 8. TABLA: stealth_sessions (TTL 30 min)
-- ==============================================================================

CREATE TABLE public.stealth_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash      TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  used            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stealth_expires ON public.stealth_sessions(expires_at);
CREATE INDEX idx_stealth_token   ON public.stealth_sessions(token_hash);


-- ==============================================================================
-- 9. FUNCIONES DE SOPORTE
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'stealth_partner')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_client()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'client'
    AND is_approved = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'client'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON public.client_project_proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.kanban_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) — Zero-Trust
-- ==============================================================================

ALTER TABLE public.user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stealth_sessions        ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "user_profiles__self_read"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles__admin_read"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "user_profiles__self_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles__admin_update"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "user_profiles__insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- client_project_proposals
CREATE POLICY "proposals__client_read_own"
  ON public.client_project_proposals FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "proposals__client_insert"
  ON public.client_project_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND public.is_approved_client()
  );

CREATE POLICY "proposals__client_update_pending"
  ON public.client_project_proposals FOR UPDATE
  USING (auth.uid() = client_id AND status = 'pending')
  WITH CHECK (auth.uid() = client_id AND status = 'pending');

CREATE POLICY "proposals__admin_all"
  ON public.client_project_proposals FOR ALL
  USING (public.is_admin());

-- secure_messages (Zero-Trust estricto)
CREATE POLICY "messages__client_read_own"
  ON public.secure_messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

CREATE POLICY "messages__client_insert_own"
  ON public.secure_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_approved_client()
  );

CREATE POLICY "messages__admin_read"
  ON public.secure_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "messages__admin_insert"
  ON public.secure_messages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "messages__admin_update_read"
  ON public.secure_messages FOR UPDATE
  USING (public.is_admin());

-- ledger_entries (solo admins leen, nadie puede DELETE)
CREATE POLICY "ledger__admin_read"
  ON public.ledger_entries FOR SELECT
  USING (public.is_admin());

-- kanban_tickets (solo admins)
CREATE POLICY "tickets__admin_all"
  ON public.kanban_tickets FOR ALL
  USING (public.is_admin());

-- audit_log
CREATE POLICY "audit__admin_read"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "audit__insert_authenticated"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- stealth_sessions (solo Service Role — RLS bloquea a todos)
CREATE POLICY "stealth__service_role_only"
  ON public.stealth_sessions FOR ALL
  USING (FALSE);


-- ==============================================================================
-- 11. SEED DATA — Descomenta y reemplaza UUIDs REALES después de crear usuarios
-- ==============================================================================

/*
-- PASO 1: Crear usuarios en Dashboard > Authentication > Users:
--   jefe@mrcasolutions.com  (rol: owner)
--   admin@mrcasolutions.com (rol: admin)
--
-- PASO 2: Copiar sus UUIDs y reemplazar abajo:

INSERT INTO public.user_profiles (id, role, full_name, company_name, is_approved)
VALUES
  (
    'REEMPLAZA-UUID-JEFE',
    'owner',
    'Director MRCA Solutions',
    'MRCA Solutions',
    TRUE
  ),
  (
    'REEMPLAZA-UUID-SOCIO',
    'stealth_partner',
    'Socio Estrategico',
    'MRCA Solutions',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_approved = EXCLUDED.is_approved;
*/

-- ==============================================================================
-- 12. LEDGER SEED (Descomenta para datos de demo)
-- ==============================================================================

/*
INSERT INTO public.ledger_entries
  (client_name, amount, currency, service, gateway, gateway_type, tx_hash, status)
VALUES
  ('Banco FinTech Corp',     350000, 'MXN', 'Arquitectura Cloud Zero-Trust',    'Stripe Escrow (Dual)',    'stripe', '0x4f8a921be4a288b18402fcae9120489', 'LEDGER OK'),
  ('NeoLogistics LatAm',    180000, 'MXN', 'Hardening Kubernetes & Cilium',    'SPEI Inmediato Banxico',  'spei',   '0x3b1c8812fa99a0d2491b490f840139b', 'LEDGER OK'),
  ('Grupo Inmobiliario Cero',225000, 'MXN', 'Auditoria Pentest Kali & SLA',    'Stripe Escrow (Dual)',    'stripe', '0x88ea2910fa401d29381fc0491840182', 'LEDGER OK'),
  ('InsurTech Nexo SA',     495000, 'MXN', 'Plataforma de Pago SPEI & Stripe', 'SPEI Inmediato Banxico',  'spei',   '0x11fa9918ab22c180492fc0401029019', 'DISPERSED'),
  ('GreenEnergy DataOps',   120000, 'MXN', 'Scripts ETL & Automatizacion eBPF','Stripe Escrow (Dual)',    'stripe', '0x99bc1810fa401d293a1fc04018400b1', 'PENDING');
*/

-- ==============================================================================
-- 13. KANBAN SEED (Descomenta para datos de demo)
-- ==============================================================================

/*
INSERT INTO public.kanban_tickets
  (title, description, category, category_badge, category_badge_color, amount_est, lead_score, status)
VALUES
  ('FinTech NeoPay - Plataforma Pagos',   'Integracion SPEI + Stripe con escrow dual',              'TikTok B2B',      'TikTok B2B', 'cyan',  '$450k MXN', 96, 'leads'),
  ('NeoLogistics - K8s Hardening',        'Hardening Kubernetes con Cilium eBPF',                   'SLA Firmas',      'En Revision','green', '$180k MXN', 88, 'negotiation'),
  ('GreenEnergy - Data Pipeline',         'Scripts ETL de alta concurrencia con Rust',              'Contrato Activo', 'Activo',     'green', '$120k MXN', 99, 'active'),
  ('InsurTech Nexo - Pentest Red Team',   'Auditoria penetracion completa OWASP Top 10',            'TikTok B2B',      'TikTok B2B', 'cyan',  '$95k MXN',  72, 'leads');
*/


-- ==============================================================================
-- VERIFICACION FINAL
-- Ejecuta esto para confirmar que todo se creo correctamente:
-- ==============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;
