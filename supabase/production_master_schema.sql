-- ==============================================================================
-- MRCA SOLUTIONS — PRODUCTION MASTER SCHEMA (CRM, PRICING, CATALOG & STORAGE)
-- Archivo: supabase/production_master_schema.sql
-- Idempotente y listo para producción en Supabase SQL Editor.
--
-- Incluye:
--   1. Funciones RBAC estrictas (`is_admin`, `is_superadmin`, `is_student`,
--      `can_access_b2b_software_catalog`)
--   2. `service_pricing`: Matriz de precios MXN editable SOLO por `superadmin`
--   3. `software_catalog`: Catálogo POS/Software con `zip_file_path` y
--      `manual_file_path`, SELECT solo para `superadmin`/`partner`/`client`
--      (DENEGADO explícitamente a `student` y `anon`)
--   4. `crm_leads`: Onboarding automático + `custom_adjusted_price` (solo `superadmin`)
--   5. `support_tickets`, `bot_chat_logs` y `bot_settings`
--   6. Storage bucket privado `software-releases` (`public = false`) con URLs
--      firmadas de 60s solo para `client`, `partner` y `superadmin`
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 0. FUNCIONES DE GOBERNANZA RBAC Y AISLAMIENTO ESTRICTO
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
  OR LOWER(COALESCE(auth.jwt()->'user_metadata'->>'role', '')) IN (
    'superadmin', 'owner', 'partner', 'stealth_partner', 'employee', 'admin'
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

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role::text = 'student'
  )
  OR LOWER(COALESCE(auth.jwt()->'user_metadata'->>'role', '')) = 'student'
  OR LOWER(COALESCE(auth.jwt()->'app_metadata'->>'role', '')) = 'student';
$$;

-- Permite lectura de software_catalog y descargas de software-releases SOLO a
-- usuarios autenticados con rol superadmin, partner o client (DENIEGA student y anon).
CREATE OR REPLACE FUNCTION public.can_access_b2b_software_catalog()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND NOT public.is_student()
    AND (
      public.is_superadmin()
      OR EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role::text IN ('superadmin', 'owner', 'partner', 'stealth_partner', 'client')
      )
      OR LOWER(COALESCE(auth.jwt()->'user_metadata'->>'role', '')) IN (
        'superadmin', 'owner', 'partner', 'stealth_partner', 'client'
      )
    );
$$;

-- ==============================================================================
-- 1. TABLA: service_pricing (Matriz Dinámica de Precios — Bot Cotizador)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.service_pricing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type        TEXT NOT NULL,
  scope_tier          TEXT NOT NULL
                      CHECK (scope_tier IN (
                        'Esencial / PyME',
                        'Profesional / Empresarial',
                        'Alto Alcance / A la Medida'
                      )),
  min_price_mxn       NUMERIC(12,2) NOT NULL CHECK (min_price_mxn >= 0),
  max_price_mxn       NUMERIC(12,2) NOT NULL CHECK (max_price_mxn >= min_price_mxn),
  delivery_time       TEXT NOT NULL,
  advance_percentage  INTEGER NOT NULL DEFAULT 25 CHECK (advance_percentage IN (25, 40)),
  is_monthly          BOOLEAN NOT NULL DEFAULT FALSE,
  summary             TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_pricing_unique_pair UNIQUE (service_type, scope_tier)
);

CREATE INDEX IF NOT EXISTS idx_service_pricing_service ON public.service_pricing (service_type);

DROP TRIGGER IF EXISTS trg_service_pricing_updated_at ON public.service_pricing;
CREATE TRIGGER trg_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.service_pricing
  (service_type, scope_tier, min_price_mxn, max_price_mxn, delivery_time, advance_percentage, is_monthly, summary)
VALUES
  ('Desarrollo Web & SaaS', 'Esencial / PyME', 28000, 55000, '2 a 4 semanas', 25, FALSE, 'Sitio corporativo o aplicación web inicial con panel administrable y alta velocidad.'),
  ('Desarrollo Web & SaaS', 'Profesional / Empresarial', 65000, 145000, '5 a 8 semanas', 25, FALSE, 'Plataforma web o SaaS B2B completa con roles de usuario, base de datos blindada e integraciones.'),
  ('Desarrollo Web & SaaS', 'Alto Alcance / A la Medida', 160000, 340000, '10 a 16 semanas', 40, FALSE, 'Ecosistema SaaS multi-empresa a la medida, alta concurrencia y SLA garantizado.'),

  ('Auditoría de Ciberseguridad', 'Esencial / PyME', 22000, 45000, '1 a 2 semanas', 25, FALSE, 'Evaluación integral de superficie expuesta, diagnóstico ejecutivo y plan de mitigación.'),
  ('Auditoría de Ciberseguridad', 'Profesional / Empresarial', 55000, 120000, '2 a 4 semanas', 25, FALSE, 'Auditoría profunda de aplicaciones, APIs y nube con reporte ejecutivo y remediación.'),
  ('Auditoría de Ciberseguridad', 'Alto Alcance / A la Medida', 135000, 290000, '4 a 8 semanas', 40, FALSE, 'Evaluación corporativa integral, cumplimiento normativo y blindaje continuo crítico.'),

  ('Infraestructura y Nube', 'Esencial / PyME', 25000, 50000, '1 a 3 semanas', 25, FALSE, 'Configuración segura en la nube, respaldos automatizados y optimización de costos.'),
  ('Infraestructura y Nube', 'Profesional / Empresarial', 60000, 135000, '3 a 6 semanas', 25, FALSE, 'Migración empresarial sin interrupciones, redundancia activa y monitoreo 24/7.'),
  ('Infraestructura y Nube', 'Alto Alcance / A la Medida', 150000, 320000, '6 a 12 semanas', 40, FALSE, 'Arquitectura multi-región de alta disponibilidad (SLA 99.99%) y recuperación ante desastres.'),

  ('Soporte y Mantenimiento Técnico', 'Esencial / PyME', 12000, 24000, 'Activación en 48 horas', 25, TRUE, 'Póliza mensual de monitoreo preventivo, actualizaciones de seguridad y soporte.'),
  ('Soporte y Mantenimiento Técnico', 'Profesional / Empresarial', 28000, 58000, 'Activación en 24 a 48 horas', 25, TRUE, 'Soporte prioritario B2B con mesa de ayuda dedicada, mejoras evolutivas y SLA.'),
  ('Soporte y Mantenimiento Técnico', 'Alto Alcance / A la Medida', 65000, 140000, 'Activación prioritaria en 24 horas', 40, TRUE, 'Cobertura dedicada 24/7 para operaciones críticas con continuidad garantizada.')
ON CONFLICT (service_type, scope_tier) DO NOTHING;

-- ==============================================================================
-- 2. TABLA: software_catalog (POS / Software Listo — DENEGADO a student y anon)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.software_catalog (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  TEXT NOT NULL,
  category               TEXT NOT NULL
                         CHECK (category IN (
                           'Punto de Venta (POS)',
                           'Gestión e Inventario',
                           'Automatización',
                           'Sistema Empresarial'
                         )),
  version                TEXT NOT NULL DEFAULT 'v1.0.0',
  short_description      TEXT NOT NULL,
  features               TEXT[] NOT NULL DEFAULT '{}',
  system_requirements    TEXT NOT NULL DEFAULT 'Windows 10/11 o macOS/Linux, 4 GB RAM, 500 MB libres',
  price_mxn              NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_mxn >= 0),
  zip_file_path          TEXT NOT NULL,
  manual_file_path       TEXT,
  installation_guide_md  TEXT NOT NULL DEFAULT '',
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migración idempotente si existían columnas previas zip_download_url / manual_download_url
DO $$
BEGIN
  ALTER TABLE public.software_catalog ADD COLUMN IF NOT EXISTS zip_file_path TEXT;
  ALTER TABLE public.software_catalog ADD COLUMN IF NOT EXISTS manual_file_path TEXT;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'software_catalog' AND column_name = 'zip_download_url'
  ) THEN
    EXECUTE 'UPDATE public.software_catalog SET zip_file_path = COALESCE(zip_file_path, zip_download_url) WHERE zip_file_path IS NULL';
    ALTER TABLE public.software_catalog ALTER COLUMN zip_download_url DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'software_catalog' AND column_name = 'manual_download_url'
  ) THEN
    EXECUTE 'UPDATE public.software_catalog SET manual_file_path = COALESCE(manual_file_path, manual_download_url) WHERE manual_file_path IS NULL';
  END IF;

  UPDATE public.software_catalog SET zip_file_path = '' WHERE zip_file_path IS NULL;
  ALTER TABLE public.software_catalog ALTER COLUMN zip_file_path SET NOT NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_software_catalog_active   ON public.software_catalog (is_active);
CREATE INDEX IF NOT EXISTS idx_software_catalog_category ON public.software_catalog (category);
CREATE INDEX IF NOT EXISTS idx_software_catalog_created  ON public.software_catalog (created_at DESC);

DROP TRIGGER IF EXISTS trg_software_catalog_updated_at ON public.software_catalog;
CREATE TRIGGER trg_software_catalog_updated_at
  BEFORE UPDATE ON public.software_catalog
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.software_catalog
  (title, category, version, short_description, features, system_requirements, price_mxn, zip_file_path, manual_file_path, installation_guide_md, is_active)
SELECT
  'Punto de Venta MRCA Pro',
  'Punto de Venta (POS)',
  'v3.2.0',
  'Sistema de Punto de Venta empresarial listo para instalar con control de caja, lector de códigos de barras, corte diario y preparación para facturación CFDI 4.0.',
  ARRAY[
    'Cobro rápido con lector de códigos de barras y tickets térmicos 58mm/80mm',
    'Control de inventario en tiempo real con alertas de stock mínimo',
    'Cortes de caja por turno, cajero y método de pago (Efectivo, Tarjeta, SPEI)',
    'Reportes ejecutivos exportables a Excel y PDF listos para contabilidad',
    'Modo offline resiliente con sincronización automática al reconectar'
  ],
  'Windows 10/11 (64-bit) o Linux Ubuntu 22.04+, 4 GB RAM mínimo (8 GB recomendado), 500 MB libres, impresora térmica opcional.',
  14900,
  'packages/mrca-pos-pro-v3.2.0.zip',
  'manuals/manual-usuario-mrca-pos-pro-v3.2.pdf',
  E'# Manual de Instalación y Uso — Punto de Venta MRCA Pro (v3.2.0)\n\n## 1. Requisitos Previos\n- Equipo con Windows 10/11 (64-bit) o Linux.\n- Permisos de administrador local para la instalación.\n\n## 2. Pasos de Instalación\n1. Descarga el paquete `.ZIP` desde tu Portal de Clientes.\n2. Descomprime el archivo en `C:\\MRCA-POS\\`.\n3. Ejecuta `Instalador_MRCA_POS.exe` como Administrador y sigue el asistente.\n4. Ingresa la clave de licencia asignada en tu contrato.\n\n## 3. Configuración Inicial\n- Registra los datos fiscales y de sucursal en **Configuración → Empresa**.\n- Configura tu impresora térmica y carga tu catálogo inicial desde Excel.',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.software_catalog WHERE title = 'Punto de Venta MRCA Pro');

INSERT INTO public.software_catalog
  (title, category, version, short_description, features, system_requirements, price_mxn, zip_file_path, manual_file_path, installation_guide_md, is_active)
SELECT
  'MRCA Control de Inventario & Almacenes',
  'Gestión e Inventario',
  'v2.5.1',
  'Suite multi-sucursal para administración de bodegas, entradas/salidas auditadas, kardex completo y valuación de existencias.',
  ARRAY[
    'Gestión multi-almacén con trazabilidad por lote, serie y caducidad',
    'Kardex histórico con bitácora por usuario y aprobaciones de traspasos',
    'Importación y exportación masiva en Excel/CSV',
    'Alertas automatizadas de reabastecimiento y puntos de reorden',
    'Respaldos cifrados programables en un clic'
  ],
  'Windows 10/11 o macOS 13+, 4 GB RAM, 350 MB libres en disco.',
  18500,
  'packages/mrca-inventario-v2.5.1.zip',
  'manuals/manual-mrca-inventario-v2.5.pdf',
  E'# Guía Rápida — MRCA Control de Inventario (v2.5.1)\n\n## 1. Instalación\n1. Descomprime el paquete `.ZIP` en una carpeta dedicada.\n2. Ejecuta `Setup_Inventario_MRCA.exe`.\n3. Selecciona modo **Monousuario** o **Red Local (Multi-Sucursal)**.\n\n## 2. Primer Arranque\n- Crea tus almacenes en **Catálogos → Almacenes**.\n- Carga tu inventario inicial mediante archivo CSV o captura guiada.',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.software_catalog WHERE title = 'MRCA Control de Inventario & Almacenes');

INSERT INTO public.software_catalog
  (title, category, version, short_description, features, system_requirements, price_mxn, zip_file_path, manual_file_path, installation_guide_md, is_active)
SELECT
  'MRCA Automatizador de Reportes y Conciliación',
  'Automatización',
  'v1.8.0',
  'Herramienta empresarial lista para desplegar que automatiza conciliación de pagos SPEI, validación CFDI 4.0 y reportes ejecutivos.',
  ARRAY[
    'Conciliación automatizada de movimientos SPEI contra facturación',
    'Generación programada de reportes PDF y Excel para dirección general',
    'Validación masiva de estructura CFDI 4.0 XML',
    'Ejecución local segura sin exponer información financiera a terceros'
  ],
  'Windows 10/11 o Linux, 4 GB RAM, 300 MB libres en disco.',
  22000,
  'packages/mrca-conciliador-v1.8.0.zip',
  NULL,
  E'# Manual de Instalación — MRCA Automatizador de Reportes (v1.8.0)\n\n## 1. Despliegue Local\n1. Extrae el paquete `.ZIP` en tu equipo administrativo.\n2. Ejecuta `MRCA_Conciliador.exe` y completa el asistente inicial.\n3. Configura las carpetas locales de archivos XML y estados de cuenta CSV.',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.software_catalog WHERE title = 'MRCA Automatizador de Reportes y Conciliación');

-- ==============================================================================
-- 3. TABLA: crm_leads (Con protección estricta de campos para superadmin)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name            TEXT NOT NULL,
  company_name           TEXT NOT NULL,
  email                  TEXT NOT NULL,
  service_type           TEXT NOT NULL,
  project_scope          TEXT NOT NULL DEFAULT 'Profesional / Empresarial',
  estimated_budget       TEXT DEFAULT 'Por definir en consultoría',
  custom_adjusted_price  NUMERIC(12,2) NULL CHECK (custom_adjusted_price IS NULL OR custom_adjusted_price >= 0),
  advance_percentage     INTEGER NOT NULL DEFAULT 25 CHECK (advance_percentage IN (25, 40)),
  status                 TEXT NOT NULL DEFAULT 'Nuevo'
                         CHECK (status IN ('Nuevo', 'Aceptado Automáticamente', 'En Contrato', 'Rechazado')),
  bot_notes              TEXT,
  contract_terms         TEXT,
  auto_accepted          BOOLEAN NOT NULL DEFAULT FALSE,
  session_id             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS project_scope TEXT NOT NULL DEFAULT 'Profesional / Empresarial';
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS custom_adjusted_price NUMERIC(12,2);
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS advance_percentage INTEGER NOT NULL DEFAULT 25;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS contract_terms TEXT;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS session_id TEXT;
  ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_leads_email   ON public.crm_leads (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_crm_leads_status  ON public.crm_leads (status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON public.crm_leads (created_at DESC);

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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
    OR NEW.custom_adjusted_price IS DISTINCT FROM OLD.custom_adjusted_price
    OR NEW.advance_percentage IS DISTINCT FROM OLD.advance_percentage
    OR NEW.contract_terms IS DISTINCT FROM OLD.contract_terms
  ) AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Permiso denegado: Solo superadmin puede modificar nombres, presupuestos, precios ajustados o términos contractuales.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_protect_superadmin_fields ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_protect_superadmin_fields
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_crm_leads_superadmin_fields();

-- ==============================================================================
-- 4. TABLAS: support_tickets, bot_chat_logs y bot_settings
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
    WHERE table_schema = 'public' AND table_name = 'support_tickets'
      AND column_name = 'client_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.support_tickets ALTER COLUMN client_id DROP NOT NULL;
  END IF;

  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.support_tickets'::regclass
      AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%priority%' OR pg_get_constraintdef(oid) ILIKE '%status%')
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

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.bot_chat_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT NOT NULL,
  user_email        TEXT,
  sender            TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message           TEXT NOT NULL,
  action_triggered  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_session ON public.bot_chat_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_bot_chat_logs_action  ON public.bot_chat_logs (action_triggered);

CREATE TABLE IF NOT EXISTS public.bot_settings (
  key         TEXT PRIMARY KEY,
  value_bool  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.bot_settings (key, value_bool)
VALUES ('auto_accept_enabled', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 5. POLÍTICAS ROW LEVEL SECURITY (RLS) ESTRICTAS
-- ==============================================================================

ALTER TABLE public.service_pricing  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_chat_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings     ENABLE ROW LEVEL SECURITY;

-- service_pricing: SELECT público/autenticado; mutaciones SOLO superadmin
DROP POLICY IF EXISTS "service_pricing__public_select" ON public.service_pricing;
CREATE POLICY "service_pricing__public_select"
  ON public.service_pricing FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "service_pricing__superadmin_insert" ON public.service_pricing;
CREATE POLICY "service_pricing__superadmin_insert"
  ON public.service_pricing FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "service_pricing__superadmin_update" ON public.service_pricing;
CREATE POLICY "service_pricing__superadmin_update"
  ON public.service_pricing FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "service_pricing__superadmin_delete" ON public.service_pricing;
CREATE POLICY "service_pricing__superadmin_delete"
  ON public.service_pricing FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- software_catalog: SELECT SOLO superadmin, partner y client (DENIEGA student y anon)
DROP POLICY IF EXISTS "software_catalog__b2b_select_no_students" ON public.software_catalog;
CREATE POLICY "software_catalog__b2b_select_no_students"
  ON public.software_catalog FOR SELECT
  TO authenticated
  USING (
    public.can_access_b2b_software_catalog()
    AND NOT public.is_student()
    AND (is_active = TRUE OR public.is_admin())
  );

DROP POLICY IF EXISTS "software_catalog__superadmin_insert" ON public.software_catalog;
CREATE POLICY "software_catalog__superadmin_insert"
  ON public.software_catalog FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "software_catalog__superadmin_update" ON public.software_catalog;
CREATE POLICY "software_catalog__superadmin_update"
  ON public.software_catalog FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "software_catalog__superadmin_delete" ON public.software_catalog;
CREATE POLICY "software_catalog__superadmin_delete"
  ON public.software_catalog FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- crm_leads
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

-- support_tickets
DROP POLICY IF EXISTS "support_tickets__public_insert" ON public.support_tickets;
CREATE POLICY "support_tickets__public_insert"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "support_tickets__select_own_or_admin" ON public.support_tickets;
CREATE POLICY "support_tickets__select_own_or_admin"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
    OR LOWER(COALESCE(client_email, '')) = LOWER(COALESCE(auth.jwt()->>'email', ''))
  );

DROP POLICY IF EXISTS "support_tickets__update_own_or_admin" ON public.support_tickets;
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

DROP POLICY IF EXISTS "support_tickets__admin_delete" ON public.support_tickets;
CREATE POLICY "support_tickets__admin_delete"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- bot_chat_logs
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

-- bot_settings
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

-- ==============================================================================
-- 6. PRIVATE STORAGE BUCKET: `software-releases` (public = FALSE)
-- • Subida / edición / eliminación: SOLO superadmin
-- • Descarga / URLs firmadas (60s): SOLO client, partner y superadmin
--   autenticados (DENIEGA explícitamente student y anon)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'software-releases',
  'software-releases',
  FALSE,
  52428800, -- 50 MB
  ARRAY[
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "software_releases__public_read" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__b2b_download_no_students" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_upload" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_update" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_delete" ON storage.objects;

CREATE POLICY "software_releases__b2b_download_no_students"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'software-releases'
    AND public.can_access_b2b_software_catalog()
    AND NOT public.is_student()
  );

CREATE POLICY "software_releases__superadmin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'software-releases'
    AND public.is_superadmin()
  );

CREATE POLICY "software_releases__superadmin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'software-releases'
    AND public.is_superadmin()
  )
  WITH CHECK (
    bucket_id = 'software-releases'
    AND public.is_superadmin()
  );

CREATE POLICY "software_releases__superadmin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'software-releases'
    AND public.is_superadmin()
  );
