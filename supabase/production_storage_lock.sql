-- ==============================================================================
-- MRCA SOLUTIONS — PRODUCTION STORAGE LOCK (`software-releases` PRIVATE BUCKET)
-- Archivo: supabase/production_storage_lock.sql
-- Propósito:
--   1. Garantizar que el bucket `software-releases` sea estrictamente PRIVADO
--      (public = FALSE) para impedir descargas directas sin autorización.
--   2. Permitir SELECT / generación de URLs firmadas (60s) ÚNICAMENTE a roles
--      autenticados `client`, `partner` y `superadmin` (denegando `student` y `anon`).
--   3. Restringir INSERT, UPDATE y DELETE exclusivamente a `superadmin`.
-- ==============================================================================

-- 1. Asegurar bucket estrictamente privado
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

-- 2. Funciones RBAC defensivas (idempotentes)
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

CREATE OR REPLACE FUNCTION public.can_download_software_releases()
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

-- 3. Limpiar cualquier política previa y aplicar bloqueo estricto
DROP POLICY IF EXISTS "software_releases__public_read" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__b2b_download_no_students" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_upload" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_update" ON storage.objects;
DROP POLICY IF EXISTS "software_releases__superadmin_delete" ON storage.objects;

-- SELECT / Signed URLs (60s): SOLO client, partner y superadmin autenticados.
-- Deniega explícitamente `anon` y `student`.
CREATE POLICY "software_releases__b2b_download_no_students"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'software-releases'
    AND public.can_download_software_releases()
    AND NOT public.is_student()
  );

-- INSERT / UPDATE / DELETE: EXCLUSIVO superadmin
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
