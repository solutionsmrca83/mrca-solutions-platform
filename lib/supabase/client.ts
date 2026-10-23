import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to safely extract public environment variables across both
 * Next.js (process.env) and Vite (import.meta.env) runtime environments.
 */
function getPublicConfig() {
  let url = '';
  let anonKey = '';

  // Check Node / Next.js environment
  if (typeof process !== 'undefined' && process.env) {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  // Check Vite environment if not already found
  // @ts-ignore
  if (!url && typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    anonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // Fallback defaults for staging/development initialization
  return {
    supabaseUrl: url || 'https://your-project-id.supabase.co',
    supabaseAnonKey: anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-placeholder',
  };
}

const { supabaseUrl, supabaseAnonKey } = getPublicConfig();

/**
 * Creates a public client-side Supabase client for browser interactions.
 * Adheres to Zero-Trust architecture: all queries are subject to PostgreSQL RLS policies.
 */
export function createClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Singleton client instance for direct import across React components and views.
 */
export const supabase = createClient();

export default supabase;
