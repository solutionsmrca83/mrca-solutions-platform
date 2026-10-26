-- ==============================================================================
-- MCRA SOLUTIONS — ZERO-TRUST RBAC HIERARCHY & ADMIN INITIALIZATION MIGRATION
-- Date: 2026-10-25
-- Description:
-- 1. Safely extends user_role ENUM with 'superadmin', 'partner', and 'employee'
-- 2. Upgrades public.is_admin() and public.handle_new_user() to prevent enum lockouts
-- ==============================================================================

-- 1. Extend user_role ENUM safely (idempotent block)
DO $$
BEGIN
  -- Add 'superadmin' if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'user_role' AND pg_enum.enumlabel = 'superadmin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
  END IF;

  -- Add 'partner' if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'user_role' AND pg_enum.enumlabel = 'partner'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'partner';
  END IF;

  -- Add 'employee' if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'user_role' AND pg_enum.enumlabel = 'employee'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'employee';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- 2. Update is_admin() function to support all administrative tiers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'owner', 'partner', 'stealth_partner', 'employee')
  );
$$;

-- 3. Robust trigger function that prevents trigger crashes on new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role := 'client';
  raw_role text;
BEGIN
  raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'client')));
  
  -- Safe role assignment with graceful fallback for enum compatibility
  IF raw_role = 'superadmin' THEN
    BEGIN
      assigned_role := 'superadmin'::user_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'owner'::user_role;
    END;
  ELSIF raw_role IN ('partner', 'stealth_partner') THEN
    BEGIN
      assigned_role := 'partner'::user_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'stealth_partner'::user_role;
    END;
  ELSIF raw_role = 'employee' THEN
    BEGIN
      assigned_role := 'employee'::user_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'client'::user_role;
    END;
  ELSIF raw_role = 'owner' THEN
    assigned_role := 'owner'::user_role;
  ELSE
    assigned_role := 'client'::user_role;
  END IF;

  INSERT INTO public.user_profiles (id, role, full_name)
  VALUES (
    NEW.id,
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
        updated_at = NOW();

  RETURN NEW;
END;
$$;
