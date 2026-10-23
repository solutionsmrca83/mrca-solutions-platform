import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Creates a public client-side Supabase client for browser interactions.
 * Adheres to Zero-Trust architecture: all queries are subject to PostgreSQL RLS policies.
 * Strictly uses only public anonymized keys (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
 */
export function createClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
export const supabase: SupabaseClient = createClient();

export default supabase;
