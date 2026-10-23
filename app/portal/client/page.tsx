'use client';

import React, { useState } from 'react';
import { ClientPortalView } from '@/src/components/ClientPortalView';
import { logout } from '@/app/actions/auth';

export default function ClientPortalPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3200);
  };

  return (
    <div className="min-h-screen bg-[#0a1128] text-[#dce1ff] flex flex-col font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#060d24]/90 border-b border-[#181e36] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#181e36] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] group-hover:border-[#00e5ff] transition-all">
                <span className="material-symbols-outlined text-[20px]">hexagon</span>
              </div>

              {/* Embedded 3D Video Mini Brand Preview */}
              <div className="relative w-24 h-8 rounded-lg overflow-hidden border border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.3)] shrink-0 hidden sm:block bg-[#0A1128]">
                <video
                  src="/assets/videos/mrca-intro-3d.mp4"
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A1128]/70 pointer-events-none" />
                <span className="absolute bottom-0.5 right-1.5 text-[8px] font-['JetBrains_Mono'] text-[#00FF66] font-bold tracking-widest pointer-events-none">
                  MRCA 3D
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff] leading-none group-hover:text-[#00e5ff] transition-colors">
                  MRCA SOLUTIONS
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#00daf3] uppercase tracking-widest mt-1">
                  PORTAL CLIENTES B2B
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#141a32] border border-[#00fe66]/20 font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
              <span>CANAL CIFRADO ACTIVO</span>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181e36] hover:bg-[#222941] text-[#ffb4ab] border border-[#ffb4ab]/30 font-['JetBrains_Mono'] text-[11px] font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">logout</span>
                <span>CERRAR SESIÓN</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Client Portal View Component */}
      <main className="flex-1 w-full">
        <ClientPortalView
          clientEmail="cliente@enterprise.corp"
          clientCompany="FinTech Global B2B"
          showToast={showToast}
        />
      </main>

      {/* Floating HUD Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141a32] border border-[#00e5ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#00fe66] text-[22px]">check_circle</span>
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
