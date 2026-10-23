import React, { useEffect } from 'react';
import { LegalFooter } from '../LegalFooter';

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  version?: string;
  lastUpdated?: string;
  docCode?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle = 'Marco Regulatorio y Gobernanza Corporativa B2B',
  version = 'v2.4.0',
  lastUpdated = 'Octubre 2026',
  docCode = 'LEGAL-SEC-2026',
  children,
  onBack,
  onNavigate,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [title]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, '', '/');
      window.location.hash = '';
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-300 font-['Inter'] flex flex-col justify-between selection:bg-[#00e5ff] selection:text-[#00363d] relative overflow-x-hidden">
      {/* Background Cyber Grid Accent */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Glow Orb in Background */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* TOP COMPLIANCE HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#0A1128]/90 backdrop-blur-xl border-b border-cyan-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a32] border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 hover:bg-[#181e36] transition-all text-[12px] font-['JetBrains_Mono'] group shadow-[0_0_10px_rgba(0,229,255,0.15)]"
              aria-label="Volver al Inicio"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Volver a Inicio</span>
            </button>

            <div className="h-5 w-px bg-cyan-900/60 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-[15px] font-bold text-white tracking-tight">
                MRCA SOLUTIONS
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400">LEGAL COMPLIANCE</span>
            </div>
          </div>

          {/* Document Security Telemetry Badge */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141a32] border border-[#00fe66]/30 font-['JetBrains_Mono'] text-[10px] text-[#00fe66]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_6px_#00fe66]" />
              <span>CUMPLIMIENTO LEGAL ACTIVO // LFPDPPP</span>
            </div>

            <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
              {docCode}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN LEGAL DOCUMENT BODY */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Document Title Header */}
        <div className="mb-10 pb-6 border-b border-cyan-900/40">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
              DOC OFICIAL {version}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[12px] font-['JetBrains_Mono'] text-slate-400">
              Última actualización: {lastUpdated}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[12px] font-['JetBrains_Mono'] text-slate-400">
              Jurisdicción: Ciudad de México, México
            </span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-[32px] sm:text-[40px] font-bold text-white tracking-tight leading-tight mb-2">
            {title}
          </h1>
          <p className="font-['Inter'] text-[15px] sm:text-[16px] text-cyan-300/80 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Content Container Optimized for Reading */}
        <article className="prose prose-invert max-w-none text-slate-300 text-[14px] sm:text-[15px] leading-relaxed space-y-8 font-['Inter']">
          {children}
        </article>

        {/* Cryptographic Signature Footer Seal */}
        <div className="mt-14 pt-8 border-t border-cyan-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#060d24]/80 border border-cyan-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-[13px] font-bold text-white">
                Validez Legal &amp; Criptográfica Garantizada
              </p>
              <p className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                Sujeto al Código de Comercio y Legislación Federal Mexicana.
              </p>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-[10px] text-cyan-400/80 text-left sm:text-right">
            HASH ECDSA: <span className="text-slate-400">0x7F9B...88C2</span>
          </div>
        </div>
      </main>

      {/* GLOBAL LEGAL FOOTER */}
      <LegalFooter onNavigate={onNavigate} />
    </div>
  );
};

export default LegalLayout;
