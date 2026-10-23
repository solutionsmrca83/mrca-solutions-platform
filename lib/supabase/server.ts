import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('SUPABASE_URL') ||
  'https://your-project-id.supabase.co';

const supabaseAnonKey =
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-placeholder';

/**
 * Interface representing a standard Cookie Store (Next.js cookies() or equivalent)
 */
export interface CookieStoreAdapter {
  getAll?: () => Array<{ name: string; value: string }>;
  get?: (name: string) => { name: string; value: string } | undefined;
  set?: (name: string, value: string, options?: CookieOptions) => void;
  delete?: (name: string) => void;
}

/**
 * Creates an authenticated Supabase server client wired to user cookies.
 * Adheres to Zero-Trust: all database queries are constrained by PostgreSQL Row Level Security (RLS).
 *
 * @param cookieStore - Optional cookie store (e.g. from `next/headers` cookies() in Next.js)
 * @returns Configured SupabaseClient for server-side user operations
 */
export function createClient(cookieStore?: CookieStoreAdapter | any): SupabaseClient {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieStore) return [];
        if (typeof cookieStore.getAll === 'function') {
          return cookieStore.getAll();
        }
        return [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (typeof cookieStore.set === 'function') {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Catches errors when called from read-only Server Component contexts.
          // Ignored if middleware refreshes the session before rendering.
        }
      },
    },
  });
}

/**
 * ==============================================================================
 * ⚠️ CRITICAL ENTERPRISE SECURITY DIRECTIVE: SERVICE ROLE ADMINISTRATIVE CLIENT
 * ==============================================================================
 * 
 * The client returned by this function uses `SUPABASE_SERVICE_ROLE_KEY`.
 * It intentionally BYPASSES ALL ROW LEVEL SECURITY (RLS) POLICIES in PostgreSQL!
 *
 * SECURITY POLICY COMPLIANCE:
 * 1. NEVER EXPOSE TO CLIENT: Never import this method in client components, browser
 *    bundles, or expose its outputs without strict authorization and sanitization.
 * 2. USE CASES ONLY: Dedicated server-side webhooks (e.g. Stripe Escrow / SPEI Banxico),
 *    system-level telemetry logging, database maintenance, or high-privilege operations.
 * 3. NO SESSION PERSISTENCE: Session persistence and token refresh are disabled to
 *    prevent credential leakage across server execution threads.
 */
export function createAdminClient(): SupabaseClient {
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    console.warn(
      '[CRITICAL CYBERSECURITY WARNING] SUPABASE_SERVICE_ROLE_KEY is not configured or uses a placeholder. Admin operations requiring elevated privileges will fail.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default {
  createClient,
  createAdminClient,
};
