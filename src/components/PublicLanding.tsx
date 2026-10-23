import React, { useState, useEffect } from 'react';
import { HologramCanvas } from './HologramCanvas';
import { ShamirSecretSharing } from './ShamirSecretSharing';
import { SecurityScannerLeadGen } from './SecurityScannerLeadGen';
import { AuditModal, HardwareTokenModal, InspectContractModal } from './Modals';

interface PublicLandingProps {
  onNavigateToAdmin: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onNavigateToAdmin,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isHardwareTokenModalOpen, setIsHardwareTokenModalOpen] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<{
    isOpen: boolean;
    title: string;
    hash: string;
    version: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    hash: '',
    version: '',
    description: '',
  });

  const [cookieConsentVisible, setCookieConsentVisible] = useState(false);

  useEffect(() => {
    try {
      const isAccepted = localStorage.getItem('mrca_telemetry_accepted');
      if (!isAccepted) {
        setCookieConsentVisible(true);
      }
    } catch (e) {
      setCookieConsentVisible(true);
    }
  }, []);

  const handleAcceptTelemetry = () => {
    try {
      localStorage.setItem('mrca_telemetry_accepted', 'true');
    } catch (e) {}
    setCookieConsentVisible(false);
  };

  const techStackItems = [
    { title: 'Python', desc: 'AsyncIO / FastAPI / AI Kernels', icon: 'terminal', color: 'text-[#00e5ff]' },
    { title: 'Supabase', desc: 'PostgreSQL / RLS Enterprise', icon: 'database', color: 'text-[#00fe66]' },
    { title: 'React & Next.js', desc: 'Ultra-low Latency Frontend', icon: 'code_blocks', color: 'text-[#00e5ff]' },
    { title: 'Kali Linux', desc: 'NIDS / Pentest / Exploit Lab', icon: 'policy', color: 'text-[#ffb4ab]' },
    { title: 'Vercel Edge', desc: 'Edge Functions / CDN Shield', icon: 'language', color: 'text-[#dce1ff]' },
    { title: 'Kubernetes', desc: 'Zero-Trust Isolated Pods', icon: 'layers', color: 'text-[#9cf0ff]' },
    { title: 'Rust Core', desc: 'mTLS & Cryptographic Primitives', icon: 'memory', color: 'text-[#6bff83]' },
    { title: 'WireGuard & Cilium', desc: 'eBPF Mesh Encrypted Tunnel', icon: 'vpn_key', color: 'text-[#e1e0ff]' },
  ];

  const contracts = [
    {
      title: 'Términos Institucionales',
      version: 'V4.2.1',
      ref: '#MRCA-TC-2025-V4',
      hash: '8f9a2e3184dc921f009e4c8b21ad9c08928014e7f94bbcd29910ca84e03f9011',
      description: 'Marco contractual que rige la provisión de microservicios blindados y acuerdos de no divulgación criptográfica con hardware HSM.',
    },
    {
      title: 'Políticas de Privacidad',
      version: 'ZERO-RETENTION',
      ref: '#MRCA-PRIV-SEC (GDPR/Swiss-Aligned)',
      hash: 'd13e54b8109312bcfe830209419abce742910fa7281048bceee2084920401830',
      description: 'Garantía matemática de cero retención de memoria residual. Destrucción de claves efímeras tras cada handshake.',
    },
    {
      title: 'SLA de Resiliencia y Datos',
      version: 'SLA 99.999%',
      ref: '#MRCA-SLA-RPO-RTO-ZERO',
      hash: '33a01fb910408dcaee8091bc24810287114efcba81048201840291ba09183419',
      description: 'Acuerdo de nivel de servicio con penalizaciones automáticas liquidadas vía contratos inteligentes y doble dispersión escrow.',
    },
  ];

  return (
    <div className="flex flex-col w-full relative bg-transparent">

      {/* Top Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-96 bg-[#00e5ff]/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-10">
        {/* SECTION 1: TOP STATUS BAR (Quick Anchor Bar & Live Telemetry Node) */}
        <section className="w-full">
          <div className="w-full bg-[#141a32]/80 border border-[#00e5ff]/20 backdrop-blur-md rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#222941] border border-[#00fe66]/30">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] uppercase tracking-wider font-semibold">
                  All Systems Operational — 99.9% Uptime (CDMX & US-East Cluster)
                </span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060d24] font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">
                <span className="text-[#00e5ff] font-semibold">LATENCY:</span>
                <span className="text-[#6bff83]">1.14ms</span>
              </div>
            </div>

            <nav className="flex items-center gap-1 flex-wrap justify-center font-['JetBrains_Mono'] text-[11px] uppercase">
              <a
                href="#arquitectura"
                className="px-3 py-1 rounded hover:bg-[#181e36] text-[#bac9cc] hover:text-[#00e5ff] transition-all"
              >
                Arquitectura
              </a>
              <a
                href="#seguridad-cifrado"
                className="px-3 py-1 rounded hover:bg-[#181e36] text-[#bac9cc] hover:text-[#00e5ff] transition-all"
              >
                Seguridad & Cifrado
              </a>
              <a
                href="#tech-stack"
                className="px-3 py-1 rounded hover:bg-[#181e36] text-[#bac9cc] hover:text-[#00e5ff] transition-all"
              >
                Tech Stack
              </a>
              <button
                onClick={onNavigateToAdmin}
                className="px-3 py-1 rounded bg-[#222941] hover:bg-[#00e5ff] hover:text-[#00363d] text-[#00e5ff] border border-[#00e5ff]/40 transition-all flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">key</span>
                <span>Portal Privado</span>
              </button>
            </nav>
          </div>
        </section>

        {/* SECTION 2: HERO & HOLOGRAPHIC CORE */}
        <section className="relative w-full pt-2" id="arquitectura">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col gap-4 z-10">
              <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-[#222941]/90 border border-[#00fe66]/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#00fe66] shadow-[0_0_8px_rgba(0,254,102,0.8)] animate-pulse-dot"></span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase tracking-wider font-semibold">
                  PROTOCOLO ZERO-TRUST V2.4.1 // HIGH-ASSURANCE CLUSTER
                </span>
              </div>

              <h1 className="font-['Space_Grotesk'] text-[32px] sm:text-[44px] lg:text-[48px] text-[#dce1ff] font-bold tracking-tight leading-tight">
                Ingeniería de Software &{' '}
                <span className="text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                  Seguridad B2B
                </span>
              </h1>

              <p className="font-['Inter'] text-[15px] sm:text-[16px] text-[#bac9cc] max-w-2xl leading-relaxed">
                Arquitectura resiliente en la nube, microservicios blindados y auditoría criptográfica continua para consorcios corporativos de misión crítica. Protección inquebrantable desde el silicio hasta la capa de aplicación.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="min-h-[48px] px-6 py-3 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['Space_Grotesk'] text-[16px] font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,229,255,0.4)] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">shield_lock</span>
                  <span>Desplegar Auditoría de Seguridad</span>
                </button>
                <a
                  href="#tech-stack"
                  className="min-h-[48px] px-6 py-3 rounded-lg bg-[#222941]/80 hover:bg-[#2d344c] border border-[#00e5ff]/20 text-[#c3f5ff] font-['Space_Grotesk'] text-[16px] font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">account_tree</span>
                  <span>Explorar Arquitectura</span>
                </a>
              </div>

              {/* Live Telemetry Grid (4 items) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-3.5 rounded-xl bg-[#181e36]/80 border border-[#222941] backdrop-blur-md flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">VELOCIDAD</span>
                    <span className="material-symbols-outlined text-[#00e5ff] text-[15px]">bolt</span>
                  </div>
                  <div className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] text-[#dce1ff] font-bold">42.8M</div>
                  <div className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff]">OPS/s nominal</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181e36]/80 border border-[#222941] backdrop-blur-md flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">FAILOVER</span>
                    <span className="material-symbols-outlined text-[#00fe66] text-[15px]">sync</span>
                  </div>
                  <div className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] text-[#00fe66] font-bold">
                    0.00<span className="text-[14px]">ms</span>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">Latencia rSync</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181e36]/80 border border-[#222941] backdrop-blur-md flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">CERTIFICACIÓN</span>
                    <span className="material-symbols-outlined text-[#00e5ff] text-[15px]">verified</span>
                  </div>
                  <div className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] text-[#dce1ff] font-bold pt-1">
                    SOC-2 II
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">ISO-27001 Activa</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181e36]/80 border border-[#222941] backdrop-blur-md flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">CONFIABILIDAD</span>
                    <span className="material-symbols-outlined text-[#00fe66] text-[15px]">verified_user</span>
                  </div>
                  <div className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] text-[#dce1ff] font-bold">99.999%</div>
                  <div className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff]">SLA Institucional</div>
                </div>
              </div>
            </div>

            {/* Right 3D Visualizer */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00e5ff]/10 blur-[90px] rounded-full pointer-events-none"></div>
              <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#060d24]/90 border border-[#00e5ff]/30 shadow-2xl relative overflow-hidden p-2 flex flex-col">
                <HologramCanvas className="flex-1" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: TECH STACK MARQUEE */}
        <section className="w-full" id="tech-stack">
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00e5ff] rounded-sm"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] uppercase tracking-widest font-bold">
                  Sub-System Stack
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">GLOBAL_SYNC: VERIFIED</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] text-[#dce1ff] font-bold">
              Pila Tecnológica de Alto Rendimiento
            </h2>
          </div>

          <div className="relative w-full overflow-hidden bg-[#141a32]/70 border border-[#00e5ff]/20 backdrop-blur-md rounded-2xl py-4 shadow-md">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#0b1229] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#0b1229] to-transparent z-10 pointer-events-none"></div>

            <div className="animate-marquee gap-4 items-center">
              {[...techStackItems, ...techStackItems].map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#222941] border border-[#3b494c] hover:border-[#00e5ff]/50 transition-all min-w-[260px] shadow-sm"
                >
                  <div className="w-10 h-10 rounded bg-[#060d24] flex items-center justify-center">
                    <span className={`material-symbols-outlined text-[22px] ${item.color}`}>{item.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[15px] text-[#dce1ff] font-semibold">{item.title}</span>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: STACK ARQUITECTÓNICO BLINDADO */}
        <section className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]"></span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] tracking-widest uppercase font-semibold">
                CAPAS DE PROTECCIÓN
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] text-[#dce1ff] font-bold">
              Stack Arquitectónico Blindado
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
              Defensa cibernética multinivel diseñada contra adversarios avanzados APT y ataques de estado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="p-5 rounded-xl bg-[#181e36]/80 border border-[#00e5ff]/20 backdrop-blur-xl shadow-lg flex flex-col gap-3 hover:border-[#00e5ff]/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#222941] flex items-center justify-center text-[#00e5ff] shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">developer_board</span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] bg-[#222941] px-2 py-1 rounded">
                  NODO-01 // HARDWARE
                </span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-semibold">
                Microservicios Distribuidos Zero-Trust
              </h3>
              <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                Aislamiento por micro-segmentación estricta y validación continua en hardware físico.
              </p>
              <div className="flex flex-col gap-2 pt-1 border-t border-[#222941]">
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Hardware Root-of-Trust TPM 2.0</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Rotación automática mTLS 15 min</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Cilium eBPF Kernel Observability</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-xl bg-[#181e36]/80 border border-[#00fe66]/20 backdrop-blur-xl shadow-lg flex flex-col gap-3 hover:border-[#00fe66]/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#222941] flex items-center justify-center text-[#00fe66] shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">key</span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] bg-[#222941] px-2 py-1 rounded">
                  NODO-02 // QUANTUM-PROOF
                </span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-semibold">
                Defensa Activa Criptográfica
              </h3>
              <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                Primitivas inmunes a computación cuántica y control de privilegios de granularidad atómica.
              </p>
              <div className="flex flex-col gap-2 pt-1 border-t border-[#222941]">
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Kyber / Dilithium Post-Quantum</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>RBAC Sin Estado con tokens EFEM</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Argon2id Hash KDF con sal dinámico</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-xl bg-[#181e36]/80 border border-[#00e5ff]/20 backdrop-blur-xl shadow-lg flex flex-col gap-3 hover:border-[#00e5ff]/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#222941] flex items-center justify-center text-[#00e5ff] shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">history_edu</span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] bg-[#222941] px-2 py-1 rounded">
                  NODO-03 // AUDITORÍA
                </span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-semibold">
                Auditoría Forense en Tiempo Real
              </h3>
              <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                Trazabilidad inmutable de eventos de seguridad con detección proactiva de intrusión.
              </p>
              <div className="flex flex-col gap-2 pt-1 border-t border-[#222941]">
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Ledger inmutable firmado SHA-512</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Detección heurística SOC asistida</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#dce1ff]">
                  <span className="material-symbols-outlined text-[#00fe66] text-[16px]">check_circle</span>
                  <span>Exportación compatible SIEM / Splunk</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEAD CAPTURE MAGNET: VULNERABILITY SCANNER */}
        <SecurityScannerLeadGen />

        {/* SECTION 5: SECURITY & TRUST CENTER SECTION */}
        <section className="w-full flex flex-col gap-4" id="seguridad-cifrado">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#222941] w-fit border border-[#00fe66]/30">
              <span className="material-symbols-outlined text-[#00fe66] text-[16px]">verified</span>
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase text-[#00fe66] font-bold">
                Institutional Trust & Cryptography
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[24px] sm:text-[32px] text-[#dce1ff] font-bold">
              Protocolos Criptográficos & Almacenamiento Zero-Knowledge
            </h2>
            <p className="font-['Inter'] text-[14px] text-[#bac9cc] max-w-3xl">
              Ninguna clave existe de forma integral en un solo servidor. Implementamos esquemas matemáticos que impiden la exfiltración unilateral de secretos críticos de negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Shamir's Secret Sharing Interactive Topology */}
            <div className="lg:col-span-8">
              <ShamirSecretSharing isDesktop={true} />
            </div>

            {/* Right Column: Cryptographic Contracts & Bunker Callout */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-[#141a32]/80 border border-[#00e5ff]/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#00e5ff]">
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                  <span className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-semibold">
                    Contratos Criptográficos
                  </span>
                </div>
                <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
                  Documentos legales y técnicos inmutables sellados en hardware HSM con integridad verificable bajo estándar SHA-256.
                </p>

                {contracts.map((c) => (
                  <div
                    key={c.title}
                    className="bg-[#222941]/80 rounded-xl p-3 border border-[#3b494c] flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-semibold">
                        {c.title}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#060d24] text-[#00fe66]">
                        {c.version}
                      </span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] truncate">{c.ref}</span>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#181e36]">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] truncate max-w-[140px]">
                        sha256:{c.hash.slice(0, 10)}...
                      </span>
                      <button
                        onClick={() =>
                          setInspectDoc({
                            isOpen: true,
                            title: c.title,
                            hash: c.hash,
                            version: c.version,
                            description: c.description,
                          })
                        }
                        className="px-2 py-0.5 rounded bg-[#00e5ff]/15 hover:bg-[#00e5ff] text-[#00e5ff] hover:text-[#00363d] font-['JetBrains_Mono'] text-[10px] uppercase transition-colors"
                      >
                        Inspeccionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secure Enclave Facility Photo Callout */}
              <div className="relative bg-[#141a32] rounded-2xl overflow-hidden p-5 border border-[#00e5ff]/30 shadow-xl flex flex-col justify-end min-h-[170px]">
                <div
                  className="bg-cover bg-center absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCrVhztVhJq3VTro2Q_pjxP73ZUWGKLNF7IRY3R0-dOz2DzYZ30OkmLXyTbEIaOSUmDSGdjYzcKaGJ28dxOZgCCBNL9yZ3JQ8aY4r081PkTGkQeewzWRNTkNqsGQuYkZTyxbfCsjBP83ruBtfZJ55VOw7lKHV4_eH9Vh3L2ijoWsBfQFZzF-boofwzNpkHwiu0WFt0etowitKa8dV45EsK3ZOk_Yrp96ez8FBPEgjkX-ia8ufbANSgmBQ')",
                  }}
                ></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#00fe66] font-['JetBrains_Mono'] text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[14px]">nest_cam_wired_stand</span>
                    DATACENTER CAGE: ALPHA-EQUINIX
                  </div>
                  <span className="font-['Space_Grotesk'] text-[17px] text-[#dce1ff] font-bold">
                    Búnker de Silicio Cifrado
                  </span>
                  <span className="font-['Inter'] text-[12px] text-[#bac9cc]">
                    Aislamiento físico con detección tamper-evident continua.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: CLIENT ALPHA-1 ACCESS PORTAL */}
        <section className="w-full" id="portal-privado">
          <div className="bg-[#141a32]/90 border border-[#00e5ff]/30 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#00e5ff]/15 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Explanatory Text Column */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#222941] w-fit border border-[#00e5ff]/30">
                  <span className="material-symbols-outlined text-[#00e5ff] text-[16px]">vpn_lock</span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider">
                    Restricted Zero Trust Gateway
                  </span>
                </div>

                <h2 className="font-['Space_Grotesk'] text-[28px] sm:text-[34px] text-[#dce1ff] font-bold">
                  Client Alpha-1 Access Portal
                </h2>

                <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
                  Acceso exclusivo para directores de ciberseguridad corporativos y oficiales de cumplimiento. La autenticación está sujeta a handshake de clave pública FIDO2 / YubiKey hardware mTLS.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2 text-[#dce1ff] text-[13px] font-['Inter']">
                    <span className="material-symbols-outlined text-[#00fe66] text-[18px]">check_circle</span>
                    <span>Hardware Token Binding (WebAuthn / FIDO2)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#dce1ff] text-[13px] font-['Inter']">
                    <span className="material-symbols-outlined text-[#00fe66] text-[18px]">check_circle</span>
                    <span>Protección Anti-Exfiltración IP con Geo-Fencing activo</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#dce1ff] text-[13px] font-['Inter']">
                    <span className="material-symbols-outlined text-[#00fe66] text-[18px]">check_circle</span>
                    <span>Telemetría de ejecución de código en tiempo real (eBPF)</span>
                  </div>
                </div>
              </div>

              {/* Handshake Console Terminal Box */}
              <div className="lg:col-span-7">
                <div className="bg-[#060d24]/90 border border-[#222941] rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#181e36]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#ffb4ab]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#849396]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#00fe66]"></span>
                      <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] ml-1">
                        auth.gateway.mrca.network — 443
                      </span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#222941] text-[#00daf3] font-semibold">
                      HANDSHAKE_PENDING
                    </span>
                  </div>

                  <div className="space-y-1.5 font-['JetBrains_Mono'] text-[11px] sm:text-[12px] bg-[#0b1229] p-3.5 rounded-xl mb-4 overflow-x-auto border border-[#181e36]">
                    <div className="flex items-center gap-2 text-[#bac9cc]">
                      <span className="text-[#00e5ff]">[08:42:19.002]</span>
                      <span>INCOMING_TCP_SYN: ip=187.190.12.9:54210 payload=TLS1.3</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#bac9cc]">
                      <span className="text-[#00e5ff]">[08:42:19.014]</span>
                      <span className="text-[#00fe66]">CIPHER_SUITE: TLS_AES_256_GCM_SHA384 negotiated</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#bac9cc]">
                      <span className="text-[#00e5ff]">[08:42:19.030]</span>
                      <span>FIDO2_CHALLENGE: nonce=7b4a8e91f03d420a verifying...</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#e1e0ff]">
                      <span className="text-[#00e5ff]">[08:42:19.048]</span>
                      <span className="animate-pulse text-[#00fe66]">&gt; WAITING FOR YUBIKEY PIN + TOUCH GESTURE [BIO_KEY_2]</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-['JetBrains_Mono'] text-[10px] uppercase text-[#bac9cc]">
                        Identificador Corporativo
                      </label>
                      <div className="flex items-center bg-[#181e36] px-3 py-2 rounded-lg border border-[#3b494c]">
                        <span className="material-symbols-outlined text-[16px] text-[#bac9cc] mr-2">badge</span>
                        <input
                          className="bg-transparent font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] w-full focus:outline-none"
                          readOnly
                          value="CISO-AUTH@PARTNER.MRCA"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-['JetBrains_Mono'] text-[10px] uppercase text-[#bac9cc]">
                        Security Enclave Key
                      </label>
                      <div className="flex items-center bg-[#181e36] px-3 py-2 rounded-lg border border-[#3b494c]">
                        <span className="material-symbols-outlined text-[16px] text-[#00e5ff] mr-2">fingerprint</span>
                        <input
                          className="bg-transparent font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] w-full focus:outline-none"
                          readOnly
                          type="password"
                          value="••••••••••••••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[#bac9cc] font-['JetBrains_Mono'] text-[11px]">
                      <span className="material-symbols-outlined text-[16px] text-[#00fe66]">shield</span>
                      <span>2FA / mTLS Hardware Verified Token Requerido</span>
                    </div>
                    <button
                      onClick={() => setIsHardwareTokenModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      <span>Verificar Token Hardware</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: AUDIT METRICS */}
        <section className="w-full">
          <div className="bg-[#060d24] border border-[#222941] rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#222941]">
              <div className="flex flex-col gap-1 md:pr-6 pt-2 md:pt-0">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff] uppercase tracking-wider font-semibold">
                  Cero Brechas Históricas
                </span>
                <span className="font-['Space_Grotesk'] text-[36px] sm:text-[44px] text-[#dce1ff] font-bold">100%</span>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                  Inviolabilidad demostrada en auditorías de pentesting de caja negra y roja por firmas Tier-1 internacionales.
                </p>
              </div>

              <div className="flex flex-col gap-1 md:px-6 pt-6 md:pt-0">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] uppercase tracking-wider font-semibold">
                  Cumplimiento Criptográfico
                </span>
                <span className="font-['Space_Grotesk'] text-[36px] sm:text-[44px] text-[#00fe66] font-bold">&lt; 15 min</span>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                  Tiempo máximo de rotación automática de secretos globales ante cualquier sospecha de anomalía de tráfico.
                </p>
              </div>

              <div className="flex flex-col gap-1 md:pl-6 pt-6 md:pt-0">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] uppercase tracking-wider font-semibold">
                  Soberanía de Datos
                </span>
                <span className="font-['Space_Grotesk'] text-[36px] sm:text-[44px] text-[#00e5ff] font-bold">Local-First</span>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                  Retención territorial estricta para instituciones bancarias en México, Suiza y la Unión Europea.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* STICKY / FLOATING COOKIE & CRYPTOGRAPHIC TELEMETRY CONSENT BANNER */}
      {cookieConsentVisible && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-16 md:max-w-xl z-40 bg-[#060d24]/95 border border-[#00e5ff]/40 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl shadow-[0_20px_40px_rgba(5,9,20,0.8),0_0_30px_rgba(0,229,255,0.15)] flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-[#00e5ff]">
              <span className="material-symbols-outlined text-[20px]">cookie</span>
              <span className="font-['Space_Grotesk'] text-[16px] text-[#dce1ff] font-semibold">
                Gobernanza Criptográfica de Telemetría
              </span>
            </div>
            <button
              onClick={handleAcceptTelemetry}
              className="text-[#bac9cc] hover:text-[#dce1ff] p-0.5"
              aria-label="Cerrar aviso"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
            MRCA Solutions trata identificadores anónimos cifrados en tránsito exclusivamente para monitorear resiliencia y mitigar ataques DDOS. Cero cookies de terceros y cumplimiento estricto RGPD/CCPA.
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              onClick={handleAcceptTelemetry}
              className="px-3 py-1.5 rounded-lg bg-[#181e36] hover:bg-[#222941] text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] uppercase transition-colors"
            >
              Solo Esenciales
            </button>
            <button
              onClick={() => {
                alert('Políticas Criptográficas Configuradas: Modos HSM Zero-Retention Activados.');
                handleAcceptTelemetry();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#222941] hover:bg-[#2d344c] text-[#00daf3] font-['JetBrains_Mono'] text-[11px] uppercase transition-colors"
            >
              Preferencias Criptográficas
            </button>
            <button
              onClick={handleAcceptTelemetry}
              className="px-4 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[11px] uppercase font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              Aceptar Todas
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSubmit={(data) => {
          alert(`Solicitud de Auditoría enviada para ${data.email}. Un ingeniero senior iniciará contacto seguro vía PGP.`);
        }}
      />

      <HardwareTokenModal
        isOpen={isHardwareTokenModalOpen}
        onClose={() => setIsHardwareTokenModalOpen(false)}
        onSuccess={() => {
          onNavigateToAdmin();
        }}
      />

      <InspectContractModal
        isOpen={inspectDoc.isOpen}
        onClose={() => setInspectDoc((prev) => ({ ...prev, isOpen: false }))}
        title={inspectDoc.title}
        hash={inspectDoc.hash}
        version={inspectDoc.version}
        description={inspectDoc.description}
      />
    </div>
  );
};
