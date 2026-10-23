import React from 'react';

interface LegalFooterProps {
  onNavigate?: (route: string) => void;
  className?: string;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ onNavigate, className = '' }) => {
  const handleLinkClick = (path: string, hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState(null, '', path);
      window.location.hash = hash;
      window.dispatchEvent(new Event('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="global-legal-footer"
      className={`w-full bg-[#0A1128]/80 backdrop-blur-md border-t border-cyan-900/50 py-4 px-4 sm:px-6 lg:px-8 relative z-30 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Copyright notice */}
        <div className="font-['JetBrains_Mono'] text-[11px] sm:text-[12px] text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] shadow-[0_0_6px_#00fe66] shrink-0" />
          <span>© 2026 MRCA Solutions. Todos los derechos reservados.</span>
        </div>

        {/* Legal Links */}
        <nav
          aria-label="Enlaces Legales"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-['JetBrains_Mono'] text-[11px] sm:text-[12px]"
        >
          <a
            href="/legal/terminos"
            onClick={handleLinkClick('/legal/terminos', '#legal-terminos')}
            className="text-cyan-500/70 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Términos y Condiciones
          </a>
          <span className="text-cyan-900/80">•</span>
          <a
            href="/legal/privacidad"
            onClick={handleLinkClick('/legal/privacidad', '#legal-privacidad')}
            className="text-cyan-500/70 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Aviso de Privacidad (LFPDPPP)
          </a>
          <span className="text-cyan-900/80">•</span>
          <a
            href="/legal/sla"
            onClick={handleLinkClick('/legal/sla', '#legal-sla')}
            className="text-cyan-500/70 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Acuerdo SLA (99.9%)
          </a>
          <span className="text-cyan-900/80">•</span>
          <a
            href="/legal/aup"
            onClick={handleLinkClick('/legal/aup', '#legal-aup')}
            className="text-cyan-500/70 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Uso Aceptable (AUP)
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default LegalFooter;
