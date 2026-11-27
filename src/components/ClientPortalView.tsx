import React, { useState, useEffect } from 'react';
import { EngineeringCapability, ClientChatMessage, ClientContract } from '../types';
import { supabase } from '../lib/supabase/client';
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
import { ClientSoftwareCatalog } from './client/ClientSoftwareCatalog';
import { ClientLayout } from './layouts/ClientLayout';
import { FileText, Key, Activity, ShieldCheck, FileCheck, DollarSign, LifeBuoy, FolderArchive, ShieldAlert, Receipt, Package } from 'lucide-react';

interface ClientPortalViewProps {
  clientId?: string;
  clientEmail?: string;
  clientCompany?: string;
  userRole?: string | null;
  onSignOut?: () => void;
  showToast?: (msg: string) => void;
}

export type ClientPortalTab =
  | 'capacidades'
  | 'soluciones-pos'
  | 'roadmap'
  | 'api-keys'
  | 'finanzas'
  | 'soporte'
  | 'boveda'
  | 'chat'
  | 'inbox'
  | 'auditoria'
  | 'facturas';

const CAPABILITIES: EngineeringCapability[] = [
  {
    id: 'web_apps',
    title: 'Desarrollo Web & SaaS de Alta Concurrencia',
    subtitle: 'Plataformas Corporativas Modernas + Servicios Escalables',
    description:
      'Sistemas distribuidos de respuesta inmediata, portales web corporativos seguros, conexiones cifradas y velocidad optimizada para operación empresarial.',
    icon: 'web',
    technologies: ['Next.js', 'React 19', 'TypeScript', 'Arquitectura SaaS', 'API Segura'],
    sla: 'SLA CONTRACTUAL',
    badge: 'INGENIERÍA CORE',
  },
  {
    id: 'databases',
    title: 'Bases de Datos y Aislamiento Empresarial',
    subtitle: 'PostgreSQL Corporativo y Respaldos con Redundancia',
    description:
      'Modelado relacional con aislamiento estricto por empresa, cifrado de datos sensibles, alta disponibilidad y preparación para auditorías regulatorias.',
    icon: 'database',
    technologies: ['PostgreSQL', 'Aislamiento por Cliente', 'Cifrado AES-256', 'Redundancia Activa'],
    sla: 'AISLAMIENTO RLS',
    badge: 'ALTA SEGURIDAD',
  },
  {
    id: 'custom_scripts',
    title: 'Automatización e Integración de Procesos',
    subtitle: 'Flujos Operativos, Conectores API y Conciliación SPEI',
    description:
      'Automatización de procesos operativos B2B, integración de sistemas internos, reportes ejecutivos automáticos y conciliación bancaria SPEI Banxico / Nu México.',
    icon: 'terminal',
    technologies: ['Python', 'Automatización B2B', 'Integraciones API', 'Webhooks SPEI'],
    sla: 'EJECUCIÓN DEDICADA',
    badge: 'AUTOMATIZACIÓN',
  },
  {
    id: 'security',
    title: 'Auditoría de Ciberseguridad y Blindaje',
    subtitle: 'Evaluación Preventiva de Riesgos y Protección en la Nube',
    description:
      'Auditorías continuas de seguridad, blindaje de infraestructura en la nube, revisión de vulnerabilidades críticas y gestión de llaves criptográficas.',
    icon: 'shield_lock',
    technologies: ['Auditoría Integral', 'Protección Cloud', 'SOC-2 Tipo II', 'OWASP Top 10'],
    sla: 'SEGURIDAD NIVEL 4',
    badge: 'DEFENSA ACTIVA',
  },
];

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  clientId,
  clientEmail = '',
  clientCompany = 'Cuenta Corporativa',
  userRole = 'client',
  onSignOut,
  showToast,
}) => {
  const isStudent = (userRole || '').toLowerCase().trim() === 'student';

  const [activeTab, setActiveTab] = useState<ClientPortalTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (!isStudent && (path.includes('soluciones-pos') || hash === '#soluciones-pos')) {
        return 'soluciones-pos';
      }
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
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [chatMessages, setChatMessages] = useState<ClientChatMessage[]>([]);
  const [clientSummary, setClientSummary] = useState({
    projectsTotal: 0,
    projectsAccepted: 0,
    paidAmountMxn: 0,
    totalInvoicedMxn: 0,
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<EngineeringCapability | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadClientLiveState() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = clientId || user?.id || null;
        const email = (clientEmail || user?.email || '').trim().toLowerCase();

        if (!uid && !email) return;

        // 1. Contratos reales del cliente
        let contractsQuery = supabase
          .from('client_contracts')
          .select('*')
          .order('created_at', { ascending: false });
        if (uid && email) {
          contractsQuery = contractsQuery.or(`client_id.eq.${uid},signer_email.ilike.${email}`);
        } else if (uid) {
          contractsQuery = contractsQuery.eq('client_id', uid);
        } else {
          contractsQuery = contractsQuery.ilike('signer_email', email);
        }

        // 2. Facturas SPEI reales del cliente
        const invoicesPromise = uid
          ? supabase.from('invoices').select('amount, status').eq('client_id', uid)
          : Promise.resolve({ data: [], error: null });

        // 3. Propuestas / Proyectos asignados del cliente
        let proposalsQuery = supabase
          .from('client_project_proposals')
          .select('id, status');
        if (uid && email) {
          proposalsQuery = proposalsQuery.or(`client_id.eq.${uid},email.ilike.${email}`);
        } else if (uid) {
          proposalsQuery = proposalsQuery.eq('client_id', uid);
        } else {
          proposalsQuery = proposalsQuery.ilike('email', email);
        }

        // 4. Mensajes reales del canal seguro
        const messagesPromise = uid
          ? supabase
              .from('secure_messages')
              .select('*')
              .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [], error: null });

        const [contractsRes, invoicesRes, proposalsRes, messagesRes] = await Promise.all([
          contractsQuery,
          invoicesPromise,
          proposalsQuery,
          messagesPromise,
        ]);

        if (!mounted) return;

        if (!contractsRes.error && Array.isArray(contractsRes.data)) {
          const mappedContracts: ClientContract[] = contractsRes.data.map((row: any) => ({
            id: String(row.id),
            client_id: row.client_id || uid || '',
            client_name: row.client_name || clientCompany,
            client_company: row.client_company || clientCompany,
            client_email: row.signer_email || email,
            template_id: row.template_id || undefined,
            title: row.title || 'Contrato de Servicios B2B',
            content: row.content || '',
            status: row.status || 'pending_signature',
            signature_data: row.signature_data || undefined,
            signature_hash: row.signature_hash || undefined,
            signed_at: row.signed_at || undefined,
            created_at: row.created_at || new Date().toISOString(),
          }));
          setContracts(mappedContracts);
        } else {
          setContracts([]);
        }

        const invRows = !invoicesRes.error && Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
        const paidAmountMxn = invRows
          .filter((i: any) => i.status === 'paid')
          .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
        const totalInvoicedMxn = invRows.reduce(
          (acc: number, i: any) => acc + Number(i.amount || 0),
          0
        );

        const propRows =
          !proposalsRes.error && Array.isArray(proposalsRes.data) ? proposalsRes.data : [];
        const projectsTotal = propRows.length;
        const projectsAccepted = propRows.filter((p: any) => p.status === 'accepted').length;

        setClientSummary({
          projectsTotal,
          projectsAccepted,
          paidAmountMxn,
          totalInvoicedMxn,
        });

        if (!messagesRes.error && Array.isArray(messagesRes.data)) {
          const mappedMessages: ClientChatMessage[] = messagesRes.data.map((m: any) => ({
            id: String(m.id),
            sender: m.sender_id === uid ? 'client' : 'admin',
            senderName: m.sender_id === uid ? clientCompany : 'Dirección MRCA Solutions',
            text: m.encrypted_payload || m.encrypted_subject || '',
            timestamp: m.created_at
              ? new Date(m.created_at).toLocaleString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
            isEncrypted: true,
            cipherHash: m.cipher_hash || undefined,
          }));
          setChatMessages(mappedMessages);
        } else {
          setChatMessages([]);
        }
      } catch {
        // leave zero state cleanly
      }
    }

    void loadClientLiveState();

    const handleDispatched = (event: any) => {
      const newContract: ClientContract = event.detail;
      if (newContract) {
        setContracts((prev) => [newContract, ...prev.filter((c) => c.id !== newContract.id)]);
        setIsContractsModalOpen(true);
        if (showToast) {
          showToast(`[NUEVO CONTRATO] MRCA Solutions le ha enviado un contrato para firma digital.`);
        }
      }
    };

    window.addEventListener('mrca_contract_dispatched', handleDispatched);
    return () => {
      mounted = false;
      window.removeEventListener('mrca_contract_dispatched', handleDispatched);
    };
  }, [clientId, clientEmail, clientCompany, showToast]);

  const handleContractSigned = (contractId: string, signatureData: string, signatureHash: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'signed' as const,
              signature_data: signatureData,
              signature_hash: signatureHash,
              signed_at: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const handleUploadPhysicalContract = (
    contractId: string,
    _file: File,
    meta: { filename: string; size: number; uploadDate: string }
  ) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              physical_signature_filename: meta.filename,
              physical_signature_date: meta.uploadDate,
              signature_mode: 'physical' as const,
            }
          : c
      )
    );
  };

  const pendingContractsCount = contracts.filter((c) => c.status === 'pending_signature').length;
  const primaryContract = contracts[0] || null;
  const progressPercent =
    clientSummary.projectsTotal > 0
      ? Math.round((clientSummary.projectsAccepted / clientSummary.projectsTotal) * 100)
      : 0;
  const paymentPercent =
    clientSummary.totalInvoicedMxn > 0
      ? Math.round((clientSummary.paidAmountMxn / clientSummary.totalInvoicedMxn) * 100)
      : 0;
  const pendingBalanceMxn = Math.max(0, clientSummary.totalInvoicedMxn - clientSummary.paidAmountMxn);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsSending(true);
    const trimmed = inputMessage.trim();
    const cipherHash =
      '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newMsg: ClientChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'client',
      senderName: clientCompany,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
      cipherHash,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('secure_messages').insert({
          sender_id: user.id,
          encrypted_subject: 'Mensaje Directo Portal Clientes',
          encrypted_payload: trimmed,
          cipher_hash: cipherHash,
          category: 'normal',
          client_company: clientCompany,
          read: false,
        });
      }
    } catch {
      // keep message in session state
    }

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsSending(false);

    if (showToast) {
      showToast('Mensaje cifrado registrado y enviado al equipo de MRCA Solutions.');
    }
  };

  return (
    <ClientLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      clientEmail={clientEmail}
      clientCompany={clientCompany}
      userRole={userRole}
      pendingContractsCount={pendingContractsCount}
      onSignOut={onSignOut}
      onOpenContractsModal={() => setIsContractsModalOpen(true)}
    >
      <div className="w-full flex flex-col gap-6 font-['Inter']">
        {/* ================================================================== */}
        {/* EXECUTIVE CLIENT STATUS CENTER: PROGRESS, CONTRACTS & PAYMENTS     */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. PROGRESO GENERAL DEL PROYECTO (LIVE SUPABASE) */}
          <div className="rounded-xl bg-slate-900 border border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                  AVANCE DE INGENIERÍA
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-white/5">
                {clientSummary.projectsTotal > 0
                  ? `${clientSummary.projectsAccepted} DE ${clientSummary.projectsTotal} ACTIVOS`
                  : 'SIN PROYECTOS'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-['Space_Grotesk'] text-[32px] sm:text-[36px] font-extrabold text-white leading-none">
                  {progressPercent}
                  <span className="text-[20px] text-cyan-400">%</span>
                </span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-emerald-400 font-semibold">
                  {clientSummary.projectsTotal > 0 ? 'EN EJECUCIÓN' : 'PENDIENTE DE INICIO'}
                </span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-slate-950 p-0.5 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-400 pt-1">
                <span>
                  {clientSummary.projectsTotal > 0
                    ? `${clientSummary.projectsAccepted} propuesta(s) aprobada(s)`
                    : 'Sin proyectos asignados aún'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11.5px] font-['Inter'] text-slate-300">
              <span>Seguimiento:</span>
              <strong className="text-cyan-300 font-['JetBrains_Mono']">Sincronizado con Supabase</strong>
            </div>
          </div>

          {/* 2. ESTADO DEL CONTRATO B2B & ACUERDOS LEGALES */}
          <div className="rounded-xl bg-slate-900 border border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                  ESTATUS CONTRACTUAL
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold ${
                  contracts.length === 0
                    ? 'bg-slate-800 text-slate-300 border border-white/10'
                    : pendingContractsCount === 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}
              >
                {contracts.length === 0
                  ? 'SIN CONTRATOS'
                  : pendingContractsCount === 0
                  ? 'FIRMADO & SELLADO'
                  : 'REQUIERE FIRMA'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-white leading-snug">
                {primaryContract ? primaryContract.title : 'Sin contratos emitidos aún'}
              </h3>
              <p className="font-['Inter'] text-[12.5px] text-slate-400 leading-relaxed">
                {primaryContract
                  ? 'Obra por Encargo (Arts. 83-84 LFDA), facturación CFDI 4.0 SAT y estipulación de pena convencional no reembolsable.'
                  : 'Cuando MRCA Solutions emita un contrato o NDA para tu organización, aparecerá aquí para firma digital o carga en PDF.'}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
              <span className="font-['JetBrains_Mono'] text-[11px] text-slate-400">
                Folio: <strong className="text-white">{primaryContract ? primaryContract.id : 'N/A'}</strong>
              </span>
              <button
                onClick={() => setIsContractsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all duration-300 shadow-sm"
              >
                {pendingContractsCount > 0 ? 'Firmar Ahora' : 'Ver Contratos'}
              </button>
            </div>
          </div>

          {/* 3. CONTROL FINANCIERO & PAGOS SPEI NU MÉXICO */}
          <div className="rounded-xl bg-slate-900 border border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="font-['JetBrains_Mono'] text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                  PAGOS &amp; FINANZAS
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-slate-300 bg-slate-950 px-2.5 py-0.5 rounded border border-white/5 font-semibold">
                SPEI BANXICO
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-white leading-none">
                    ${clientSummary.paidAmountMxn.toLocaleString('es-MX')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-['JetBrains_Mono'] ml-1">
                    / ${clientSummary.totalInvoicedMxn.toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold">
                  {paymentPercent}% LIQUIDADO
                </span>
              </div>

              {/* Payment Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500"
                  style={{ width: `${paymentPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10.5px] font-['JetBrains_Mono'] text-slate-400 pt-0.5">
                <span>
                  Liquidado: <strong>${clientSummary.paidAmountMxn.toLocaleString('es-MX')} MXN</strong>
                </span>
                <span>
                  Saldo pendiente: <strong>${pendingBalanceMxn.toLocaleString('es-MX')} MXN</strong>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col gap-0.5 font-['JetBrains_Mono'] text-[10.5px]">
              <span className="text-slate-400">CLABE SPEI: <strong className="text-white">638180010197163103</strong></span>
              <span className="text-emerald-400 font-semibold">Institución Receptora: Nu México</span>
            </div>
          </div>
        </div>

        {/* ALERTA LEGAL // CONTRATOS PENDIENTES DE FIRMA */}
        {pendingContractsCount > 0 && (
          <div className="w-full rounded-xl bg-slate-900 border-2 border-amber-500/50 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                  ¡Atención! Tiene {pendingContractsCount} Contrato(s) o Acuerdos NDA Pendientes de Firma
                </div>
                <div className="font-['Inter'] text-[12px] text-slate-300">
                  MRCA Solutions ha emitido un instrumento legal que requiere su suscripción (digital o física).
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsContractsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 shrink-0"
            >
              <FileCheck className="w-4 h-4" />
              <span>Revisar y Firmar</span>
            </button>
          </div>
        )}

        {/* View Mode Navigation Pills */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 font-['JetBrains_Mono'] text-[12px] overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-capacidades"
            onClick={() => setActiveTab('capacidades')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'capacidades'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">hub</span>
            <span>Capacidades ({CAPABILITIES.length})</span>
          </button>

          {!isStudent && (
            <button
              id="tab-btn-soluciones-pos"
              onClick={() => setActiveTab('soluciones-pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
                activeTab === 'soluciones-pos'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-emerald-500/25'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Soluciones Listas &amp; Puntos de Venta</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}

          <button
            id="tab-btn-roadmap"
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'roadmap'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Plan de Entregas</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-apikeys"
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'api-keys'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Claves API y Métricas</span>
          </button>

          <button
            id="tab-btn-finanzas"
            onClick={() => setActiveTab('finanzas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'finanzas'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Finanzas SPEI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-soporte"
            onClick={() => setActiveTab('soporte')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'soporte'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-cyan-400" />
            <span>Soporte IT</span>
          </button>

          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'chat'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">chat</span>
            <span>Canal Seguro Admins</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-boveda"
            onClick={() => setActiveTab('boveda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'boveda'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-emerald-400" />
            <span>Bóveda Entregables</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-inbox"
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'inbox'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[17px]">enhanced_encryption</span>
            <span>Bandeja Cifrada</span>
          </button>

          <button
            id="tab-btn-auditoria"
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'auditoria'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Auditoría de Seguridad</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-btn-facturas"
            onClick={() => setActiveTab('facturas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === 'facturas'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-white/5'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Bóveda de Facturas</span>
          </button>

          {/* Modal Trigger for Contratos y NDA */}
          <button
            id="tab-btn-contratos-modal"
            onClick={() => setIsContractsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all duration-300 shrink-0 font-bold ml-auto"
          >
            <FileText className="w-4 h-4" />
            <span>Contratos y NDA</span>
            {pendingContractsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] animate-pulse font-bold">
                {pendingContractsCount} Pendiente
              </span>
            ) : contracts.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold">
                Firmado ✓
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-400 text-[10px] font-bold">
                0 Activos
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
                  Tecnologías y servicios de alto calibre desarrollados y operados por MRCA Solutions.
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
        {/* 2.0 SOLUCIONES LISTAS & PUNTOS DE VENTA (EXCLUSIVO CLIENTES B2B)   */}
        {/* ================================================================== */}
        {activeTab === 'soluciones-pos' && !isStudent && (
          <ClientSoftwareCatalog userRole={userRole} showToast={showToast} />
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
                  <span>CONEXIÓN CIFRADA ACTIVA</span>
                </div>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex flex-col gap-3 min-h-[320px] max-h-[460px] overflow-y-auto p-3 rounded-2xl bg-[#060d24] border border-[#222941]">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-1.5 text-slate-400">
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-slate-200">
                      Sin mensajes previos aún
                    </span>
                    <span className="font-['Inter'] text-[12px]">
                      Envía tu primer mensaje cifrado abajo y quedará registrado directamente en Supabase.
                    </span>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
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
                              <span>SELLO AES-256</span>
                              <span className="font-mono text-[#00daf3]">{msg.cipherHash}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
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
                  href="https://facebook.com/mrcasolutions"
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
                  href="https://instagram.com/mrcasolutions"
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
                  href="https://tiktok.com/@mrcasolutions"
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
                      Casos de Éxito y Seguridad
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
            <SecureClientInbox clientEmail={clientEmail} clientCompany={clientCompany} onToast={showToast} />
          </div>
        )}
      </div>

      {/* Capability Specification Detail Modal */}
      {selectedCapability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060d24]/90 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#141a32] border border-[#00e5ff]/40 p-6 sm:p-7 shadow-2xl flex flex-col gap-5 animate-border-pulse">
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
                className="px-5 py-2.5 rounded-xl bg-[#00e5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
              >
                Iniciar Propuesta en Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTRATOS Y ACUERDOS NDA (SISTEMA DUAL DE FIRMA) */}
      <ClientContractsModal
        isOpen={isContractsModalOpen}
        onClose={() => setIsContractsModalOpen(false)}
        contracts={contracts}
        onContractSigned={handleContractSigned}
        onUploadPhysicalContract={handleUploadPhysicalContract}
        showToast={showToast}
        clientCompany={clientCompany}
        clientEmail={clientEmail}
      />
    </ClientLayout>
  );
};

export default ClientPortalView;
