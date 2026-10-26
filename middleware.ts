import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UserRole } from './src/types';

/**
 * ==============================================================================
 * MRCA SOLUTIONS — ENTERPRISE SUBDOMAIN ROUTING & ZERO-TRUST MIDDLEWARE v3.5
 * ==============================================================================
 *
 * Implements physical separation and edge routing via subdomains on Vercel:
 *
 * 1. ADMIN SUBDOMAIN (`admin.mcrasolutions.com` / `admin.localhost`):
 *    - Rewrites requests to `/enclave` or `/admin` route.
 *    - Enforces strict Supabase role validation:
 *      Allowed: 'owner', 'stealth_partner', 'employee'
 *      Unauthorized / Clients: Redirects to /forbidden (403).
 *      Unauthenticated: Redirects to /login on admin subdomain (NO registration UI).
 *
 * 2. CLIENTES SUBDOMAIN (`clientes.mcrasolutions.com` / `clientes.localhost`):
 *    - Rewrites requests to `/clientes` or `/dashboard` route (Client Portal).
 *    - Allows corporate client onboarding, contracts & invoice vault.
 *
 * 3. ESTUDIANTES SUBDOMAIN (`estudiantes.mcrasolutions.com` / `estudiantes.localhost`):
 *    - Rewrites requests to `/estudiantes` route (MRCA Academy).
 *    - Serves student cybersecurity curriculum and Kali Linux training enclaves.
 *
 * 4. MAIN DOMAIN (`mcrasolutions.com` / `localhost:3000`):
 *    - Serves public landing page and client portal.
 *    - Any legacy `/admin` routes are redirected to `admin.` subdomain.
 */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host') || request.nextUrl.host || '';
  const hostname = host.split(':')[0].toLowerCase();

  // 1. Whitelist Next.js assets, static files, and the stealth API handshake
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.includes('.') && !pathname.endsWith('.html')) ||
    pathname.startsWith('/api/auth/stealth')
  ) {
    return response;
  }

  // 2. Subdomain Detection (supports admin.*, clientes.*, estudiantes.*, query params & headers)
  const isAdminSubdomain =
    hostname.startsWith('admin.') ||
    searchParams.get('subdomain') === 'admin' ||
    request.headers.get('x-domain') === 'admin';

  const isClientesSubdomain =
    hostname.startsWith('clientes.') ||
    searchParams.get('subdomain') === 'clientes' ||
    request.headers.get('x-domain') === 'clientes';

  const isEstudiantesSubdomain =
    hostname.startsWith('estudiantes.') ||
    searchParams.get('subdomain') === 'estudiantes' ||
    request.headers.get('x-domain') === 'estudiantes';

  // ============================================================================
  // BRANCH A: CLIENTES SUBDOMAIN (clientes.mcrasolutions.com / clientes.localhost)
  // ============================================================================
  if (isClientesSubdomain) {
    // If hostname starts with clientes., rewrite to /clientes or /dashboard route
    const targetPath =
      pathname === '/' || pathname === ''
        ? '/clientes'
        : pathname.startsWith('/clientes') || pathname.startsWith('/dashboard')
        ? pathname
        : `/clientes${pathname}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // ============================================================================
  // BRANCH B: ESTUDIANTES SUBDOMAIN (estudiantes.mcrasolutions.com / estudiantes.localhost)
  // ============================================================================
  if (isEstudiantesSubdomain) {
    // If hostname starts with estudiantes., rewrite to /estudiantes route
    const targetPath =
      pathname === '/' || pathname === ''
        ? '/estudiantes'
        : pathname.startsWith('/estudiantes')
        ? pathname
        : `/estudiantes${pathname}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // ============================================================================
  // BRANCH C: ADMIN SUBDOMAIN (admin.mcrasolutions.com / admin.localhost)
  // ============================================================================
  if (isAdminSubdomain) {
    // C.1. 403 Forbidden page is always accessible
    if (pathname === '/forbidden') {
      return NextResponse.rewrite(new URL('/(admin-domain)/forbidden', request.url));
    }

    // Supabase SSR Client setup for role verification on admin subdomain
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://labbgwexfpcnvtgnknwi.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYmJnd2V4ZnBjbnZ0Z25rbndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTAxMTQsImV4cCI6MjEwNzE2NjExNH0.JCShYJN6xNEMZ-oL9xh8IL6akJCPLaLP3lCWw5VKkPo';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Inspect session & stealth partner cookie
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isStealthCookie =
      request.cookies.get('mcra_stealth_session')?.value === 'authenticated_stealth_partner';

    const FOUNDER_MASTER_EMAILS = [
      'solutionsmrca83@gmail.com',
      'jefe@mcrasolutions.com',
      'admin@mcrasolutions.com',
      'founder@mcrasolutions.com',
      'owner@mcrasolutions.com',
      'ciso@mcrasolutions.com',
    ];

    const ADMIN_PRIVILEGED_ROLES = [
      'superadmin',
      'partner',
      'employee',
      'admin',
      'owner',
      'stealth_partner',
      'ciso',
      'director',
    ];


    // Resolve user role
    let role: UserRole | null = null;
    let isPrivilegedAdmin = false;

    if (isStealthCookie) {
      role = 'stealth_partner';
      isPrivilegedAdmin = true;
    } else if (user) {
      const email = user.email?.toLowerCase().trim() || '';
      const metaRole = (
        user.user_metadata?.role ||
        user.app_metadata?.role ||
        (user as any).raw_user_meta_data?.role ||
        (user as any).raw_app_meta_data?.role
      )?.toString().toLowerCase().trim();

      // Check founder email list or @mcrasolutions.com
      if (FOUNDER_MASTER_EMAILS.includes(email) || email.endsWith('@mcrasolutions.com')) {
        role = 'owner';
        isPrivilegedAdmin = true;
      } else if (metaRole && ADMIN_PRIVILEGED_ROLES.includes(metaRole)) {
        role = metaRole as UserRole;
        isPrivilegedAdmin = true;
      } else if (email.includes('jefe') || email.includes('socio') || email.includes('empleado')) {
        role = 'owner';
        isPrivilegedAdmin = true;
      } else {
        role = 'client';
      }

      // If not yet verified, query Supabase database tables for 'role' column
      if (!isPrivilegedAdmin && user.id) {
        try {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (userProfile?.role) {
            const r = userProfile.role.toString().toLowerCase().trim();
            if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
              role = r as UserRole;
              isPrivilegedAdmin = true;
            }
          }
        } catch {
          // Fallback to profiles table
        }

        if (!isPrivilegedAdmin) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.role) {
              const r = profile.role.toString().toLowerCase().trim();
              if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
                role = r as UserRole;
                isPrivilegedAdmin = true;
              }
            }
          } catch {
            // Fallback to users table
          }
        }

        if (!isPrivilegedAdmin) {
          try {
            const { data: dbUser } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (dbUser?.role) {
              const r = dbUser.role.toString().toLowerCase().trim();
              if (ADMIN_PRIVILEGED_ROLES.includes(r)) {
                role = r as UserRole;
                isPrivilegedAdmin = true;
              }
            }
          } catch {}
        }
      }
    }

    // C.2. Admin Login page handling (NO registration UI)
    if (pathname === '/login') {
      if (isPrivilegedAdmin) {
        const dashUrl = request.nextUrl.clone();
        dashUrl.pathname = '/admin';
        return NextResponse.redirect(dashUrl);
      }
      return NextResponse.rewrite(new URL('/(admin-domain)/login', request.url));
    }

    // C.3. Unauthenticated access on admin subdomain -> redirect to admin login
    if (!user && !isStealthCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      if (pathname !== '/' && pathname !== '/dashboard' && pathname !== '/admin' && pathname !== '/enclave') {
        loginUrl.searchParams.set('redirectTo', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // C.4. Authenticated, but NOT authorized (e.g. client role) -> 403 Forbidden
    if (!isPrivilegedAdmin) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/forbidden';
      return NextResponse.redirect(forbiddenUrl);
    }

    // C.5. Authenticated Admin -> Rewrite to /enclave or /admin route
    let targetPath = '/admin';
    if (pathname === '/' || pathname === '' || pathname === '/dashboard') {
      targetPath = '/admin';
    } else if (pathname === '/enclave' || pathname.startsWith('/enclave/')) {
      targetPath = pathname;
    } else {
      targetPath = pathname.startsWith('/admin') ? pathname : `/(admin-domain)${pathname}`;
    }

    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // ============================================================================
  // BRANCH D: MAIN DOMAIN (mcrasolutions.com / localhost:3000 / Netlify)
  // ============================================================================

  // D.1. /admin route on main domain:
  // If running on Netlify (*.netlify.app) or localhost, keep on main domain for SPA routing.
  // Otherwise, only redirect to admin subdomain if explicitly requested.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (
      hostname.includes('netlify.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      searchParams.get('no_subdomain') === '1'
    ) {
      return response;
    }
  }

  // Standard main domain route pass-through
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
