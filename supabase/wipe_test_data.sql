-- ==============================================================================
-- MRCA SOLUTIONS — SAFE PRODUCTION DATABASE CLEANUP SCRIPT
-- Archivo: supabase/wipe_test_data.sql
--
-- PROPÓSITO:
--   Elimina de forma segura TODOS los registros de prueba / desarrollo de las
--   tablas transaccionales y de demostración para iniciar producción en cero,
--   SIN afectar la configuración crítica ni el acceso de Superadmin.
--
-- LO QUE SE CONSERVA INTACTO (NO SE BORRA):
--   1. Usuario(s) `superadmin` / `owner` en `auth.users`, `public.user_profiles`
--      y `public.profiles` (si existiera).
--   2. Matriz de precios sembrada en `public.service_pricing`.
--   3. Plantillas maestras legales en `public.contract_templates`.
--   4. Configuración operativa del bot en `public.bot_settings`.
--   5. Paquetes oficiales publicados en `public.software_catalog` (si deseas
--      vaciar también el catálogo POS, descomenta la línea indicada abajo).
--
-- INSTRUCCIONES:
--   Ejecutar en Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  target_tables TEXT[] := ARRAY[
    -- CRM, Bot y Soporte
    'bot_chat_logs',
    'support_tickets',
    'crm_leads',
    'potential_leads',
    -- Contratos, Propuestas y Proyectos (nombres actuales y posibles alias)
    'client_contracts',
    'contracts',
    'client_project_proposals',
    'projects',
    'kanban_tickets',
    -- Finanzas SPEI y Negociaciones
    'invoices',
    'ledger_entries',
    'budget_negotiations',
    -- Bóveda, Mensajería, API Keys y Sesiones
    'secure_messages',
    'vault_files',
    'client_api_keys',
    'stealth_sessions',
    -- Bitácoras de auditoría de prueba
    'system_audit_logs'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I;', tbl);
      RAISE NOTICE 'Registros de prueba eliminados en public.%', tbl;
    ELSE
      RAISE NOTICE 'Tabla public.% no existe (omitida de forma segura).', tbl;
    END IF;
  END LOOP;
END $$;

-- Nota sobre `public.audit_log`:
-- Esta tabla posee la regla inmutable `audit_log_no_delete`. Si necesitas limpiarla
-- únicamente antes del lanzamiento inicial, elimina temporalmente la regla, borra
-- las filas de desarrollo y vuelve a crearla manualmente.

-- Nota sobre `public.software_catalog`:
-- Si sembraste paquetes demo en `software_catalog` y prefieres subirlos desde
-- cero en /admin -> Catálogo Software & POS, descomenta la siguiente línea:
-- DELETE FROM public.software_catalog;

-- Verificación rápida post-limpieza (confirma que precios y superadmin siguen intactos):
SELECT
  (SELECT COUNT(*) FROM public.service_pricing) AS tarifas_bot_conservadas,
  (SELECT COUNT(*) FROM public.crm_leads) AS crm_leads_restantes,
  (SELECT COUNT(*) FROM public.support_tickets) AS support_tickets_restantes,
  (SELECT COUNT(*) FROM public.bot_chat_logs) AS bot_chat_logs_restantes;

COMMIT;

-- ==============================================================================
-- SECCIÓN OPCIONAL (COMENTADA): ELIMINAR CUENTAS DE PRUEBA NO-ADMINISTRADORAS
-- ==============================================================================
-- Descomenta y ejecuta este bloque ÚNICAMENTE si deseas borrar usuarios de prueba
-- (clientes/estudiantes) manteniendo siempre protegidos a superadmin/owner y al
-- correo maestro `solutionsmrca83@gmail.com`.
--
-- BEGIN;
--
-- -- 1. Limpiar cuentas de prueba en `public.user_profiles` (si existe):
-- DO $$
-- BEGIN
--   IF to_regclass('public.user_profiles') IS NOT NULL THEN
--     DELETE FROM public.user_profiles
--     WHERE role::text NOT IN ('superadmin', 'owner')
--       AND id NOT IN (
--         SELECT id FROM auth.users
--         WHERE LOWER(email) IN (
--           'solutionsmrca83@gmail.com',
--           'jefe@mrcasolutions.com',
--           'founder@mrcasolutions.com',
--           'owner@mrcasolutions.com'
--         )
--       );
--   END IF;
-- END $$;
--
-- -- 2. Limpiar cuentas de prueba en `public.profiles` (si existiera dicha tabla):
-- DO $$
-- BEGIN
--   IF to_regclass('public.profiles') IS NOT NULL THEN
--     DELETE FROM public.profiles
--     WHERE LOWER(COALESCE(role::text, '')) NOT IN ('superadmin', 'owner')
--       AND id NOT IN (
--         SELECT id FROM auth.users
--         WHERE LOWER(email) IN (
--           'solutionsmrca83@gmail.com',
--           'jefe@mrcasolutions.com',
--           'founder@mrcasolutions.com',
--           'owner@mrcasolutions.com'
--         )
--       );
--   END IF;
-- END $$;
--
-- -- 3. (Opcional) Eliminar también de `auth.users` las cuentas no-superadmin:
-- -- DELETE FROM auth.users
-- -- WHERE LOWER(email) NOT IN (
-- --   'solutionsmrca83@gmail.com',
-- --   'jefe@mrcasolutions.com',
-- --   'founder@mrcasolutions.com',
-- --   'owner@mrcasolutions.com'
-- -- )
-- -- AND LOWER(COALESCE(raw_user_meta_data->>'role', '')) NOT IN ('superadmin', 'owner');
--
-- COMMIT;
