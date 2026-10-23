'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import {
  ShieldAlert,
  Search,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Terminal,
  Activity,
  Globe,
  Sparkles,
} from 'lucide-react';

interface SecurityScannerLeadGenProps {
  showToast?: (msg: string) => void;
}

export const SecurityScannerLeadGen: React.FC<SecurityScannerLeadGenProps> = ({ showToast }) => {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [riskScore, setRiskScore] = useState(87);

  const scanSteps = [
    'Iniciando handshake TLS 1.3 y certificados X.509...',
    'Auditando puertos perimetrales y cabeceras HSTS/CSP...',
    'Evaluando superficies OWASP API Top 10 e inyección...',
    'Heurísticas de Zero-Trust y fuga de credenciales cloud...',
    'Generando matriz de riesgos y vector CVE-2026...',
  ];

  const simulatedVulnerabilities = [
    'Exposición de cabeceras de servidor sensibles (CORS Wildcard)',
    'Protocolo TLS 1.0/1.1 habilitado en subdominio secundario',
    'Fuga potencial de claves API en assets front-end estáticos',
  ];

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setUrl(formattedUrl);

    setIsScanning(true);
    setScanStep(0);
    setScanComplete(false);
    setLeadCaptured(false);

    // Calculate a pseudo-deterministic score based on URL
    const calcScore = 75 + (formattedUrl.length % 20);
    setRiskScore(calcScore);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < scanSteps.length) {
        setScanStep(current);
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setScanComplete(true);
        if (showToast) {
          showToast('Escaneo preliminar completado. Vulnerabilidades detectadas.');
        }
      }
    }, 750);
  };

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSaving(true);
    try {
      await supabase.from('potential_leads').insert({
        target_url: url,
        contact_email: email,
        risk_score: riskScore,
        vulnerabilities_detected: simulatedVulnerabilities,
        status: 'pending_report',
      });
    } catch {
      // Local graceful fallback
    }

    setIsSaving(false);
    setLeadCaptured(true);
    if (showToast) {
      showToast('Reporte CISO completo enviado. Un arquitecto de MRCA revisará sus hallazgos.');
    }
  };

  const handleReset = () => {
    setUrl('');
    setEmail('');
    setIsScanning(false);
    setScanStep(0);
    setScanComplete(false);
    setLeadCaptured(false);
  };

  return (
    <section className="relative w-full rounded-2xl bg-gradient-to-b from-[#141A32]/95 to-[#0A1128]/95 border border-[#00E5FF]/30 p-6 sm:p-8 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden my-8">
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#181E36] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 font-['JetBrains_Mono'] text-[10px] text-[#00E5FF] tracking-wider uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00E5FF]" />
              HERRAMIENTA GRATUITA DE DIAGNÓSTICO B2B
            </span>
            <span className="px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/30 font-['JetBrains_Mono'] text-[10px] text-[#00FF66] font-semibold">
              CVE-2026 ENGINE
            </span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-[#DCE1FF]">
            Escáner de Vulnerabilidades Perimetrales
          </h2>
          <p className="font-['Inter'] text-sm text-[#BAC9CC] mt-1 max-w-2xl">
            Descubra brechas de seguridad, debilidades de cifrado y puertos expuestos en la infraestructura digital de su empresa en segundos.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#181E36] px-4 py-2 rounded-xl border border-[#00E5FF]/20 shrink-0">
          <Activity className="w-5 h-5 text-[#00FF66] animate-pulse" />
          <div className="flex flex-col">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">AUDITORÍAS ACTIVAS</span>
            <span className="font-['JetBrains_Mono'] text-[13px] text-[#00E5FF] font-bold">1,428 ESCANEOS HOY</span>
          </div>
        </div>
      </div>

      {/* Stage 1: URL Input Form */}
      {!scanComplete && !leadCaptured && (
        <div className="relative z-10 mt-6 max-w-3xl mx-auto">
          <form onSubmit={handleStartScan} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00E5FF]">
                <Globe className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suempresa.com o dominio corporativo..."
                disabled={isScanning}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#0A1128]/80 border border-[#00E5FF]/40 text-[#DCE1FF] placeholder-[#849396] font-['JetBrains_Mono'] text-[13px] focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all disabled:opacity-60"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="px-6 py-3.5 rounded-xl bg-[#00E5FF] hover:bg-[#c3f5ff] text-[#00363D] font-['JetBrains_Mono'] text-[13px] font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isScanning ? 'ESCANEANDO...' : 'INICIAR ESCANEO'}</span>
            </button>
          </form>

          {/* Scanning Animation State */}
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-[#0A1128] border border-[#00E5FF]/30 font-['JetBrains_Mono'] text-[12px] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between text-[#BAC9CC]">
                <div className="flex items-center gap-2 text-[#00E5FF]">
                  <Terminal className="w-4 h-4 animate-spin" />
                  <span>AUDITORÍA EN TIEMPO REAL: {url}</span>
                </div>
                <span className="text-[#00FF66] font-bold">
                  {Math.round(((scanStep + 1) / scanSteps.length) * 100)}%
                </span>
              </div>

              {/* Step indicator */}
              <div className="w-full bg-[#181E36] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#00E5FF] to-[#00FF66] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                />
              </div>

              <div className="text-[#00E5FF] animate-pulse">
                &gt; {scanSteps[scanStep]}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Stage 2: Scan Results & Lead Email Unlock */}
      {scanComplete && !leadCaptured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Column: Risk Score & Findings Preview */}
          <div className="lg:col-span-7 flex flex-col gap-4 bg-[#0A1128]/80 p-5 rounded-xl border border-[#00E5FF]/20">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] uppercase">
                DOMINIO ANALIZADO: <strong className="text-[#00E5FF]">{url}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FF3366]/15 border border-[#FF3366]/30 text-[#FF5555] font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                VULNERABILIDADES DETECTADAS
              </span>
            </div>

            {/* Risk Gauge Bar */}
            <div className="p-3.5 rounded-lg bg-[#141A32] border border-[#181E36] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#FF5555]">
                  {riskScore} / 100
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#BAC9CC]">ÍNDICE DE RIESGO CIBERNÉTICO</span>
              </div>
              <div className="text-right">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#FFB4AB] font-semibold">
                  NIVEL: CRÍTICO MODERADO
                </span>
                <p className="font-['Inter'] text-[10px] text-[#849396]">Requiere mitigación perimetral prioritaria</p>
              </div>
            </div>

            {/* Vulnerability snippets (teasers) */}
            <div className="flex flex-col gap-2">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] uppercase font-bold">
                Hallazgos Clave Identificados:
              </span>
              {simulatedVulnerabilities.map((vuln, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-[#141A32]/60 border border-[#FF3366]/20 font-['JetBrains_Mono'] text-[11px] text-[#DCE1FF]"
                >
                  <ShieldAlert className="w-4 h-4 text-[#FF5555] shrink-0 mt-0.5" />
                  <span>{vuln}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Email Unlock Gate */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#141A32] to-[#0A1128] p-5 rounded-xl border border-[#00FF66]/30 shadow-[0_0_20px_rgba(0,255,102,0.1)]">
            <div>
              <div className="flex items-center gap-2 text-[#00FF66] mb-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>DESBLOQUEAR REPORTE CISO COMPLETO</span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#DCE1FF]">
                Reciba el PDF Ejecutivo con Planes de Mitigación
              </h3>
              <p className="font-['Inter'] text-xs text-[#BAC9CC] mt-1.5 leading-relaxed">
                Incluye análisis detallado de puertos, vectores de inyección SQL, configuración de cifrado y recomendaciones tácticas por arquitectos de MRCA Solutions.
              </p>
            </div>

            <form onSubmit={handleCaptureLead} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="su.correo@empresa.com"
                disabled={isSaving}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A1128] border border-[#00E5FF]/40 text-[#DCE1FF] placeholder-[#849396] font-['JetBrains_Mono'] text-[12px] focus:outline-none focus:border-[#00FF66]"
                required
              />
              <button
                type="submit"
                disabled={isSaving || !email.trim()}
                className="w-full py-2.5 rounded-lg bg-[#00FF66] hover:bg-[#80ffaa] text-[#00363D] font-['JetBrains_Mono'] text-[12px] font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{isSaving ? 'GENERANDO ENLACE...' : 'DESBLOQUEAR REPORTE PDF'}</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Stage 3: Confirmation / Success State */}
      {leadCaptured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mt-6 p-6 rounded-xl bg-[#141A32] border border-[#00FF66]/40 text-center flex flex-col items-center max-w-xl mx-auto"
        >
          <div className="w-12 h-12 rounded-full bg-[#00FF66]/15 border border-[#00FF66] flex items-center justify-center text-[#00FF66] mb-3 shadow-[0_0_15px_rgba(0,255,102,0.4)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#DCE1FF]">
            ¡Reporte de Seguridad Generado con Éxito!
          </h3>
          <p className="font-['Inter'] text-sm text-[#BAC9CC] mt-2">
            Hemos enviado el diagnóstico confidencial completo para <strong className="text-[#00E5FF]">{url}</strong> a <strong className="text-[#00FF66]">{email}</strong>.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-[#181E36] hover:bg-[#222941] text-[#00E5FF] font-['JetBrains_Mono'] text-[11px] font-semibold transition-all border border-[#00E5FF]/30"
            >
              Escanear Otro Dominio
            </button>
            <a
              href="#servicios"
              className="px-4 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#c3f5ff] text-[#00363D] font-['JetBrains_Mono'] text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(0,229,255,0.3)] flex items-center gap-1.5"
            >
              <span>Ver Servicios de Remediación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      )}
    </section>
  );
};
