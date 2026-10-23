'use client';

import React, { useState } from 'react';
import { ClientBillingHub } from '@/src/components/ClientBillingHub';
import { ArrowLeft, ShieldCheck, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function ClientFinanzasPage() {
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
            <a
              href="/portal/client"
              className="w-9 h-9 rounded-xl bg-[#181e36] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] hover:border-[#00e5ff] transition-all"
              title="Volver al Portal Clientes"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff] leading-none">
                MRCA SOLUTIONS
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#00daf3] uppercase tracking-widest mt-1">
                PORTAL CLIENTES // /portal/client/finanzas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#141a32] border border-[#00fe66]/20 font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
              <span>CANAL SPEI CIFRADO BANXICO</span>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181e36] hover:bg-[#222941] text-[#ffb4ab] border border-[#ffb4ab]/30 font-['JetBrains_Mono'] text-[11px] font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>CERRAR SESIÓN</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Billing Hub */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ClientBillingHub showToast={showToast} />
      </main>

      {/* Floating HUD Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141a32] border border-[#00e5ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-[#00fe66]" />
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
