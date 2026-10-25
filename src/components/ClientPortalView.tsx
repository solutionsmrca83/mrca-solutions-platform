import React, { useState, useEffect } from 'react';
import { EngineeringCapability, ClientChatMessage, ClientContract } from '../types';
import { SecureClientInbox } from './SecureClientInbox';
import { LiveRoadmap } from './LiveRoadmap';
import { ApiKeyMetricsDashboard } from './ApiKeyMetricsDashboard';
import { ClientContractsModal } from './ClientContractsModal';
import { SystemHealthWidget } from './SystemHealthWidget';
import { ClientBillingHub } from './ClientBillingHub';
import { ClientSupportTickets } from './ClientSupportTickets';
import { ClientFileVault } from './ClientFileVault';
import { SecurityAuditLogs } from './SecurityAuditLogs';
import { InvoiceVault } from './InvoiceVault';
import { ClientLayout } from './layouts/ClientLayout';
import { FileText, Key, Activity, ShieldCheck, FileCheck, DollarSign, LifeBuoy, FolderArchive, ShieldAlert, Receipt } from 'lucide-react';

interface ClientPortalViewProps {
  clientEmail?: string;
  clientCompany?: string;
  onSignOut?: () => void;
  showToast?: (msg: string) => void;
}

export type ClientPortalTab =
  | 'capacidades'
  | 'roadmap'
  | 'api-keys'
  | 'finanzas'
  | 'soporte'
  | 'boveda'
  | 'chat'
  | 'inbox'
  | 'auditoria'
  | 'facturas';

const INITIAL_CONTRACTS: ClientContract[] = [
  {
    id: 'CTR-2026-904',
    client_id: 'usr_client_demo',
    client_name: 'Director Tecnológico Corporativo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    template_id: 'tmpl_nda_v4',
    title: 'NDA - Acuerdo de Confidencialidad & Sigilo Criptográfico Zero-Trust',
    content: `ACUERDO BILATERAL DE CONFIDENCIALIDAD Y PROTECCIÓN CRIPTOGRÁFICA (NDA ZERO-TRUST)

ENTRE LAS PARTES:
MCRA SOLUTIONS S.A.P.I. DE C.V., representada por su Enclave de Dirección Ejecutiva (Jefe & Socio), y por la otra parte:
EMPRESA BENEFICIARIA: FinTech Global B2B
REPRESENTANTE LEGAL: Director Tecnológico Corporativo
CORREO INSTITUCIONAL: cliente@enterprise.corp

CLÁUSULA PRIMERA — OBJETO DEL SIGILO TECNOLÓGICO:
Las partes compartirán arquitectura de software, microservicios blindados y esquemas de bases de datos PostgreSQL con RLS con el fin de evaluar y desplegar servicios de ingeniería de alta concurrencia.

CLÁUSULA SEGUNDA — NO REVELACIÓN Y PROTECCIÓN CRIPTOGRÁFICA:
Toda información compartida se considera Carga Útil Confidencial Nivel 4 (FIPS 140-3). Queda estrictamente prohibida su divulgación o ingesta en modelos no autorizados sin firma previa.

CLÁUSULA TERCERA — VIGENCIA Y PENALIZACIÓN CONVENCIONAL:
Vigencia ininterrumpida de cinco (5) años a partir de la firma digital. La parte infractora responderá ante el Enclave Arbitral Tecnológico de la Ciudad de México.

SLA ASIGNADO: 99.98% UPTIME // ENCLAVE mTLS
FECHA DE EMISIÓN: 12 de Octubre de 2026
SELLO SHA-256 PREVIO: 0x9f41b8a72e90c8a1b490f840139b8192`,
    status: 'pending_signature',
    created_at: new Date().toISOString(),
  },
];

const CAPABILITIES: EngineeringCapability[] = [
  {
    id: 'web_apps',
    title: 'Web Apps de Alta Concurrencia',
    subtitle: 'Frontend React/Next.js + Backend Rust/Go/Node',
    description:
      'Sistemas distribuidos de ultra-baja latencia, arquitecturas SPA/SSR seguras, integración mTLS y rendimiento FCP < 0.5s.',
    icon: 'web',
    technologies: ['Next.js', 'React 19', 'Rust', 'Tailwind', 'TypeScript', 'Vite'],
    sla: '99.98% UPTIME',
    badge: 'CORE INGENIERÍA',
  },
  {
    id: 'databases',
    title: 'Bases de Datos & Arquitectura RLS',
    subtitle: 'PostgreSQL, Supabase Enterprise & Partitioning',
    description:
      'Modelado relacional con políticas Row Level Security (RLS) granulares, sharding, encriptación a nivel de campo y preparación SOC-2/HIPAA.',
    icon: 'database',
    technologies: ['PostgreSQL', 'Supabase RLS', 'Redis', 'pgcrypto', 'GraphQL', 'Prisma'],
    sla: 'ZERO DATA LEAK',
    badge: 'ALTA SEGURIDAD',
  },
  {
    id: 'custom_scripts',
    title: 'Custom Scripts & Automatización',
    subtitle: 'Pipelines eBPF, Kali Bots & Integración API',
    description:
      'Automatización de procesos operativos B2B, bots transaccionales de alta disponibilidad, scripts de análisis forense y webhooks bancarios SPEI Banxico / Nu México.',
    icon: 'terminal',
    technologies: ['Python 3.12', 'Bash', 'Kali Linux', 'Docker', 'Webhooks', 'Cilium'],
    sla: 'SUB-SECOND EXEC',
    badge: 'AUTOMATIZACIÓN',
  },
  {
    id: 'security',
    title: 'Seguridad Ofensiva & Hardening',
    subtitle: 'Pentesting Red Team & Hardening Kubernetes',
    description:
      'Auditorías de penetración continuas con Kali Linux, hardening de clústeres K8s con Cilium, análisis de código estático (SAST) y gestión de HSM YubiKey.',
    icon: 'shield_lock',
    technologies: ['Kali Pentest', 'Cilium eBPF', 'SOC-2 Type II', 'YubiKey HSM', 'OWASP Top 10'],
    sla: 'ENCLAVE LEVEL 4',
    badge: 'DEFENSA ACTIVA',
  },
];

const INITIAL_CHAT: ClientChatMessage[] = [
  {
    id: 'c1',
    sender: 'admin',
    senderName: 'Jefe (CISO)',
    text: 'Bienvenido al canal seguro de MCRA Solutions. Su identidad corporativa ha sido verificada. ¿En qué capacidad de ingeniería podemos apoyarle hoy?',
    timestamp: 'Hoy, 10:14 AM',
    isEncrypted: true,
    cipherHash: '0x4f8a...921b',
  },
  {
    id: 'c2',
    sender: 'client',
    senderName: 'Cliente Corporativo',
    text: 'Hola Jefe. Deseamos implementar políticas RLS en PostgreSQL y auditar un endpoint crítico de pagos SPEI.',
    timestamp: 'Hoy, 10:20 AM',
    isEncrypted: true,
    cipherHash: '0x3b1c...a0d2',
  },
  {
    id: 'c3',
    sender: 'admin',
    senderName: 'Socio (CTO)',
    text: 'Enterado. Podemos estructurar el sprint adaptándonos a su fase presupuestal. Puede enviarnos los payloads o IPs privadas en este canal con cifrado AES-256.',
    timestamp: 'Hoy, 10:25 AM',
    isEncrypted: true,
    cipherHash: '0x88ea...1d29',
  },
];

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  clientEmail = 'cliente@enterprise.corp',
  clientCompany = 'FinTech Global B2B',
  onSignOut,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<ClientPortalTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/portal/client/finanzas' || hash === '#finanzas') return 'finanzas';
      if (path === '/portal/client/soporte' || hash === '#soporte') return 'soporte';
      if (path === '/portal/client/boveda' || hash === '#boveda') return 'boveda';
      if (path === '/portal/client/api-keys' || hash === '#api-keys') return 'api-keys';
      if (path.includes('roadmap') || hash === '#roadmap') return 'roadmap';
      if (path === '/portal/client/auditoria' || hash === '#auditoria') return 'auditoria';
      if (path === '/portal/client/facturas' || hash === '#facturas') return 'facturas';
    }
    return 'capacidades';
  });
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [contracts, setContracts] = useState<ClientContract[]>(() => {
    try {
      const saved = localStorage.getItem('mcra_client_contracts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CONTRACTS;
  });

  useEffect(() => {
    const handleDispatched = (event: any) => {
      const newContract: ClientContract = event.detail;
      if (newContract) {
        setContracts((prev) => [newContract, ...prev.filter((c) => c.id !== newContract.id)]);
        setIsContractsModalOpen(true);
        if (showToast) {
          showToast(`[NUEVO CONTRATO] MCRA Solutions le ha enviado un contrato para firma digital.`);
        }
      }
    };

    window.addEventListener('mcra_contract_dispatched', handleDispatched);
    return () => {
      window.removeEventListener('mcra_contract_dispatched', handleDispatched);
    };
  }, [showToast]);

  const handleContractSigned = (contractId: string, signatureData: string, signatureHash: string) => {
    setContracts((prev) => {
      const updated = prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'signed' as const,
              signature_data: signatureData,
              signature_hash: signatureHash,
              signed_at: new Date().toISOString(),
            }
          : c
      );
      try {
        localStorage.setItem('mcra_client_contracts', JSON.stringify(updated));
      } catch {
        // quota
      }
      return updated;
    });
  };

  const pendingContractsCount = contracts.filter((c) => c.status === 'pending_signature').length;
  const [chatMessages, setChatMessages] = useState<ClientChatMessage[]>(INITIAL_CHAT);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<EngineeringCapability | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsSending(true);
    const newMsg: ClientChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'client',
      senderName: 'Cliente Corporativo',
      text: inputMessage.trim(),
      timestamp: 'Ahora mismo',
      isEncrypted: true,
      cipherHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    if (showToast) {
      showToast('Mensaje cifrado con AES-256 transmitido al Enclave de Administración.');
    }

    // Simulate Admin instant acknowledged echo after a brief period
    setTimeout(() => {
      const ackMsg: ClientChatMessage = {
        id: 'ack_' + Date.now(),
        sender: 'admin',
        senderName: 'Enclave Bot (Jefe & Socio)',
        text: 'Acuse de recibo confirmado por HSM. Un arquitecto responderá a su requerimiento en breve.',
        timestamp: 'Ahora mismo',
        isEncrypted: true,
        cipherHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };
      setChatMessages((prev) => [...prev, ackMsg]);
      setIsSending(false);
    }, 1200);
  };

  return (
    <ClientLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      clientEmail={clientEmail}
      clientCompany={clientCompany}
      pendingContractsCount={pendingContractsCount}
      onSignOut={onSignOut}
      onOpenContractsModal={() => setIsContractsModalOpen(true)}
    >
      <div className="w-full flex flex-col gap-6">
        {/* ================================================================== */}
        {/* 1. BUDGET ADAPTATION BANNER (Trust-Building Glowing Hero)          */}
        {/* ================================================================== */}
        <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#141a32]/95 via-[#0d163a]/90 to-[#141a32]/95 border-2 border-[#00e5ff]/40 p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,229,255,0.2)] overflow-hidden backdrop-blur-xl">
          {/* Subtle Cybernetic Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#00fe66]/10 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase">
                  ALIANZA ESTRATÉGICA // ROI TECNOLÓGICO SEGURO
                </span>
                <span className="hidden sm:inline font-['JetBrains_Mono'] text-[11px] text-[#00daf3]">
                  • SIN BARRERAS DE ENTRADA
                </span>
              </div>

              <h2 className="font-['Space_Grotesk'] text-[20px] sm:text-[23px] font-bold text-[#dce1ff] leading-snug">
                "Alianza Estratégica: Analizamos la viabilidad y nos adaptamos a tu presupuesto para escalar tu tecnología de forma segura."
              </h2>

              <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
                En <strong>MCRA Solutions</strong> creemos que la ingeniería de primer nivel no debe comprometer la salud financiera de tu empresa. Evaluamos tus requerimientos en sprints modulares, optimizando arquitecturas para que obtengas la máxima seguridad con un costo altamente competitivo.
              </p>
            </div>

            <div className="flex sm:flex-col items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('chat');
                  setInputMessage('Hola equipo MCRA, me gustaría agendar una evaluación de viabilidad adaptada a nuestro presupuesto.');
                }}
                className="w-full px-5 py-3 rounded-xl bg-[#00fe66] hover:bg-[#5aff96] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,254,102,0.4)] flex items-center justify-center gap-2"
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[18px]">handshake</span>
                <span>Evaluar Proyecto a Medida</span>
              </button>

              <button
                onClick={() => setActiveTab('inbox')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181e36] hover:bg-[#222941] text-[#00e5ff] border border-[#00e5ff]/30 font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[16px]">lock</span>
                <span>Enviar Carga Útil Cifrada</span>
              </button>
            </div>
          </div>
        </div>

        {/* ALERTA LEGAL // CONTRATOS PENDIENTES DE FIRMA */}
        {pendingContractsCount > 0 && (
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#ff9900]/20 via-[#ff9900]/10 to-[#ff9900]/05 border-2 border-[#ffb020]/70 p-4 shadow-[0_0_30px_rgba(255,176,32,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#261708] border border-[#ffb020]/50 flex items-center justify-center text-[#ffb020] animate-pulse shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                  ¡Atención! Tiene {pendingContractsCount} Contrato(s) o Acuerdos NDA Pendientes de Firma
                </div>
                <div className="font-['JetBrains_Mono'] text-[11px] text-[#ffb020]">
                  MCRA Solutions ha emitido un documento legal que requiere su firma digital vectorial con hash SHA-256.
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsContractsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#ff9900] hover:bg-[#ffaa22] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,176,32,0.5)] flex items-center justify-center gap-1.5 shrink-0"
            >
              <FileCheck className="w-4 h-4" />
              <span>Revisar y Firmar Ahora</span>
            </button>
          </div>
        )}

        {/* View Mode Navigation Pills */}
        <div className="flex items-center gap-2 border-b border-[#222941] pb-3 font-['JetBrains_Mono'] text-[12px] overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-capacidades"
            onClick={() => setActiveTab('capacidades')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'capacidades'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">hub</span>
            <span>Capacidades ({CAPABILITIES.length})</span>
          </button>

          <button
            id="tab-btn-roadmap"
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'roadmap'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Roadmap & Entregables</span>
            <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
          </button>

          <button
            id="tab-btn-apikeys"
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'api-keys'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys & Telemetría</span>
          </button>

          <button
            id="tab-btn-finanzas"
            onClick={() => setActiveTab('finanzas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'finanzas'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <DollarSign className="w-4 h-4 text-[#00FF66]" />
            <span>Finanzas SPEI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
          </button>

          <button
            id="tab-btn-soporte"
            onClick={() => setActiveTab('soporte')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'soporte'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-[#00e5ff]" />
            <span>Soporte IT</span>
          </button>

          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">chat</span>
            <span>Canal Seguro Admins</span>
            <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
          </button>

          <button
            id="tab-btn-boveda"
            onClick={() => setActiveTab('boveda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'boveda'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-[#00FF66]" />
            <span>Bóveda Entregables</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
          </button>

          <button
            id="tab-btn-inbox"
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'inbox'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">enhanced_encryption</span>
            <span>Carga Cifrada Inbox</span>
          </button>

          <button
            id="tab-btn-auditoria"
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'auditoria'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Auditoría Zero-Trust</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
          </button>

          <button
            id="tab-btn-facturas"
            onClick={() => setActiveTab('facturas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'facturas'
                ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-[#bac9cc] hover:text-[#dce1ff] hover:bg-[#141a32]'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#00FF66]" />
            <span>Bóveda de Facturas</span>
          </button>

          {/* Modal Trigger for Contratos y NDA */}
          <button
            id="tab-btn-contratos-modal"
            onClick={() => setIsContractsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141d3b] hover:bg-[#1f2d5c] text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all shrink-0 font-bold ml-auto"
          >
            <FileText className="w-4 h-4" />
            <span>Contratos y NDA</span>
            {pendingContractsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#ff9900]/20 border border-[#ffb020]/50 text-[#ffb020] text-[10px] animate-pulse font-bold">
                {pendingContractsCount} Pendiente
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/20 border border-[#00fe66]/50 text-[#00fe66] text-[10px] font-bold">
                Firmado ✓
              </span>
            )}
          </button>
        </div>

        {/* ================================================================== */}
        {/* 2. SERVICES SHOWCASE: Capacidades de Ingeniería Grid               */}
        {/* ================================================================== */}
        {activeTab === 'capacidades' && (
          <div className="flex flex-col gap-6">
            {/* 4. LIVE SOFTWARE HEALTH WIDGET (Client Dashboard) */}
            <SystemHealthWidget />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dce1ff]">
                  Catálogo de Capacidades de Ingeniería
                </h3>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc]">
                  Tecnologías y servicios de alto calibre desarrollados y operados por MCRA Solutions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.id}
                  className="rounded-3xl bg-[#141a32]/85 border border-[#00e5ff]/25 hover:border-[#00e5ff] p-6 shadow-xl flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,229,255,0.2)] backdrop-blur-md group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#060d24] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] group-hover:scale-110 transition-transform">
                        <span translate="no" className="notranslate material-symbols-outlined text-[28px]">{cap.icon}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-['JetBrains_Mono'] text-[9px] px-2.5 py-1 rounded bg-[#00e5ff]/15 text-[#00e5ff] font-bold uppercase border border-[#00e5ff]/30">
                          {cap.badge}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] mt-1 font-semibold">
                          {cap.sla}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#dce1ff] group-hover:text-[#00e5ff] transition-colors">
                      {cap.title}
                    </h4>

                    <p className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] font-medium">
                      {cap.subtitle}
                    </p>

                    <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
                      {cap.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-3 border-t border-[#222941]">
                    <div className="flex flex-wrap gap-1.5">
                      {cap.technologies.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-[#060d24] border border-[#222941] text-[10px] font-['JetBrains_Mono'] text-[#bac9cc]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedCapability(cap)}
                        className="text-[#00e5ff] hover:text-[#c3f5ff] text-[12px] font-['JetBrains_Mono'] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-all"
                      >
                        <span>Explorar Especificaciones</span>
                        <span translate="no" className="notranslate material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          setInputMessage(`Hola Jefe / Socio, deseamos cotizar la capacidad: "${cap.title}".`);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#181e36] hover:bg-[#00e5ff] hover:text-[#00363d] text-[#dce1ff] border border-[#3b494c] font-['JetBrains_Mono'] text-[11px] font-bold transition-all"
                      >
                        Cotizar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 2.1 CYBER-AESTHETIC PROJECT ROADMAP (Interactive Gantt)            */}
        {/* ================================================================== */}
        {activeTab === 'roadmap' && (
          <LiveRoadmap clientCompany={clientCompany} showToast={showToast} />
        )}

        {/* ================================================================== */}
        {/* 2.2 API KEY & METRICS DASHBOARD (Developer Portal)                 */}
        {/* ================================================================== */}
        {activeTab === 'api-keys' && (
          <ApiKeyMetricsDashboard clientCompany={clientCompany} showToast={showToast} />
        )}

        {/* ================================================================== */}
        {/* 2.3 CLIENT BILLING HUB (Zero-Commission SPEI Nu México)            */}
        {/* ================================================================== */}
        {activeTab === 'finanzas' && (
          <ClientBillingHub
            clientCompany={clientCompany}
            clientEmail={clientEmail}
            showToast={showToast}
          />
        )}

        {/* ================================================================== */}
        {/* 2.4 IT SUPPORT TICKETING SYSTEM (Client Side)                     */}
        {/* ================================================================== */}
        {activeTab === 'soporte' && (
          <ClientSupportTickets
            clientCompany={clientCompany}
            clientEmail={clientEmail}
            showToast={showToast}
          />
        )}

        {/* ================================================================== */}
        {/* 2.5 ENCRYPTED FILE VAULT (Client Side Deliverables)                */}
        {/* ================================================================== */}
        {activeTab === 'boveda' && (
          <ClientFileVault showToast={showToast} />
        )}

        {/* ================================================================== */}
        {/* 2.6 SECURITY AUDIT LOGS (Zero-Trust Access Telemetry)              */}
        {/* ================================================================== */}
        {activeTab === 'auditoria' && (
          <SecurityAuditLogs clientCompany={clientCompany} showToast={showToast} />
        )}

        {/* ================================================================== */}
        {/* 2.7 INVOICE VAULT (CFDI 4.0 SAT B2B Billing History)               */}
        {/* ================================================================== */}
        {activeTab === 'facturas' && (
          <InvoiceVault clientCompany={clientCompany} showToast={showToast} />
        )}

        {/* ================================================================== */}
        {/* 3. COMMUNICATION HUB: Secure Chat Module + External Social Buttons */}
        {/* ================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-[#141a32]/90 border border-[#00e5ff]/30 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 backdrop-blur-xl">
              {/* Chat Enclave Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222941]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#060d24] border border-[#00fe66]/40 flex items-center justify-center text-[#00fe66]">
                    <span translate="no" className="notranslate material-symbols-outlined text-[22px]">forum</span>
                  </div>
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                      Canal Directo Enclave // Jefe (CISO) & Socio (CTO)
                    </h3>
                    <p className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
                      COMUNICACIÓN CIFRADA EN TRÁNSITO Y REPOSO • RESPUESTA PRIORITARIA
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] bg-[#060d24] px-3 py-1.5 rounded-lg border border-[#222941]">
                  <span translate="no" className="notranslate material-symbols-outlined text-[14px] text-[#00e5ff]">key</span>
                  <span>ECDSA HANDSHAKE OK</span>
                </div>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex flex-col gap-3 min-h-[320px] max-h-[460px] overflow-y-auto p-3 rounded-2xl bg-[#060d24] border border-[#222941]">
                {chatMessages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                        isAdmin ? 'self-start items-start' : 'self-end items-end'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span
                          className={`font-['JetBrains_Mono'] text-[10px] font-bold ${
                            isAdmin ? 'text-[#00fe66]' : 'text-[#00e5ff]'
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[9px] text-[#849396]">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl font-['Inter'] text-[13px] leading-relaxed border ${
                          isAdmin
                            ? 'bg-[#141a32] border-[#00fe66]/30 text-[#dce1ff]'
                            : 'bg-[#00e5ff]/15 border-[#00e5ff]/40 text-[#c3f5ff]'
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.cipherHash && (
                          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#849396]">
                            <span>AES-256 SEAL</span>
                            <span className="font-mono text-[#00daf3]">{msg.cipherHash}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  id="input-client-chat"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escriba su consulta técnica o requerimiento para el Jefe y Socio..."
                  className="flex-1 bg-[#060d24] border border-[#3b494c] focus:border-[#00e5ff] rounded-xl px-4 py-3 text-[13px] text-[#dce1ff] focus:outline-none font-['Inter']"
                />
                <button
                  id="btn-client-chat-send"
                  type="submit"
                  disabled={isSending || !inputMessage.trim()}
                  className="px-6 py-3 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-2 disabled:opacity-50"
                >
                  <span translate="no" className="notranslate material-symbols-outlined text-[18px]">send</span>
                  <span>Transmitir</span>
                </button>
              </form>
            </div>

            {/* ============================================================== */}
            {/* EXTERNAL SUPPORT CHANNELS (Premium Styled Glowing Buttons)     */}
            {/* Facebook, Instagram, TikTok                                    */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[18px]">share</span>
                <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                  Canales Oficiales & Redes de Soporte Externo
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Facebook */}
                <a
                  id="link-support-facebook"
                  href="https://facebook.com/mcrasolutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#141a32] border border-[#00e5ff]/30 hover:border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all flex items-center gap-3.5 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#060d24] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] group-hover:scale-110 transition-transform">
                    <svg translate="no" className="notranslate w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] group-hover:text-[#00e5ff] transition-colors">
                      Facebook B2B
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">
                      Consultas Comerciales
                    </span>
                  </div>
                </a>

                {/* 2. Instagram */}
                <a
                  id="link-support-instagram"
                  href="https://instagram.com/mcrasolutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#141a32] border border-[#e1306c]/40 hover:border-[#e1306c] shadow-[0_0_15px_rgba(225,48,108,0.15)] hover:shadow-[0_0_25px_rgba(225,48,108,0.4)] transition-all flex items-center gap-3.5 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#060d24] border border-[#e1306c]/50 flex items-center justify-center text-[#e1306c] group-hover:scale-110 transition-transform">
                    <svg translate="no" className="notranslate w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] group-hover:text-[#e1306c] transition-colors">
                      Instagram Direct
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">
                      Actualizaciones & Demos
                    </span>
                  </div>
                </a>

                {/* 3. TikTok */}
                <a
                  id="link-support-tiktok"
                  href="https://tiktok.com/@mcrasolutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#141a32] border border-[#00fe66]/40 hover:border-[#00fe66] shadow-[0_0_15px_rgba(0,254,102,0.15)] hover:shadow-[0_0_25px_rgba(0,254,102,0.4)] transition-all flex items-center gap-3.5 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#060d24] border border-[#00fe66]/50 flex items-center justify-center text-[#00fe66] group-hover:scale-110 transition-transform">
                    <svg translate="no" className="notranslate w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] group-hover:text-[#00fe66] transition-colors">
                      TikTok B2B Tech
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">
                      Casos de Éxito & Pentest
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Encrypted Messages Vault */}
        {activeTab === 'inbox' && (
          <div className="flex flex-col gap-4">
            <SecureClientInbox clientEmail={clientEmail} onToast={showToast} />
          </div>
        )}
      </div>

      {/* Capability Specification Detail Modal */}
      {selectedCapability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060d24]/90 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#141a32] border border-[#00e5ff]/40 p-6 sm:p-7 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#060d24] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                  <span translate="no" className="notranslate material-symbols-outlined text-[28px]">
                    {selectedCapability.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#dce1ff]">
                    {selectedCapability.title}
                  </h3>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3]">
                    {selectedCapability.subtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCapability(null)}
                className="text-[#bac9cc] hover:text-[#dce1ff] p-1"
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
              {selectedCapability.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#060d24] border border-[#222941] flex flex-col gap-2 font-['JetBrains_Mono'] text-[11px]">
              <div className="flex justify-between text-[#849396]">
                <span>SLA GARANTIZADO:</span>
                <span className="text-[#00fe66] font-bold">{selectedCapability.sla}</span>
              </div>
              <div className="flex justify-between text-[#849396]">
                <span>CATEGORÍA:</span>
                <span className="text-[#00e5ff] font-semibold">{selectedCapability.badge}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCapability(null)}
                className="px-4 py-2.5 rounded-xl bg-[#181e36] text-[#bac9cc] font-['JetBrains_Mono'] text-[12px]"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const cap = selectedCapability;
                  setSelectedCapability(null);
                  setActiveTab('chat');
                  setInputMessage(`Deseamos iniciar análisis de viabilidad para: "${cap.title}".`);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00e5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              >
                Iniciar Propuesta en Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTRATOS Y ACUERDOS NDA (FIRMA DIGITAL VECTORIAL) */}
      <ClientContractsModal
        isOpen={isContractsModalOpen}
        onClose={() => setIsContractsModalOpen(false)}
        contracts={contracts}
        onContractSigned={handleContractSigned}
        showToast={showToast}
        clientCompany={clientCompany}
        clientEmail={clientEmail}
      />
    </ClientLayout>
  );
};

export default ClientPortalView;
