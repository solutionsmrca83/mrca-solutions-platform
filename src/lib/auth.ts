import { supabase } from './supabase/client';

export const FOUNDER_MASTER_EMAILS = [
  'solutionsmrca83@gmail.com',
  'jefe@mcrasolutions.com',
  'admin@mcrasolutions.com',
  'founder@mcrasolutions.com',
  'owner@mcrasolutions.com',
  'ciso@mcrasolutions.com',
];

export const ADMIN_PRIVILEGED_ROLES = [
  'admin',
  'owner',
  'superadmin',
  'stealth_partner',
  'ciso',
  'director',
  'employee',
];

/**
 * Checks if a given Supabase user has administrative privileges.
 *
 * Verifies against:
 * 1. Founder master email list and @mcrasolutions.com corporate domain.
 * 2. Supabase auth user_metadata or app_metadata role ('admin', 'owner', 'superadmin', etc.).
 * 3. Database query across 'user_profiles', 'profiles', or 'users' tables for the 'role' column.
 */
export async function isUserAdmin(user: any): Promise<boolean> {
  if (!user) return false;

  // 1. Strict Founder Email Check
  const email = (user.email || '').toLowerCase().trim();
  if (email) {
    if (FOUNDER_MASTER_EMAILS.includes(email) || email.endsWith('@mcrasolutions.com')) {
      return true;
    }
  }

  // 2. Supabase Metadata Role Check (raw_user_meta_data or raw_app_meta_data)
  const metaRole = (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.raw_user_meta_data?.role ||
    user.raw_app_meta_data?.role ||
    (typeof user.role === 'string' && user.role !== 'authenticated' ? user.role : undefined)
  )
    ?.toString()
    .toLowerCase()
    .trim();

  if (metaRole && ADMIN_PRIVILEGED_ROLES.includes(metaRole)) {
    return true;
  }

  const userId = user.id;
  if (!userId && !email) return false;

  // 3. Database Queries: Verify 'role' column in user_profiles, profiles, or users tables
  try {
    // 3a. Check 'user_profiles' table by id or email
    let q1 = supabase.from('user_profiles').select('role');
    if (userId) {
      q1 = q1.eq('id', userId);
    } else {
      q1 = q1.eq('email', email);
    }
    const { data: userProfile, error: err1 } = await q1.maybeSingle();

    if (!err1 && userProfile?.role) {
      const r = userProfile.role.toString().toLowerCase().trim();
      if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[AUTH] Error querying user_profiles for admin role:', err);
  }

  try {
    // 3b. Check standard 'profiles' table by id
    if (userId) {
      const { data: profile, error: err2 } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!err2 && profile?.role) {
        const r = profile.role.toString().toLowerCase().trim();
        if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[AUTH] Error querying profiles for admin role:', err);
  }

  try {
    // 3c. Check standard 'users' table by id or email
    let q3 = supabase.from('users').select('role');
    if (userId) {
      q3 = q3.eq('id', userId);
    } else {
      q3 = q3.eq('email', email);
    }
    const { data: dbUser, error: err3 } = await q3.maybeSingle();

    if (!err3 && dbUser?.role) {
      const r = dbUser.role.toString().toLowerCase().trim();
      if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[AUTH] Error querying users table for admin role:', err);
  }

  return false;
}

/**
 * Resolves the effective role ('admin' | 'client' | 'student') for a user.
 */
export async function resolveUserRole(user: any): Promise<'admin' | 'client' | 'student'> {
  if (!user) return 'client';

  const isAdmin = await isUserAdmin(user);
  if (isAdmin) return 'admin';

  const metaRole = (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.raw_user_meta_data?.role ||
    user.raw_app_meta_data?.role
  )
    ?.toString()
    .toLowerCase()
    .trim();

  if (metaRole === 'student') return 'student';

  const userId = user.id;
  if (userId) {
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile?.role) {
        const r = userProfile.role.toString().toLowerCase().trim();
        if (ADMIN_PRIVILEGED_ROLES.includes(r)) return 'admin';
        if (['student', 'client'].includes(r)) {
          return r as 'client' | 'student';
        }
      }
    } catch {
      // Fallback
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role) {
        const r = profile.role.toString().toLowerCase().trim();
        if (ADMIN_PRIVILEGED_ROLES.includes(r)) return 'admin';
        if (['student', 'client'].includes(r)) {
          return r as 'client' | 'student';
        }
      }
    } catch {
      // Fallback
    }
  }

  return 'client';
}

/**
 * Enriches a raw Supabase User object with verified role and admin flags.
 */
export async function getEnrichedUser(user: any): Promise<any> {
  if (!user) return null;
  const role = await resolveUserRole(user);
  const isAdmin = role === 'admin';
  return {
    ...user,
    role,
    isAdmin,
    user_metadata: {
      ...(user.user_metadata || {}),
      role: isAdmin ? 'SUPERADMIN' : role,
      level: isAdmin ? 'ROOT CISO // JEFE' : user.user_metadata?.level,
    },
  };
}
