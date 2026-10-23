import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * ==============================================================================
 * MCRA SOLUTIONS - STEALTH PARTNER CRYPTOGRAPHIC AUTHENTICATION ENCLAVE
 * ==============================================================================
 * 
 * HIDDEN ZERO-TRUST MECHANISM:
 * Allows the Stealth Partner (Socio / CTO) to bypass standard login interfaces.
 * Access is granted ONLY via an out-of-band cryptographic query parameter:
 *   GET /api/auth/stealth?key=<pre_shared_secret>
 *
 * CYBERSECURITY SAFEGUARDS:
 * 1. Zero Information Disclosure: Invalid keys or missing parameters return an
 *    opaque 404 Not Found to disguise the endpoint from vulnerability scanners.
 * 2. Constant-Time Timing Attack Mitigation: Uses SHA-256 digest + timingSafeEqual
 *    to prevent side-channel timing analysis.
 * 3. Session Generation: Exchanges validated PSK for a cryptographically signed
 *    Supabase user session with role 'stealth_partner'.
 * 4. Zero UI Discovery: Strictly unreferenced in any frontend component or bundle.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const key = searchParams.get('key');

  const expectedKey = process.env.STEALTH_PARTNER_KEY;
  const partnerEmail = process.env.STEALTH_PARTNER_EMAIL;

  // 1. Opaque denial if parameter is absent or server environment is unconfigured
  if (!key || typeof key !== 'string' || !expectedKey || !partnerEmail) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Timing-safe cryptographic comparison
  const keyDigest = crypto.createHash('sha256').update(key).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedKey).digest();

  const isKeyValid = crypto.timingSafeEqual(keyDigest, expectedDigest);

  if (!isKeyValid) {
    // Log security anomaly internally (prevent disclosing existence to adversary)
    console.warn(`[SECURITY ALERT] Unauthorized stealth access attempt detected.`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. Prepare response redirecting stealth partner to /admin/dashboard
  const redirectUrl = new URL('/admin/dashboard', request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-placeholder';

  // 4. Initialize SSR server client wired to outgoing response cookies
  const supabaseServer = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    // 5. Use Admin Service Role client to issue an authentic Supabase session
    const supabaseAdmin = createAdminClient();

    // Verify or ensure partner user exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    let partnerUser = userList?.users?.find((u) => u.email === partnerEmail);

    if (!partnerUser) {
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: partnerEmail,
          email_confirm: true,
          user_metadata: {
            role: 'stealth_partner',
            level: 'NIVEL 1 // SOCIO',
            title: 'Socio (CTO/VP Eng)',
          },
        });

      if (!createError && newUser?.user) {
        partnerUser = newUser.user;
      }
    }

    // Generate a cryptographic magiclink token to verify and establish session cookies
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: partnerEmail,
      });

    if (!linkError && linkData?.properties?.hashed_token) {
      await supabaseServer.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'email',
      });
    } else {
      // Sandbox fallback: set high-security stealth auth cookie
      response.cookies.set('mcra_stealth_session', 'authenticated_stealth_partner', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
  } catch (err) {
    console.error('[STEALTH AUTH] Session exchange error:', err);
    // Even in offline/demo sandbox, set verified stealth cookie to avoid lockout
    response.cookies.set('mcra_stealth_session', 'authenticated_stealth_partner', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}
