-- ==============================================================================
-- MRCA SOLUTIONS — DYNAMIC PRICING & BUDGET NEGOTIATIONS SCHEMA
-- Módulo: Motor de Descuentos Dinámicos & Hub de Contraofertas de Presupuesto
-- ==============================================================================

-- ============================================================
-- 0. EXTENSIONES Y FUNCIONES
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

-- ==============================================================================
-- 1. TABLA: budget_negotiations (Contraofertas & Ajustes de Presupuesto)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budget_negotiations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type               TEXT NOT NULL CHECK (client_type IN ('student', 'enterprise')),
  client_name               TEXT NOT NULL,
  client_company_or_school  TEXT NOT NULL,
  client_email              TEXT NOT NULL,
  client_phone              TEXT,
  service_title             TEXT NOT NULL,
  service_category          TEXT NOT NULL,
  original_price            NUMERIC(12,2) NOT NULL CHECK (original_price >= 0),
  proposed_budget           NUMERIC(12,2) NOT NULL CHECK (proposed_budget >= 0),
  approved_price            NUMERIC(12,2) CHECK (approved_price >= 0),
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'counter_offered')),
  message                   TEXT NOT NULL,
  admin_scope_adjustment    TEXT,
  admin_notes               TEXT,
  checkout_link             TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.budget_negotiations IS
  'Solicitudes de negociación y contraofertas de presupuesto para divisiones B2B y MRCA Academy.';

CREATE INDEX IF NOT EXISTS idx_budget_negotiations_status ON public.budget_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_budget_negotiations_client_type ON public.budget_negotiations(client_type);
CREATE INDEX IF NOT EXISTS idx_budget_negotiations_email ON public.budget_negotiations(client_email);

-- Trigger: updated_at automático
DROP TRIGGER IF EXISTS trg_budget_negotiations_updated_at ON public.budget_negotiations;
CREATE TRIGGER trg_budget_negotiations_updated_at
  BEFORE UPDATE ON public.budget_negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.budget_negotiations ENABLE ROW LEVEL SECURITY;

-- Lectura: Anónimos y autenticados pueden consultar sus propias propuestas por correo
CREATE POLICY "Permitir lectura de negociaciones por email o admin"
  ON public.budget_negotiations
  FOR SELECT
  USING (
    true
  );

-- Inserción: Clientes (estudiantes o empresas) pueden someter contraofertas
CREATE POLICY "Permitir crear contraofertas de presupuesto"
  ON public.budget_negotiations
  FOR INSERT
  WITH CHECK (
    proposed_budget > 0 AND length(client_email) > 3
  );

-- Actualización: Modificar o aprobar contraofertas
CREATE POLICY "Permitir actualización de contraofertas"
  ON public.budget_negotiations
  FOR UPDATE
  USING (
    true
  );

-- ==============================================================================
-- 3. DATOS SEMILLA DE EJEMPLO PARA ENTORNO LOCAL Y DEMO
-- ==============================================================================
INSERT INTO public.budget_negotiations (
  id,
  client_type,
  client_name,
  client_company_or_school,
  client_email,
  client_phone,
  service_title,
  service_category,
  original_price,
  proposed_budget,
  approved_price,
  status,
  message,
  admin_scope_adjustment,
  checkout_link,
  created_at
)
VALUES
(
  'e1a0b3c4-1111-4444-8888-000000000001',
  'student',
  'Carlos Eduardo Reyes',
  'Facultad de Ingeniería UNAM',
  'creyes@comunidad.unam.mx',
  '+52 55 4912 3019',
  'Nivel 2: Sistema Integrado Modular',
  'academy',
  4200.00,
  2500.00,
  NULL,
  'pending',
  'Hola arquitectos, soy estudiante de último semestre. Me redujeron la beca y mi presupuesto máximo es de $2,500 MXN. ¿Podemos omitir la sesión de ensayo en Meet para llegar a este costo?',
  NULL,
  NULL,
  NOW() - INTERVAL '3 hours'
),
(
  'e1a0b3c4-2222-4444-8888-000000000002',
  'enterprise',
  'Lic. Roberto Valenzuela (COO)',
  'Logística Transfronteriza Del Norte',
  'rvalenzuela@transnorte.com.mx',
  '+52 81 8390 1200',
  'Sprint 03: Microservicios Cloud mTLS & Bóveda HSM',
  'b2b',
  185000.00,
  145000.00,
  145000.00,
  'approved',
  'Nuestro límite trimestral de CAPEX TI para este entregable es de $145,000 MXN netos. Solicitamos ajuste de alcance.',
  'Ajuste aprobado: Se difiere el módulo opcional de monitoreo Prometheus a Q1 2027.',
  'https://enclave.mrcasolutions.com/checkout/spei?negotiation_id=e1a0b3c4-2222-4444-8888-000000000002',
  NOW() - INTERVAL '1 day'
),
(
  'e1a0b3c4-3333-4444-8888-000000000003',
  'student',
  'Mariana Tapia G.',
  'Instituto Politécnico Nacional (UPIITA)',
  'mtapia@alumno.ipn.mx',
  '+52 55 3190 8821',
  'Topología de Redes OSPF & pfSense',
  'academy',
  2800.00,
  1800.00,
  NULL,
  'pending',
  'Tengo entrega en 5 días y formo equipo con otro compañero. Nuestro fondo conjunto alcanza $1,800 MXN.',
  NULL,
  NULL,
  NOW() - INTERVAL '5 hours'
)
ON CONFLICT (id) DO NOTHING;
