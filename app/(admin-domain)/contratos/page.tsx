'use client';

import React, { useState } from 'react';
import { AdminContractGenerator } from '@/src/components/AdminContractGenerator';
import { supabase } from '@/src/lib/supabase/client';
import { FileText, ArrowLeft, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';

export default function AdminContratosPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // offline fallback
    }
    window.location.href = '/login';
  };

  const getMainDomainUrl = () => {
    if (typeof window === 'undefined') return '/';
    const { hostname, port, protocol } = window.location;
    const cleanHost = hostname.replace(/^admin\./, '');
    return `${protocol}//${cleanHost}${port ? `:${port}` : ''}/`;
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-[#dce1ff] flex flex-col font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#060c20]/95 border-b border-[#1c274a] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="w-9 h-9 rounded-xl bg-[#141d3b] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)] hover:border-[#00e5ff] transition-all"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff] leading-none">
                MRCA SOLUTIONS
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] uppercase tracking-widest mt-1">
                ENCLAVE ADMIN // GESTOR DE CONTRATOS &amp; NDA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#101733] border border-[#00fe66]/30 font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
              <span>ZERO-TRUST SESSION ACTIVE</span>
            </div>

            <a
              href={getMainDomainUrl()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141d3b] hover:bg-[#1c274a] text-[#00daf3] border border-[#00e5ff]/30 font-['JetBrains_Mono'] text-[11px] font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>PORTAL CLIENTES</span>
            </a>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e131d] hover:bg-[#32172a] text-[#ffb4ab] border border-[#ff5555]/30 font-['JetBrains_Mono'] text-[11px] font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>CERRAR SESIÓN</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Contract Generator View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminContractGenerator showToast={showToast} />
      </main>

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141d3b] border border-[#00e5ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-[#00fe66]" />
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
