import React, { useState } from 'react';
import { HologramCanvas } from './HologramCanvas';
import { ShamirSecretSharing } from './ShamirSecretSharing';
import { SecurityScannerLeadGen } from './SecurityScannerLeadGen';
import { AuditModal, HardwareTokenModal, InspectContractModal } from './Modals';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  FileCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface PublicLandingProps {
  onNavigateToAdmin: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onNavigateToAdmin,
  isMobileDrawerOpen: _isMobileDrawerOpen,
  setIsMobileDrawerOpen: _setIsMobileDrawerOpen,
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

  const businessSolutions = [
    {
      title: 'Desarrollo a la Medida',
      subtitle: 'Aceleramos tu negocio con software ágil',
      desc: 'Construimos plataformas web y sistemas de alta concurrencia adaptados exactamente al modelo operativo de tu empresa, eliminando fricción y automatizando procesos clave.',
      icon: 'code_blocks',
      features: ['Arquitectura Full-Stack Next.js / Rust', 'Velocidad de carga sub-segundo FCP < 0.5s', 'Integración fluida con bases de datos RLS'],
      tag: 'CRECIMIENTO EMPRESARIAL',
    },
    {
      title: 'Seguridad Grado Militar',
      subtitle: 'Protección inquebrantable de activos',
      desc: 'Blindamos tus sistemas y datos financieros contra ciberataques avanzados, ransomware y accesos no autorizados mediante protocolos de microsegmentación Zero-Trust.',
      icon: 'shield_lock',
      features: ['Aislamiento perimetral y llaves FIPS 140-3', 'Auditoría continua de vulnerabilidades', 'Defensa activa y detección proactiva de intrusiones'],
      tag: 'BLINDAJE PERIMETRAL',
    },
    {
      title: 'Certeza Legal & Cumplimiento',
      subtitle: 'Contratos formales y respaldo fiscal',
      desc: 'Operamos bajo estricto apego al marco jurídico mexicano. Facturación CFDI 4.0 con materialidad probatoria, custodia bancaria SPEI y obra por encargo según LFDA.',
      icon: 'gavel',
      features: ['Contratos con firma digital y sello SHA-256', 'Pena convencional y anticipos protegidos', 'Validación ante SAT y Código de Comercio'],
      tag: 'LEGAL & FISCAL COMPLIANCE',
    },
  ];

  const enterpriseStats = [
    {
      metric: '99.999%',
      label: 'Disponibilidad Garantizada',
      sublabel: 'SLA respaldado por contrato legal',
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
    },
    {
      metric: '0 Brechas',
      label: 'Integridad Absoluta',
      sublabel: 'Cero fugas de información crítica',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      metric: '10x',
      label: 'Velocidad de Despliegue',
      sublabel: 'Retorno de inversión acelerado',
      icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
    },
    {
      metric: 'CFDI 4.0',
      label: 'Cumplimiento SAT',
      sublabel: 'Materialidad fiscal documentada',
      icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const contracts = [
    {
      title: 'Términos Institucionales',
      version: 'V4.2.1',
      ref: '#MRCA-TC-2026-V4',
      hash: '8f9a2e3184dc921f009e4c8b21ad9c08928014e7f94bbcd29910ca84e03f9011',
      description: 'Marco contractual formal que rige la provisión de servicios de ingeniería, SLA de disponibilidad y confidencialidad.',
    },
    {
      title: 'Políticas de Privacidad',
      version: 'ZERO-RETENTION',
      ref: '#MRCA-PRIV-SEC (ISO-27001 Aligned)',
      hash: 'd13e54b8109312bcfe830209419abce742910fa7281048bceee2084920401830',
      description: 'Garantía matemática de privacidad estricta y protección de datos corporativos confidenciales.',
    },
    {
      title: 'Acuerdo SLA & Disponibilidad',
      version: 'SLA 99.999%',
      ref: '#MRCA-SLA-MISSION-CRITICAL',
      hash: '33a01fb910408dcaee8091bc24810287114efcba81048201840291ba09183419',
      description: 'Garantía de servicio con penalizaciones automáticas liquidadas bajo el régimen mercantil mexicano.',
    },
  ];

  return (
    <div className="flex flex-col w-full relative bg-transparent font-['Inter']">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[550px] bg-gradient-to-b from-cyan-500/10 via-teal-500/5 to-transparent blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[800px] right-0 w-96 h-96 bg-cyan-600/5 blur-[120px] pointer-events-none -z-10"></div>

      {/* Main Container with generous spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex flex-col gap-14 sm:gap-20">
        
        {/* =================================================================== */}
        {/* TOP STATUS BAR (Executive Clarity)                                  */}
        {/* =================================================================== */}
        <section className="w-full">
          <div className="w-full bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 backdrop-blur-xl rounded-xl p-3 sm:px-5 sm:py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
                  Sistemas Operacionales • 99.999% SLA Activo
                </span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/60 border border-white/5 font-['JetBrains_Mono'] text-[11px] text-slate-300">
                <span className="text-cyan-400 font-semibold">INFRAESTRUCTURA:</span>
                <span>CDMX &amp; US-EAST</span>
              </div>
            </div>

            <nav className="flex items-center gap-1.5 flex-wrap justify-center font-['Space_Grotesk'] text-[12px] font-medium">
              <a
                href="#soluciones"
                className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300"
              >
                Soluciones B2B
              </a>
              <a
                href="#seguridad"
                className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300"
              >
                Seguridad &amp; Cifrado
              </a>
              <a
                href="#contratos-legales"
                className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300"
              >
                Cumplimiento Legal
              </a>
              <button
                onClick={onNavigateToAdmin}
                className="ml-2 px-4 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 hover:border-transparent transition-all duration-300 flex items-center gap-1.5 font-bold cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Acceso Ejecutivo</span>
              </button>
            </nav>
          </div>
        </section>

        {/* =================================================================== */}
        {/* HERO SECTION: TOP-TIER SAAS AESTHETIC & CLEAR VALUE PROPOSITION     */}
        {/* =================================================================== */}
        <section className="relative w-full pt-4 sm:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col gap-6 z-10">
              <div className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
                <span className="font-['JetBrains_Mono'] text-[10.5px] text-cyan-300 uppercase tracking-wider font-bold">
                  INGENIERÍA DE SOFTWARE &amp; SEGURIDAD DE MISIÓN CRÍTICA
                </span>
              </div>

              <h1 className="font-['Space_Grotesk'] text-[36px] sm:text-[48px] lg:text-[56px] text-white font-extrabold tracking-tight leading-[1.1]">
                Desarrollo a la Medida con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  Seguridad de Grado Militar
                </span>
              </h1>

              <p className="font-['Inter'] text-[16px] sm:text-[18px] text-slate-300 max-w-2xl leading-relaxed">
                Aceleramos tu negocio construyendo plataformas digitales de alto impacto que protegen tus activos estratégicos, multiplican la eficiencia operativa y garantizan total certeza legal ante el SAT y las leyes mexicanas.
              </p>

              {/* Distinct Primary / Secondary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="min-h-[52px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-['Space_Grotesk'] text-[16px] font-bold tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>Comenzar Proyecto / Asesoría</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <a
                  href="#soluciones"
                  className="min-h-[52px] px-7 py-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white font-['Space_Grotesk'] text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
                >
                  <span>Conoce Nuestras Soluciones</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </a>
              </div>

              {/* Enterprise Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 border-t border-white/10">
                {enterpriseStats.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 backdrop-blur-md flex flex-col gap-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-bold text-white leading-none">
                        {item.metric}
                      </span>
                      {item.icon}
                    </div>
                    <span className="font-['Space_Grotesk'] text-[12px] font-bold text-slate-200">
                      {item.label}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 leading-tight">
                      {item.sublabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 3D Visualizer Hologram Core */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="w-full h-84 sm:h-[420px] rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.7)] relative overflow-hidden p-2 flex flex-col backdrop-blur-xl">
                <HologramCanvas className="flex-1" />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* CORE BUSINESS SOLUTIONS (ENTERPRISE VALUE PROPOSITIONS)              */}
        {/* =================================================================== */}
        <section className="w-full flex flex-col gap-8 pt-4" id="soluciones">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 tracking-widest uppercase font-bold">
                SOLUCIONES EMPRESARIALES DE ALTO IMPACTO
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[28px] sm:text-[36px] text-white font-bold tracking-tight">
              Aceleramos Tu Negocio con Arquitectura Blindada
            </h2>
            <p className="font-['Inter'] text-[15px] text-slate-300 leading-relaxed">
              Combinamos ingeniería de software de clase mundial con defensas cibernéticas y formalidad legal para ofrecerte una solución integral sin riesgos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessSolutions.map((sol, index) => (
              <div
                key={index}
                className="p-6 sm:p-7 rounded-xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl shadow-lg flex flex-col justify-between gap-6 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                      <span translate="no" className="notranslate material-symbols-outlined text-[22px]">
                        {sol.icon}
                      </span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[9.5px] text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-lg font-bold">
                      {sol.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-['Space_Grotesk'] text-[20px] text-white font-bold">
                      {sol.title}
                    </h3>
                    <p className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 mt-0.5">
                      {sol.subtitle}
                    </p>
                  </div>

                  <p className="font-['Inter'] text-[13.5px] text-slate-300 leading-relaxed">
                    {sol.desc}
                  </p>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                    {sol.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[12px] font-['Inter'] text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/40 font-['Space_Grotesk'] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Solicitar Propuesta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================================== */}
        {/* LEAD MAGNET: VULNERABILITY & READINESS SCANNER                      */}
        {/* =================================================================== */}
        <section className="w-full">
          <SecurityScannerLeadGen />
        </section>

        {/* =================================================================== */}
        {/* SECTION: SECURITY & TRUST CENTER (SHAMIR & CONTRACTS)               */}
        {/* =================================================================== */}
        <section className="w-full flex flex-col gap-6" id="seguridad">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-emerald-500/30 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase text-emerald-400 font-bold tracking-wider">
                CONFIDENCIALIDAD &amp; CIFRADO ZERO-KNOWLEDGE
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[28px] sm:text-[34px] text-white font-bold">
              Protección Matemática Contra Fugas y Amenazas
            </h2>
            <p className="font-['Inter'] text-[14.5px] text-slate-300 leading-relaxed">
              Tus secretos empresariales se fragmentan criptográficamente de modo que ningún tercero ni servidor único pueda reconstruirlos unilateralmente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Shamir's Secret Sharing Interactive Topology */}
            <div className="lg:col-span-7">
              <ShamirSecretSharing isDesktop={true} />
            </div>

            {/* Right Column: Cryptographic Contracts */}
            <div className="lg:col-span-5 flex flex-col gap-5" id="contratos-legales">
              <div className="bg-slate-900/80 border border-white/10 backdrop-blur-xl rounded-xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                    <span className="font-['Space_Grotesk'] text-[17px] text-white font-bold">
                      Expedientes y Contratos Formales
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold">
                    CFDI 4.0 SAT OK
                  </span>
                </div>

                <p className="font-['Inter'] text-[13px] text-slate-300 leading-relaxed">
                  Instrumentos contractuales verificables bajo el Código de Comercio de México con firma digital y sellado HSM.
                </p>

                <div className="flex flex-col gap-3">
                  {contracts.map((c) => (
                    <div
                      key={c.title}
                      className="bg-slate-950/80 rounded-xl p-3.5 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-['Space_Grotesk'] text-[13px] text-white font-bold">
                          {c.title}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-500/30 font-bold">
                          {c.version}
                        </span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400">{c.ref}</span>
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-900">
                        <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 truncate max-w-[150px]">
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
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-slate-950 font-['JetBrains_Mono'] text-[10px] font-bold uppercase transition-all"
                        >
                          Inspeccionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* BOTTOM CALL TO ACTION: EXECUTIVE DIALOGUE                           */}
        {/* =================================================================== */}
        <section className="w-full">
          <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/30 p-8 sm:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-[90px] pointer-events-none"></div>
            
            <div className="flex flex-col gap-2 max-w-2xl relative z-10">
              <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold tracking-widest uppercase">
                ALIANZA B2B TRANSPARENTE
              </span>
              <h2 className="font-['Space_Grotesk'] text-[26px] sm:text-[34px] text-white font-bold leading-tight">
                ¿Listo para transformar la seguridad y rendimiento de tu empresa?
              </h2>
              <p className="font-['Inter'] text-[14.5px] text-slate-300 leading-relaxed">
                Agenda una sesión ejecutiva confidencial con nuestro equipo de arquitectura. Analizamos tus necesidades sin compromiso y te entregamos un plan de desarrollo por fases.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-['Space_Grotesk'] text-[15px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
              >
                <span>Agendar Consulta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSubmit={(data) => {
          alert(`Solicitud de Asesoría registrada para ${data.email}. Un arquitecto senior de MRCA Solutions le contactará en breve.`);
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

export default PublicLanding;
