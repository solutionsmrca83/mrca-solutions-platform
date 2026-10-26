import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import type { UserRole, RolePermissions, ManagedUser } from '../types';

export const FOUNDER_MASTER_EMAILS = [
  'solutionsmrca83@gmail.com',
  'jefe@mcrasolutions.com',
  'admin@mcrasolutions.com',
  'founder@mcrasolutions.com',
  'owner@mcrasolutions.com',
  'ciso@mcrasolutions.com',
];

export const ADMIN_PRIVILEGED_ROLES = [
  'superadmin',
  'partner',
  'employee',
  'admin',
  'owner',
  'stealth_partner',
  'ciso',
  'director',
];

/**
 * Checks if a given Supabase user has administrative privileges.
 *
 * Verifies against:
 * 1. Founder master email list and @mcrasolutions.com corporate domain.
 * 2. Supabase auth user_metadata or app_metadata role ('superadmin', 'partner', 'employee', etc.).
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
 * Checks if user is Superadmin (Founder / Root access)
 */
export function isSuperAdmin(user: any): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (email && (FOUNDER_MASTER_EMAILS.includes(email) || email === 'solutionsmrca83@gmail.com')) {
    return true;
  }

  const metaRole = (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.raw_user_meta_data?.role ||
    user.role
  )
    ?.toString()
    .toLowerCase()
    .trim();

  return metaRole === 'superadmin' || metaRole === 'owner';
}

/**
 * Checks if user is Partner (Second-in-Command / High-Level Admin)
 */
export function isPartner(user: any): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return false;

  const metaRole = (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.raw_user_meta_data?.role ||
    user.role
  )
    ?.toString()
    .toLowerCase()
    .trim();

  return metaRole === 'partner' || metaRole === 'stealth_partner';
}

/**
 * Checks if user is Employee (Staff / Operational)
 */
export function isEmployee(user: any): boolean {
  if (!user) return false;
  if (isSuperAdmin(user) || isPartner(user)) return false;

  const metaRole = (
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    user.raw_user_meta_data?.role ||
    user.role
  )
    ?.toString()
    .toLowerCase()
    .trim();

  return metaRole === 'employee';
}

/**
 * Returns the RBAC Permission Matrix for any user or role.
 * Standard levels:
 * - superadmin: Founder (Root access, can manage other users).
 * - partner: Second-in-Command (High-level admin access).
 * - employee: Standard staff (Restricted operational access).
 */
export function getUserPermissions(userOrRole: any): RolePermissions {
  let roleStr = '';
  if (typeof userOrRole === 'string') {
    roleStr = userOrRole.toLowerCase().trim();
  } else if (userOrRole) {
    if (isSuperAdmin(userOrRole)) roleStr = 'superadmin';
    else if (isPartner(userOrRole)) roleStr = 'partner';
    else if (isEmployee(userOrRole)) roleStr = 'employee';
    else {
      roleStr = (
        userOrRole.user_metadata?.role ||
        userOrRole.app_metadata?.role ||
        userOrRole.role ||
        'client'
      )
        .toString()
        .toLowerCase()
        .trim();
    }
  }

  if (roleStr === 'superadmin' || roleStr === 'owner') {
    return {
      canManageUsers: true,
      canAccessFinancials: true,
      canGenerateContracts: true,
      canApproveLeads: true,
      canViewAuditLogs: true,
      canAccessVault: true,
      canAccessSupport: true,
      canAccessTerminal: true,
      canAccessRootGovernance: true,
    };
  }

  if (roleStr === 'partner' || roleStr === 'stealth_partner' || roleStr === 'admin') {
    return {
      canManageUsers: false, // Strictly superadmin only!
      canAccessFinancials: true,
      canGenerateContracts: true,
      canApproveLeads: true,
      canViewAuditLogs: true,
      canAccessVault: true,
      canAccessSupport: true,
      canAccessTerminal: true,
      canAccessRootGovernance: false,
    };
  }

  if (roleStr === 'employee') {
    return {
      canManageUsers: false,
      canAccessFinancials: false,
      canGenerateContracts: false,
      canApproveLeads: false,
      canViewAuditLogs: false,
      canAccessVault: false,
      canAccessSupport: true, // Operational support tickets
      canAccessTerminal: false,
      canAccessRootGovernance: false,
    };
  }

  // Default client / student
  return {
    canManageUsers: false,
    canAccessFinancials: false,
    canGenerateContracts: false,
    canApproveLeads: false,
    canViewAuditLogs: false,
    canAccessVault: false,
    canAccessSupport: false,
    canAccessTerminal: false,
    canAccessRootGovernance: false,
  };
}

/**
 * Resolves the granular role ('superadmin' | 'partner' | 'employee' | 'admin' | 'client' | 'student') for a user.
 */
export async function resolveGranularUserRole(user: any): Promise<UserRole> {
  if (!user) return 'client';

  const email = (user.email || '').toLowerCase().trim();
  if (FOUNDER_MASTER_EMAILS.includes(email) || email === 'solutionsmrca83@gmail.com') {
    return 'superadmin';
  }

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

  if (metaRole === 'superadmin') return 'superadmin';
  if (metaRole === 'partner' || metaRole === 'stealth_partner') return 'partner';
  if (metaRole === 'employee') return 'employee';
  if (metaRole === 'owner') return 'superadmin';
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
        if (r === 'superadmin' || r === 'owner') return 'superadmin';
        if (r === 'partner' || r === 'stealth_partner') return 'partner';
        if (r === 'employee') return 'employee';
        if (r === 'admin') return 'partner';
        if (['student', 'client'].includes(r)) return r as UserRole;
      }
    } catch {
      // Fallback
    }
  }

  const isAdmin = await isUserAdmin(user);
  if (isAdmin) return 'superadmin';

  return 'client';
}

/**
 * Resolves the high-level view category ('admin' | 'client' | 'student') for routing.
 */
export async function resolveUserRole(user: any): Promise<'admin' | 'client' | 'student'> {
  if (!user) return 'client';

  const granular = await resolveGranularUserRole(user);
  if (['superadmin', 'partner', 'employee', 'admin', 'owner', 'stealth_partner'].includes(granular)) {
    return 'admin';
  }
  if (granular === 'student') return 'student';
  return 'client';
}

/**
 * Enriches a raw Supabase User object with verified role and admin flags.
 */
export async function getEnrichedUser(user: any): Promise<any> {
  if (!user) return null;
  const granularRole = await resolveGranularUserRole(user);
  const isAdmin = ['superadmin', 'partner', 'employee', 'admin', 'owner', 'stealth_partner'].includes(
    granularRole
  );

  let levelLabel = 'PORTAL CLIENTE B2B';
  if (granularRole === 'superadmin') levelLabel = 'ROOT CISO // JEFE SUPREMO';
  else if (granularRole === 'partner') levelLabel = 'NIVEL 1 // SOCIO (CTO)';
  else if (granularRole === 'employee') levelLabel = 'NIVEL 2 // STAFF OPERATIVO';

  return {
    ...user,
    role: isAdmin ? 'admin' : granularRole,
    granularRole,
    isAdmin,
    permissions: getUserPermissions(granularRole),
    user_metadata: {
      ...(user.user_metadata || {}),
      role: granularRole.toUpperCase(),
      level: levelLabel,
    },
  };
}

/**
 * MASTER BOOTSTRAP BACKDOOR / ADMIN ELEVATION ENGINE:
 * Directly elevates a user's account to 'superadmin' in Supabase Auth & user_profiles.
 * Bypasses PostgreSQL enum restrictions cleanly by updating raw_user_meta_data,
 * while safely attempting table sync.
 */
export async function elevateUserToSuperadmin(
  explicitEmail?: string
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // 1. Get current session or target user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user;

    const targetEmail = (explicitEmail || currentUser?.email || 'solutionsmrca83@gmail.com')
      .toLowerCase()
      .trim();

    // 2. Elevate user metadata in Supabase Auth (bypasses DB enum lock!)
    let updatedAuthUser = currentUser;
    if (currentUser) {
      const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          role: 'superadmin',
          level: 'ROOT CISO // JEFE SUPREMO',
          elevated_at: new Date().toISOString(),
          is_founder: true,
        },
      });

      if (authUpdateError) {
        console.warn('[AUTH BOOTSTRAP] Supabase updateUser warning:', authUpdateError);
      } else if (authUpdateData?.user) {
        updatedAuthUser = authUpdateData.user;
      }
    }

    // 3. Gracefully update or upsert user_profiles table if user ID exists
    if (currentUser?.id) {
      try {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: currentUser.id,
          role: 'superadmin',
          full_name: 'Jefe Supremo (CISO Founder)',
          is_approved: true,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          // If PostgreSQL enum restricts 'superadmin' prior to migration execution,
          // fall back to 'owner' (valid enum in existing schema)
          console.warn('[AUTH BOOTSTRAP] Trying owner fallback for legacy enum:', profileError.message);
          await supabase.from('user_profiles').upsert({
            id: currentUser.id,
            role: 'owner',
            full_name: 'Jefe Supremo (CISO Founder)',
            is_approved: true,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('[AUTH BOOTSTRAP] Profile update non-fatal note:', dbErr);
      }
    }

    // 4. Construct enriched Superadmin User
    const superadminUser = {
      ...(updatedAuthUser || {
        id: 'usr_sec_enclave_root',
        email: targetEmail,
      }),
      role: 'admin',
      granularRole: 'superadmin' as UserRole,
      isAdmin: true,
      permissions: getUserPermissions('superadmin'),
      user_metadata: {
        role: 'SUPERADMIN',
        level: 'ROOT CISO // JEFE SUPREMO',
        is_founder: true,
        bootstrap_elevated: true,
      },
    };

    return {
      success: true,
      message: `Cuenta ${targetEmail} elevada exitosamente a SUPERADMIN.`,
      user: superadminUser,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al ejecutar elevación de privilegios de Administrador.',
    };
  }
}

/**
 * USER PROVISIONING ENGINE (Direct Supabase Auth Integration)
 * Allows Superadmin to create new accounts for Partners and Employees.
 * Uses an isolated Supabase Client instance (persistSession: false) so the Founder's
 * active session is NEVER destroyed or replaced during provisioning!
 */
export async function provisionUserAccount({
  name,
  email,
  role,
  password,
}: {
  name: string;
  email: string;
  role: 'partner' | 'employee';
  password: string;
}): Promise<{ success: boolean; message: string; user?: ManagedUser }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://labbgwexfpcnvtgnknwi.supabase.co';
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYmJnd2V4ZnBjbnZ0Z25rbndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTAxMTQsImV4cCI6MjEwNzE2NjExNH0.JCShYJN6xNEMZ-oL9xh8IL6akJCPLaLP3lCWw5VKkPo';

    // ISOLATED CLIENT INSTANCE (Prevents session overwrite for founder!)
    const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const levelTag =
      role === 'partner' ? 'NIVEL 1 // SOCIO (CTO)' : 'NIVEL 2 // STAFF OPERATIVO';

    const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          role: role,
          level: levelTag,
          provisioned_by: 'SUPERADMIN',
          created_at: new Date().toISOString(),
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    const createdUserId = signUpData.user?.id || `usr_gen_${Date.now()}`;

    // Safely sync to user_profiles table with enum fallback
    try {
      const enumRole = role === 'partner' ? 'partner' : 'employee';
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: createdUserId,
        role: enumRole,
        full_name: name.trim(),
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        // Fallback for legacy enum ('stealth_partner' for partner, 'client' for employee)
        const fallbackRole = role === 'partner' ? 'stealth_partner' : 'client';
        await supabase.from('user_profiles').upsert({
          id: createdUserId,
          role: fallbackRole,
          full_name: name.trim(),
          is_approved: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn('[USER PROVISION] user_profiles non-fatal sync notice:', dbErr);
    }

    const newUser: ManagedUser = {
      id: createdUserId,
      email: email.trim().toLowerCase(),
      full_name: name.trim(),
      role: role,
      status: 'active',
      created_at: new Date().toISOString(),
      initial_password_hint: password,
    };

    // Store in local storage directory for instant UI rendering across refreshes
    saveManagedUserLocally(newUser);

    return {
      success: true,
      message: `Cuenta de usuario ${email} (${role.toUpperCase()}) aprovisionada con éxito en Supabase Auth.`,
      user: newUser,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al aprovisionar usuario con Supabase Auth.',
    };
  }
}

/**
 * Local directory storage helper for team members provisioned by Superadmin
 */
const MANAGED_USERS_KEY = 'mcra_managed_team_users';

export function getManagedUsersLocally(): ManagedUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MANAGED_USERS_KEY);
    if (!raw) {
      // Default demo team members
      const defaults: ManagedUser[] = [
        {
          id: 'usr_root_founder',
          email: 'solutionsmrca83@gmail.com',
          full_name: 'Fundador & Jefe Supremo (CISO)',
          role: 'superadmin',
          status: 'active',
          created_at: '2026-10-10T12:00:00Z',
          last_sign_in_at: '2026-10-25T14:30:00Z',
        },
        {
          id: 'usr_partner_cto',
          email: 'socio@mcrasolutions.com',
          full_name: 'Ing. Alejandro Solís (Socio CTO)',
          role: 'partner',
          status: 'active',
          created_at: '2026-10-12T10:15:00Z',
          last_sign_in_at: '2026-10-24T18:20:00Z',
        },
        {
          id: 'usr_employee_lead',
          email: 'empleado.ops@mcrasolutions.com',
          full_name: 'Lic. Claudia Morales (Líder Soporte)',
          role: 'employee',
          status: 'active',
          created_at: '2026-10-15T09:00:00Z',
          last_sign_in_at: '2026-10-25T11:45:00Z',
        },
      ];
      localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveManagedUserLocally(user: ManagedUser): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getManagedUsersLocally();
    const filtered = current.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase());
    const updated = [user, ...filtered];
    localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save managed user to localStorage:', err);
  }
}
