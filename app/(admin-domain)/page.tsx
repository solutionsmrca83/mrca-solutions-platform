'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase/client';

export default function AdminDomainRootPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { isUserAdmin } = await import('@/src/lib/auth');
        const isPrivileged = await isUserAdmin(session.user);

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
