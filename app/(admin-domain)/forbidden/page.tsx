'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, ArrowLeft, LogIn } from 'lucide-react';

export default function ForbiddenPage() {
  const getMainDomainUrl = () => {
    if (typeof window === 'undefined') return '/';
    const { hostname, port, protocol } = window.location;
    const cleanHost = hostname.replace(/^admin\./, '');
    return `${protocol}//${cleanHost}${port ? `:${port}` : ''}/`;
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-[#dce1ff] flex flex-col items-center justify-center p-4 selection:bg-[#ff5555] selection:text-white font-['Inter'] relative overflow-hidden">
      {/* Red Cyber Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff5555]/10 via-[#0a1128] to-[#060c20] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="rounded-3xl bg-[#0e1633]/90 border-2 border-[#ff5555]/50 p-7 sm:p-9 shadow-[0_0_60px_rgba(255,85,85,0.2)] backdrop-blur-2xl flex flex-col gap-6 text-center items-center">
          {/* Cyber Lock Shield Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#3b1219] border border-[#ff5555]/60 flex items-center justify-center text-[#ff5555] shadow-[0_0_25px_rgba(255,85,85,0.4)] animate-pulse">
            <ShieldAlert className="w-10 h-10 text-[#ff5555]" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#ff5555] tracking-widest uppercase font-extrabold px-3 py-1 rounded-full bg-[#ff5555]/10 border border-[#ff5555]/30 self-center">
              HTTP 403 // ACCESO DENEGADO
            </span>
            <h1 className="font-['Space_Grotesk'] text-[26px] sm:text-[28px] font-bold text-[#ffffff] tracking-tight leading-tight">
              Perímetro Administrativo Restringido
            </h1>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed max-w-md">
              El subdominio <strong>admin.*</strong> está físicamente aislado y reservado de forma estricta para roles pre-autorizados (<strong>Owner, Partners y Employees</strong>). Las cuentas de clientes o solicitudes anónimas no tienen autorización en este clúster.
            </p>
          </div>

          {/* Telemetry Box */}
          <div className="w-full p-3.5 rounded-xl bg-[#060c20] border border-[#ff5555]/30 text-left font-['JetBrains_Mono'] text-[11px] text-[#849396] flex flex-col gap-1">
            <div className="flex justify-between">
              <span>ZERO-TRUST STATUS:</span>
              <span className="text-[#ff5555] font-bold">REJECTED / UNPRIVILEGED</span>
            </div>
            <div className="flex justify-between">
              <span>AUDIT POLICY:</span>
              <span className="text-[#00daf3]">MUTABLE BLOCKED (RULE #01)</span>
            </div>
            <div className="flex justify-between">
              <span>ENCLAVE ROLE:</span>
              <span className="text-[#ffb4ab]">OWNER | PARTNER | EMPLOYEE ONLY</span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href="/login"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Admin</span>
            </a>

            <a
              href={getMainDomainUrl()}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#141d3b] hover:bg-[#1c274a] text-[#dce1ff] border border-[#23315a] font-['JetBrains_Mono'] text-[12px] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Portal Clientes</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
