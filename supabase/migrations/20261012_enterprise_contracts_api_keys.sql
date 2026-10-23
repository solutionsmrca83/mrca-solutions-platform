-- ==============================================================================
-- MCRA SOLUTIONS — ENTERPRISE B2B CONTRACTS & API KEYS SCHEMA MIGRATION
-- Fecha: 2026-10-12
-- Soporte para:
-- 1. Gestor de Plantillas de Contrato (contract_templates)
-- 2. Contratos de Clientes con Firma Criptográfica (client_contracts)
-- 3. Consola de API Keys de Desarrollador (client_api_keys)
-- 4. Row Level Security (RLS) estricto Zero-Trust
-- ==============================================================================

-- ============================================================
-- 0. EXTENSIONS & DEFENSIVE HELPER FUNCTIONS
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
-- 1. TABLA: contract_templates (Plantillas Base de Contratos)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'nda',
  category_label  TEXT NOT NULL,
  description     TEXT,
  base_content    TEXT NOT NULL,
  default_sla     TEXT DEFAULT '99.98% Uptime // Enclave mTLS',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.contract_templates IS
  'Plantillas maestras de contratos (NDA, Desarrollo de Software, Pentesting, Escrow Dual) gestionadas por Admins.';

-- ==============================================================================
-- 2. TABLA: client_contracts (Contratos Asignados & Firma Digital)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.client_contracts (
  id              TEXT PRIMARY KEY DEFAULT ('CTR-' || to_char(NOW(), 'YYYY') || '-' || substr(md5(random()::text), 1, 6)),
  client_id       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  template_id     TEXT REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending_signature' CHECK (status IN ('draft', 'pending_signature', 'signed', 'revoked')),
  signature_data  TEXT, -- Almacena vector geométrico / SVG / PNG Base64 de la firma
  signature_hash  TEXT, -- Hash SHA-256 inmutable de la firma y documento
  signer_email    TEXT,
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.client_contracts IS
  'Contratos emitidos para clientes específicos con registro de firma digital vectorial y sellado criptográfico.';

CREATE INDEX IF NOT EXISTS idx_client_contracts_client ON public.client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_status ON public.client_contracts(status);

-- ==============================================================================
-- 3. TABLA: client_api_keys (Developer Portal API Credentials)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.client_api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Production API Key (Cluster Alpha)',
  key_prefix      TEXT NOT NULL DEFAULT 'mcra_live_sec_',
  key_hash        TEXT NOT NULL,
  environment     TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'revoked')),
  rate_limit      TEXT NOT NULL DEFAULT '5,000 req/min',
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_api_keys_client ON public.client_api_keys(client_id);

-- ==============================================================================
-- 4. TRIGGERS: updated_at automático
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_contract_templates_updated_at ON public.contract_templates;
CREATE TRIGGER trg_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_client_contracts_updated_at ON public.client_contracts;
CREATE TRIGGER trg_client_contracts_updated_at
  BEFORE UPDATE ON public.client_contracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_client_api_keys_updated_at ON public.client_api_keys;
CREATE TRIGGER trg_client_api_keys_updated_at
  BEFORE UPDATE ON public.client_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES — Zero-Trust
-- ==============================================================================

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contracts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_api_keys     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Políticas para contract_templates:
-- Lectura: Todos los usuarios autenticados.
-- Modificación: Solo Admins (Jefe / Socio).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "templates__read_auth" ON public.contract_templates;
CREATE POLICY "templates__read_auth"
  ON public.contract_templates FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "templates__admin_all" ON public.contract_templates;
CREATE POLICY "templates__admin_all"
  ON public.contract_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- Políticas para client_contracts:
-- Clientes: Solo pueden ver e insertar firmas en sus propios contratos.
-- Admins: Acceso total para emitir, leer, actualizar y auditar contratos.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "contracts__client_read_own" ON public.client_contracts;
CREATE POLICY "contracts__client_read_own"
  ON public.client_contracts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contracts__client_update_own" ON public.client_contracts;
CREATE POLICY "contracts__client_update_own"
  ON public.client_contracts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contracts__admin_insert" ON public.client_contracts;
CREATE POLICY "contracts__admin_insert"
  ON public.client_contracts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contracts__admin_delete" ON public.client_contracts;
CREATE POLICY "contracts__admin_delete"
  ON public.client_contracts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- Políticas para client_api_keys:
-- Los clientes solo acceden a sus propias llaves; Admins auditan todas.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "api_keys__client_own_read" ON public.client_api_keys;
CREATE POLICY "api_keys__client_own_read"
  ON public.client_api_keys FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "api_keys__client_own_manage" ON public.client_api_keys;
CREATE POLICY "api_keys__client_own_manage"
  ON public.client_api_keys FOR ALL
  TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = client_id
    OR public.is_admin()
  );

-- ==============================================================================
-- 6. DATOS SEMILLA (INITIAL SEED): Plantillas Base de Contratos
-- ==============================================================================

INSERT INTO public.contract_templates (id, title, category, category_label, description, default_sla, base_content)
VALUES
(
  'tmpl_nda_v4',
  'NDA - Acuerdo de Confidencialidad & Sigilo Criptográfico Zero-Trust',
  'nda',
  'ACUERDO NDA / CONFIDENCIALIDAD',
  'Protección estricta de propiedad intelectual, repositorios de código privados, arquitectura de red mTLS y credenciales de acceso.',
  'Vigencia de 5 Años // Enclave Cifrado',
  'ACUERDO BILATERAL DE CONFIDENCIALIDAD Y PROTECCIÓN CRIPTOGRÁFICA (NDA ZERO-TRUST)

ENTRE LAS PARTES:
Por una parte, MCRA SOLUTIONS S.A.P.I. DE C.V., representada por su Enclave de Dirección Ejecutiva y Ciberseguridad (Jefe & Socio), y por la otra parte:
EMPRESA BENEFICIARIA: {{EMPRESA_CLIENTE}}
REPRESENTANTE LEGAL: {{REPRESENTANTE_CLIENTE}}
CORREO INSTITUCIONAL: {{CORREO_CLIENTE}}

CLÁUSULA PRIMERA — OBJETO DEL SIGILO TECNOLÓGICO:
Las partes intercambiarán arquitectura de software, diagramas de microservicios, esquemas de bases de datos PostgreSQL con RLS y configuraciones de red eBPF/Cilium con el fin de evaluar y ejecutar servicios de ingeniería avanzada.

CLÁUSULA SEGUNDA — NO REVELACIÓN Y PROTECCIÓN CRIPTOGRÁFICA:
Toda información compartida se considera Carga Útil Confidencial Nivel 4 (FIPS 140-3). Queda estrictamente prohibida su divulgación, copia o ingesta en modelos de inteligencia artificial públicos sin autorización expresa por escrito sellada criptográficamente por MCRA Solutions.

CLÁUSULA TERCERA — VIGENCIA Y PENALIZACIÓN CONVENCIONAL:
El presente acuerdo tendrá una vigencia ininterrumpida de cinco (5) años a partir de la firma digital. En caso de filtración deliberada o negligencia comprobada de secretos industriales o código fuente, la parte infractora cubrirá una pena convencional equivalente a los daños directos calculados en el Enclave Arbitral Tecnológico de la Ciudad de México.

SLA ASIGNADO: {{SLA_ASIGNADO}}
PRESUPUESTO ESTIMADO / MARCO: {{PRESUPUESTO_MARCO}}
FECHA DE EMISIÓN: {{FECHA_EMISION}}
HASH DE INTEGRIDAD PREVIO: {{HASH_SHA256}}'
),
(
  'tmpl_software_dev_v2',
  'Contrato Marco de Desarrollo de Software & Microservicios Cloud',
  'software_dev',
  'DESARROLLO DE SOFTWARE & CLOUD',
  'Construcción de aplicaciones web de alta concurrencia en Next.js/Rust, microservicios blindados y pipelines CI/CD seguros.',
  '99.98% Uptime // Sprint Quincenal',
  'CONTRATO MARCO DE INGENIERÍA DE SOFTWARE & ARQUITECTURA DISTRIBUIDA B2B

CONTRATANTE: {{EMPRESA_CLIENTE}}
REPRESENTANTE TÉCNICO: {{REPRESENTANTE_CLIENTE}}
CONTACTO DE NOTIFICACIONES: {{CORREO_CLIENTE}}
PRESTADOR DEL SERVICIO: MCRA SOLUTIONS (División Ingeniería de Sistemas)

CLÁUSULA PRIMERA — ALCANCE DE LA INGENIERÍA:
MCRA Solutions desarrollará la plataforma tecnológica especificada en la propuesta técnica adjunta, implementando:
1. Interfaces reactivas de alta velocidad en Next.js 15 y React 19 con diseño ciber-estético Midnight Blue.
2. Backends de baja latencia con aislamiento de datos multi-inquilino mediante Row Level Security (RLS).
3. Pipelines de integración continua blindados con auditoría de vulnerabilidades estáticas (SAST).

CLÁUSULA SEGUNDA — PROPIEDAD INTELECTUAL Y ENTREGA:
Los entregables de código fuente, imágenes de contenedor Docker y esquemas SQL serán transferidos en su totalidad a {{EMPRESA_CLIENTE}} una vez liquidado el importe acordado mediante el mecanismo de Escrow pactado.

CLÁUSULA TERCERA — ACUERDO DE NIVEL DE SERVICIO (SLA):
MCRA Solutions garantiza una disponibilidad operativa mínima de {{SLA_ASIGNADO}} en la infraestructura desplegada bajo nuestra administración directa.

MONTO TOTAL DEL PROYECTO: {{PRESUPUESTO_MARCO}}
CONDICIONES DE PAGO: 50% Anticipo vía Stripe Escrow / 50% Contra Entrega y Pruebas UAT.
SELLADO EN ENCLAVE: {{FECHA_EMISION}}'
),
(
  'tmpl_pentest_v1',
  'Acuerdo de Auditoría Ofensiva Pentest Kali Linux & Hardening Zero-Trust',
  'pentest',
  'PENTESTING & CIBERSEGURIDAD OFENSIVA',
  'Reglas de combate para pruebas de penetración continuas (Red Team), evasión de amenazas zero-day y certificación SOC-2.',
  'Enclave Nivel 4 // Reporte Forense en 72h',
  'AUTORIZACIÓN FORMAL DE PRUEBAS DE PENETRACIÓN Y REGLAS DE COMBATE (ROE)

OBJETIVO AUTORIZADO:
EMPRESA AUDITADA: {{EMPRESA_CLIENTE}}
RESPONSABLE DE SEGURIDAD: {{REPRESENTANTE_CLIENTE}}
CORREO CISO: {{CORREO_CLIENTE}}
AUDITOR PRINCIPAL: MCRA SOLUTIONS (Equipo Kali Red Team / CISO Jefe)

CLÁUSULA PRIMERA — REGLAS DE COMBATE (RULES OF ENGAGEMENT):
{{EMPRESA_CLIENTE}} otorga autorización expresa y formal a MCRA Solutions para ejecutar pruebas de seguridad ofensiva, análisis de superficie de ataque, simulación de ataques DoS controlados, pentesting de APIs GraphQL/REST e inspección de contenedores.

CLÁUSULA SEGUNDA — EXCLUSIÓN DE RESPONSABILIDAD PENAL:
Ambas partes reconocen que los vectores de prueba se ejecutan en estricto cumplimiento del mandato de hardening defensivo, operando bajo estándar OWASP Top 10 y marco NIST CSF.

CLÁUSULA TERCERA — ENTREGA DE REPORTE CRIPTOGRÁFICO:
Los hallazgos de vulnerabilidades críticas serán comunicados en un plazo máximo de 24 horas y el informe final cifrado con AES-256 dentro de las 72 horas posteriores al cierre del ejercicio.

SLA DE RESPUESTA A INCIDENTES: {{SLA_ASIGNADO}}
HONORARIOS DEL PENTEST: {{PRESUPUESTO_MARCO}}
REGISTRADO EN KERNEL: {{FECHA_EMISION}}'
),
(
  'tmpl_escrow_v1',
  'Contrato de Custodia Escrow Dual (Stripe & SPEI Inmediato Banxico)',
  'escrow',
  'ESCROW & CUSTODIA FINANCIERA',
  'Garantía de fondos protegidos con liberación sujeta a validación criptográfica simultánea por el Jefe (CISO) y Socio (CTO).',
  'Dispersión Condicionada 2-de-2 Firmas',
  'ACUERDO DE CUSTODIA FIDUCIARIA TECNOLÓGICA (ESCROW DUAL B2B)

PARTES INTERVINIENTES:
CLIENTE PAGADOR: {{EMPRESA_CLIENTE}}
APODERADO DE FONDOS: {{REPRESENTANTE_CLIENTE}} ({{CORREO_CLIENTE}})
ADMINISTRADOR ESCROW: MCRA SOLUTIONS S.A.P.I. DE C.V.

CLÁUSULA PRIMERA — CONSIGNACIÓN DE FONDOS:
Los importes por concepto de desarrollo o auditoría serán depositados en la cuenta concentradora segregada bajo protocolo dual Stripe Escrow o SPEI Inmediato Banxico.

CLÁUSULA SEGUNDA — REGLA CRIPTOGRÁFICA DE DISPERSIÓN DUAL:
Ningún fondo será liberado sin la presentación simultánea de:
1. Firma digital del Cliente validando la recepción satisfactoria del hito técnico.
2. Firma dual criptográfica de los Administradores de MCRA Solutions (Jefe y Socio).

MONTO EN CUSTODIA: {{PRESUPUESTO_MARCO}}
MÉTODO DE PAGO: SPEI Banxico / Stripe Escrow Dual
SLA DE DISPERSIÓN TRAS VALIDACIÓN: {{SLA_ASIGNADO}}
EMITIDO EN: {{FECHA_EMISION}}'
)
ON CONFLICT (id) DO NOTHING;
