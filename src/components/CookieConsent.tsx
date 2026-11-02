import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Cookie,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Cpu,
  KeyRound,
  Shield,
  FileText,
} from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onNavigateToPrivacy?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAccept,
  onNavigateToPrivacy,
}) => {
  const [isAccepted, setIsAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('mrca_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  });

  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const val = localStorage.getItem('mrca_cookie_consent');
        if (val === 'accepted') {
          setIsAccepted(true);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAcceptCookies = () => {
    try {
      localStorage.setItem('mrca_cookie_consent', 'accepted');
    } catch {}
    setIsAccepted(true);
    onAccept();
  };

  if (isAccepted) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto select-none transition-all duration-300">
      {/* Background Cybernetic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col gap-5 text-[#dce1ff] overflow-hidden"
      >
        {/* Top High-Tech Security Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-[18px] sm:text-[20px] font-bold text-white tracking-tight leading-none">
                  MRCA SOLUTIONS
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-wider">
                  ENCLAVE LEGAL
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                CONTROL ESTRICTO DE COOKIES &amp; PRIVACIDAD DE DATOS
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right font-['JetBrains_Mono'] text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> FIPS 140-3
            </span>
            <span className="text-slate-500">LFPDPPP / GDPR</span>
          </div>
        </div>

        {/* Blocking Warning Pill */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-[11px] font-['JetBrains_Mono'] text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>ACCESO BLOQUEADO:</strong> Se requiere consentimiento explícito para habilitar los portales corporativos (/client, /student, /admin).
          </span>
        </div>

        {/* Main Content Body */}
        <div className="flex flex-col gap-3 font-['Inter'] text-[13px] text-slate-300 leading-relaxed">
          <p>
            MRCA Solutions S.A.P.I. de C.V. implementa políticas de seguridad <strong className="text-white">Zero-Trust</strong> de grado bancario. Empleamos almacenamiento local y cookies técnicas estrictamente necesarias para garantizar:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-['Space_Grotesk'] font-bold text-[12px]">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sesión mTLS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Handshakes cifrados y tokens FIDO2/WebAuthn contra ataques CSRF.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-['Space_Grotesk'] font-bold text-[12px]">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                <span>Materialidad SAT</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Trazabilidad inmutable SHA-256 para CFDI 4.0 y contratos B2B.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-teal-300 font-['Space_Grotesk'] font-bold text-[12px]">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Cero Rastreo</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                No vendemos datos ni compartimos PII con redes publicitarias.
              </p>
            </div>
          </div>

          {/* Collapsible Technical Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-['JetBrains_Mono'] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`} />
              <span>{showDetails ? 'Ocultar especificación técnica' : 'Ver desglose técnico de cookies & privacidad (LFPDPPP)'}</span>
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 rounded-xl bg-[#060D24] border border-cyan-500/20 font-['JetBrains_Mono'] text-[10.5px] text-slate-400 flex flex-col gap-1.5 overflow-hidden"
                >
                  <p>
                    • <strong>mrca_cookie_consent:</strong> Almacena el consentimiento legal en `localStorage` (Vigencia: 365 días).
                  </p>
                  <p>
                    • <strong>sb-auth-token:</strong> Cookie de autenticación cifrada delegada por Supabase Auth con directivas HttpOnly y SameSite=Strict.
                  </p>
                  <p>
                    • <strong>mrca_client_contracts:</strong> Memoria cifrada local para el generador de contratos y SLA.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-cyan-900/40">
          {onNavigateToPrivacy ? (
            <button
              type="button"
              onClick={onNavigateToPrivacy}
              className="text-[12px] font-['JetBrains_Mono'] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Consultar Aviso de Privacidad</span>
            </button>
          ) : (
            <a
              href="#legal-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-['JetBrains_Mono'] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Consultar Aviso de Privacidad</span>
            </a>
          )}

          <div className="w-full sm:w-auto flex items-center justify-end">
            <button
              type="button"
              onClick={handleAcceptCookies}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-[#00daf3] to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Aceptar Cookies</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

