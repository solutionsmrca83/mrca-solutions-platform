-- ==============================================================================
-- MRCA SOLUTIONS — ZERO-COMMISSION SPEI BILLING & IT SUPPORT TICKETS SCHEMA
-- Módulo: Facturación SPEI Banxico Sin Comisiones + Mesa de Ayuda IT Zero-Trust
-- ==============================================================================

-- ============================================================
-- 0. EXTENSIONES Y FUNCIONES DEFENSIVAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
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

-- ==============================================================================
-- 1. TABLA: invoices (Facturación SPEI Zero-Commission)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount              NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verification_in_progress', 'paid')),
  description         TEXT NOT NULL,
  due_date            TIMESTAMPTZ NOT NULL,
  spei_tracking_key   TEXT,
  payment_proof_url   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.invoices IS
  'Registro de facturación B2B para transferencias SPEI Banxico de comisión 0% con verificación manual/automatizada.';

CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tracking_key ON public.invoices(spei_tracking_key);

-- Trigger: updated_at automático en invoices
DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. TABLA: support_tickets (Mesa de Soporte IT & Enclave SLA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject             TEXT NOT NULL,
  description         TEXT NOT NULL,
  priority            TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'critical')),
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.support_tickets IS
  'Tickets de soporte técnico B2B, atención a incidentes e ingeniería de enclave con aislamiento RLS.';

CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);

-- Trigger: updated_at automático en support_tickets
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES — Zero-Trust
-- ==============================================================================
ALTER TABLE public.invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Políticas para invoices:
-- • Lectura: Los clientes solo pueden ver sus propias facturas (auth.uid() = client_id); Admins ven todas.
-- • Inserción: Clientes o Admins pueden generar cargos asociados al client_id.
-- • Modificación: Clientes pueden adjuntar su clave de rastreo SPEI / comprobante; Admins pueden verificar y validar.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "invoices__client_read_own" ON public.invoices;
CREATE POLICY "invoices__client_read_own"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "invoices__client_insert_own" ON public.invoices;
CREATE POLICY "invoices__client_insert_own"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "invoices__client_update_own" ON public.invoices;
CREATE POLICY "invoices__client_update_own"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "invoices__admin_delete" ON public.invoices;
CREATE POLICY "invoices__admin_delete"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- Políticas para support_tickets:
-- • Lectura: Los clientes únicamente pueden consultar sus propios tickets; Admins ven todos.
-- • Inserción: Los clientes pueden abrir tickets asignados a su propio perfil (auth.uid() = client_id); Admins pueden abrir en nombre de clientes.
-- • Modificación: Los clientes pueden actualizar o responder a sus propios tickets; Admins gestionan y resuelven.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "tickets__client_read_own" ON public.support_tickets;
CREATE POLICY "tickets__client_read_own"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "tickets__client_insert_own" ON public.support_tickets;
CREATE POLICY "tickets__client_insert_own"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "tickets__client_update_own" ON public.support_tickets;
CREATE POLICY "tickets__client_update_own"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "tickets__admin_delete" ON public.support_tickets;
CREATE POLICY "tickets__admin_delete"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.is_admin());
