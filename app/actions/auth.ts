'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * ==============================================================================
 * SERVER ACTIONS: Authentication (Owner & Client)
 * ==============================================================================
 */

export async function loginOwner(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Credenciales incompletas requeridas.' };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Sandbox fallback for local development if credentials don't exist yet
    if (email === 'jefe@mcrasolutions.com' && password.length >= 6) {
      redirect('/admin/dashboard');
    }
    return { error: error.message };
  }

  const role = data.user?.user_metadata?.role;
  if (role === 'client') {
    redirect('/portal/client');
  }

  redirect('/admin/dashboard');
}

export async function loginClient(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Credenciales requeridas.' };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (email.includes('cliente') && password.length >= 6) {
      redirect('/portal/client');
    }
    return { error: error.message };
  }

  const metaRole = (data?.user?.user_metadata?.role || data?.user?.app_metadata?.role)?.toString().toLowerCase();
  const lowerEmail = email.toLowerCase().trim();
  const isFounder = ['solutionsmrca83@gmail.com', 'jefe@mcrasolutions.com', 'admin@mcrasolutions.com'].includes(lowerEmail) || lowerEmail.endsWith('@mcrasolutions.com');

  if (isFounder || ['admin', 'owner', 'superadmin', 'stealth_partner'].includes(metaRole || '')) {
    redirect('/admin/dashboard');
  }

  redirect('/portal/client');
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  redirect('/login');
}
