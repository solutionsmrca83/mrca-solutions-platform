'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ClientAuthModule } from '@/src/components/ClientAuthModule';

export default function RegisterPage() {
  const router = useRouter();

  const handleLoginSuccess = (user: any) => {
    if (user?.role === 'client') {
      router.push('/portal/client');
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-[#dce1ff] flex flex-col items-center justify-center p-4 selection:bg-[#00e5ff] selection:text-[#00363d] font-['Inter'] relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Low-Opacity Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] overflow-hidden">
        <img
          src="/MRCA.SVG"
          alt="MRCA Watermark"
          className="w-[120vw] max-w-[900px] h-auto object-contain filter blur-[1px] select-none"
        />
      </div>

      {/* Radial Cyan Glow Behind Glass-Panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-[#00E5FF]/10 blur-[130px] rounded-full pointer-events-none" />

      {/* UI Content Wrapper */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center py-6">
        {/* Prominent High-Resolution Logo Above Authentication Glass-Panel */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/MRCA.SVG"
            alt="MRCA Solutions"
            className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain drop-shadow-[0_0_28px_rgba(0,229,255,0.4)] select-none"
          />
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase tracking-widest mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse" />
            ONBOARDING CORPORATIVO B2B v4.12
          </span>
        </div>

        <div className="w-full">
          <ClientAuthModule
            initialMode="register"
            onLoginSuccess={handleLoginSuccess}
            showToast={(msg) => console.log(msg)}
          />
        </div>

        {/* Return to Landing link */}
        <a
          href="/"
          className="mt-6 font-['JetBrains_Mono'] text-[11px] text-[#849396] hover:text-[#00e5ff] transition-colors flex items-center gap-1.5 pb-6"
        >
          <span translate="no" className="notranslate material-symbols-outlined text-[15px]">arrow_back</span>
          <span>Volver a Inicio de MRCA Solutions</span>
        </a>
      </div>
    </div>
  );
}
