import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Home, 
  Terminal, 
  Building2, 
  GraduationCap, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check,
  ServerCrash
} from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
  onNavigateClient?: () => void;
  onNavigateAdmin?: () => void;
  onNavigateAcademy?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome = () => { window.location.href = '/'; },
  onNavigateClient = () => { window.location.href = '/#portal'; },
  onNavigateAdmin = () => { window.location.href = '/#admin'; },
  onNavigateAcademy = () => { window.location.href = '/#academy'; },
}) => {
  const [copied, setCopied] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagStep, setDiagStep] = useState(0);

  const currentHost = typeof window !== 'undefined' ? window.location.host : 'mrcasolutions.com';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search + window.location.hash : '/desconocido';

  const copyTelemetry = () => {
    const telemetry = `[MRCA_ZERO_TRUST_404_TELEMETRY]\nHost: ${currentHost}\nVector: ${currentPath}\nStatus: 404 NOT_FOUND\nTimestamp: ${new Date().toISOString()}\nEnclave: SEC-SHARD-PROD-01`;
    navigator.clipboard.writeText(telemetry);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runDiagnostic = () => {
    setDiagnosing(true);
    setDiagStep(1);
    setTimeout(() => setDiagStep(2), 500);
    setTimeout(() => setDiagStep(3), 1000);
    setTimeout(() => {
      setDiagnosing(false);
      setDiagStep(4);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#060d24] text-[#dce1ff] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Cyber Mesh & Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00e5ff]/10 via-[#0a1128]/80 to-[#060d24] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#222941]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0a1128] border border-[#00e5ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <span className="font-['Space_Grotesk'] font-black text-[16px] text-[#00e5ff]">M</span>
          </div>
          <div>
            <span className="font-['Space_Grotesk'] font-bold text-[16px] tracking-wider text-white">
              MRCA <span className="text-[#00e5ff]">SOLUTIONS</span>
            </span>
            <div className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse" />
              EDGE ROUTING // ZERO-TRUST GATEWAY
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0a1128] border border-[#222941] hover:border-[#00e5ff]/50 text-[12px] font-['JetBrains_Mono'] text-[#bac9cc] hover:text-[#00e5ff] transition-all cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>Volver al Inicio</span>
        </button>
      </header>

      {/* Main 404 Hero Section */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        {/* Animated Cyber Radar Badge */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0a1128]/90 border border-red-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 text-red-400 relative z-10" />
            
            {/* Subtle scanning line effect */}
            <motion.div 
              className="absolute left-0 right-0 h-[2px] bg-red-400/60 shadow-[0_0_8px_#ef4444]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />
          </div>

          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-red-950/90 border border-red-500/60 text-red-400 font-['JetBrains_Mono'] text-[10px] font-bold">
            HTTP 404
          </div>
        </motion.div>

        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider mb-4">
          <ServerCrash className="w-3.5 h-3.5 text-red-400" />
          <span>VECTOR NO LOCALIZADO // ENCLAVE ERROR</span>
        </div>

        {/* 404 Headline */}
        <h1 className="font-['Space_Grotesk'] text-4xl sm:text-6xl font-black text-white tracking-tight mb-3">
          404 <span className="text-[#00e5ff]">/</span> ENCLAVE DESCONOCIDO
        </h1>

        <p className="font-['Inter'] text-[14px] sm:text-[16px] text-[#bac9cc] max-w-xl mb-8 leading-relaxed">
          La ruta, subdominio o recurso solicitado no existe en la topología de red de MRCA Solutions o requiere elevación de privilegios criptográficos Zero-Trust.
        </p>

        {/* Telemetry Terminal Box */}
        <div className="w-full max-w-2xl bg-[#0a1128]/95 border border-[#222941] rounded-2xl p-4 sm:p-5 shadow-2xl text-left font-['JetBrains_Mono'] text-[12px] mb-8 relative backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222941] text-[#849396] text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="text-[#bac9cc] font-bold">DIAGNÓSTICO DE ENRUTAMIENTO EDGE</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnostic}
                disabled={diagnosing}
                className="flex items-center gap-1 hover:text-[#00e5ff] transition-colors cursor-pointer disabled:opacity-50"
                title="Ejecutar re-escaneo de topología"
              >
                <RefreshCw className={`w-3 h-3 ${diagnosing ? 'animate-spin text-[#00e5ff]' : ''}`} />
                <span>{diagnosing ? 'Escaneando...' : 'Re-escanear'}</span>
              </button>
              <span>•</span>
              <button
                onClick={copyTelemetry}
                className="flex items-center gap-1 hover:text-[#00fe66] transition-colors cursor-pointer"
                title="Copiar telemetría técnica"
              >
                {copied ? <Check className="w-3 h-3 text-[#00fe66]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-[#bac9cc]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#849396]">Host Solicitado:</span>
              <span className="text-[#00e5ff] font-bold">{currentHost}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#849396]">Vector de Ruta:</span>
              <span className="text-red-400 break-all">{currentPath}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#849396]">Política Zero-Trust:</span>
              <span className="text-[#00fe66]">ENCLAVE_ISOLATION_STRICT // TLS 1.3</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#849396]">Fallback de Producción:</span>
              <span className="text-[#bac9cc]">SPA Rewrites index.html vía vercel.json</span>
            </div>
          </div>

          {diagStep > 0 && (
            <div className="mt-3 pt-3 border-t border-[#222941] text-[11px] text-[#00e5ff]">
              {diagStep === 1 && '▶ [1/3] Verificando DNS de subdominio en Vercel Edge Network...'}
              {diagStep === 2 && '▶ [2/3] Comprobando reglas de rewrite en vercel.json...'}
              {diagStep === 3 && '▶ [3/3] Validando claves y credenciales de enrutamiento...'}
              {diagStep === 4 && (
                <div className="text-[#00fe66] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Escaneo completado: El enrutador Edge está operativo. Redirigiendo a un nodo seguro recomendado abajo.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            onClick={onNavigateHome}
            className="p-4 rounded-2xl bg-[#0a1128] hover:bg-[#141a32] border border-[#222941] hover:border-[#00e5ff]/50 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#060d24] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-2 group-hover:shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              <Home className="w-4 h-4" />
            </div>
            <h3 className="font-['Space_Grotesk'] font-bold text-[13px] text-white group-hover:text-[#00e5ff]">
              Portal Principal
            </h3>
            <p className="font-['Inter'] text-[11px] text-[#849396] mt-0.5">
              Landing page B2B e ingeniería.
            </p>
          </button>

          <button
            onClick={onNavigateClient}
            className="p-4 rounded-2xl bg-[#0a1128] hover:bg-[#141a32] border border-[#222941] hover:border-[#00fe66]/50 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#060d24] border border-[#00fe66]/30 flex items-center justify-center text-[#00fe66] mb-2 group-hover:shadow-[0_0_10px_rgba(0,254,102,0.4)]">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-['Space_Grotesk'] font-bold text-[13px] text-white group-hover:text-[#00fe66]">
              Portal de Clientes
            </h3>
            <p className="font-['Inter'] text-[11px] text-[#849396] mt-0.5">
              Bóveda fiscal, contratos & tickets.
            </p>
          </button>

          <button
            onClick={onNavigateAcademy}
            className="p-4 rounded-2xl bg-[#0a1128] hover:bg-[#141a32] border border-[#222941] hover:border-purple-400/50 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#060d24] border border-purple-400/30 flex items-center justify-center text-purple-400 mb-2 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.4)]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-['Space_Grotesk'] font-bold text-[13px] text-white group-hover:text-purple-300">
              MRCA Academy
            </h3>
            <p className="font-['Inter'] text-[11px] text-[#849396] mt-0.5">
              Módulos Kali & ciberseguridad.
            </p>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[13px] font-bold shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar a Coordenadas Seguras</span>
          </button>
        </div>
      </main>

      {/* Cyber Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-['JetBrains_Mono'] text-[#849396] border-t border-[#222941]/60">
        <div>
          © 2026 MRCA Solutions. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#00fe66]">
            <Lock className="w-3 h-3" />
            Zero-Trust Protocol V4.2
          </span>
          <span className="text-[#00e5ff]">Vercel Edge Active</span>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;
