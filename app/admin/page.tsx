'use client';

import { useEffect } from 'react';

export default function AdminRedirectPage() {
  useEffect(() => {
    const { hostname, port, protocol } = window.location;
    if (hostname.startsWith('admin.')) {
      window.location.replace('/dashboard');
      return;
    }
    const cleanHost = hostname.replace(/^www\./, '');
    const targetHost = cleanHost.includes('localhost') ? `admin.localhost` : `admin.${cleanHost}`;
    window.location.replace(`${protocol}//${targetHost}${port ? `:${port}` : ''}/dashboard`);
  }, []);

  return (
    <div className="min-h-screen bg-[#070c1e] flex items-center justify-center text-[#00e5ff] font-['JetBrains_Mono'] text-[13px]">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66] animate-pulse"></span>
        <span>REDIRECCIONANDO AL SUBDOMINIO AISLADO ADMIN...</span>
      </div>
    </div>
  );
}
