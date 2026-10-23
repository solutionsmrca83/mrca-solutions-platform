'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase/client';

export default function AdminDomainRootPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        const email = session.user.email?.toLowerCase() || '';
        const isPrivileged =
          role === 'owner' ||
          role === 'stealth_partner' ||
          role === 'employee' ||
          email.includes('jefe') ||
          email.includes('socio') ||
          email.includes('empleado');

        if (isPrivileged) {
          router.replace('/dashboard');
        } else {
          router.replace('/forbidden');
        }
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070c1e] flex items-center justify-center text-[#00e5ff] font-['JetBrains_Mono'] text-[13px]">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[#00fe66] animate-ping"></span>
        <span>ENCLAVE ZERO-TRUST // VERIFICANDO HANDSHAKE CRIPTOGRÁFICO...</span>
      </div>
    </div>
  );
}
