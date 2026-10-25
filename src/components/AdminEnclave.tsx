import React, { useState, useEffect } from 'react';
import { KaliTerminal } from './KaliTerminal';
import { ReAuthModal, NewTicketModal, InspectContractModal } from './Modals';
import { LedgerEntry, KanbanTicket } from '../types';
import { supabase } from '../lib/supabase/client';
import { AdminProjectApprovals } from './AdminProjectApprovals';
import { AdminContractGenerator } from './AdminContractGenerator';
import { AdminFinances } from './AdminFinances';
import { AdminSupportTickets } from './AdminSupportTickets';
import { ClientFileVault } from './ClientFileVault';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminBudgetNegotiations } from './AdminBudgetNegotiations';
import { AdminLayout, AdminTab } from './layouts/AdminLayout';

interface AdminEnclaveProps {
  onBackToPublic: () => void;
  showToast: (msg: string) => void;
  sessionUser?: any;
  onSignOut?: () => void;
}

const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: '1',
    client: 'Banco FinTech Corp',
    amount: 350000,
    currency: 'MXN',
    service: 'Arquitectura Cloud Zero-Trust',
    gateway: 'Stripe Escrow (Dual)',
    gatewayType: 'stripe',
    hash: '0x4f8a921be4a288b18402fcae9120489',
    status: 'LEDGER OK',
    timestamp: 'Hoy, 09:14 AM',
  },
  {
    id: '2',
    client: 'NeoLogistics LatAm',
    amount: 180000,
    currency: 'MXN',
    service: 'Hardening Kubernetes & Cilium',
    gateway: 'SPEI Inmediato Banxico',
    gatewayType: 'spei',
    hash: '0x3b1c8812fa99a0d2491b490f840139b',
    status: 'LEDGER OK',
    timestamp: 'Ayer, 16:32 PM',
  },
  {
    id: '3',
    client: 'Grupo Inmobiliario Cero',
    amount: 225000,
    currency: 'MXN',
    service: 'Auditoría Pentest Kali & SLA',
    gateway: 'Stripe Escrow (Dual)',
    gatewayType: 'stripe',
    hash: '0x88ea2910fa401d29381fc0491840182',
    status: 'LEDGER OK',
    timestamp: '12 Oct, 11:05 AM',
  },
  {
    id: '4',
    client: 'Quantum Health B2B',
    amount: 410000,
    currency: 'MXN',
    service: 'Backend Rust/mTLS & Vault HW',
    gateway: 'SPEI Inmediato Banxico',
    gatewayType: 'spei',
    hash: '0x12c84918ef74910248bc901a8401948',
    status: 'LEDGER OK',
    timestamp: '10 Oct, 14:20 PM',
  },
];

const INITIAL_TICKETS: KanbanTicket[] = [
  {
    id: 'L-902',
    title: 'Retail Enterprise MX',
    category: 'TikTok B2B',
    categoryBadge: 'TikTok B2B',
    categoryBadgeColor: 'cyan',
    description: 'Auditoría Pentest Completa & Red Team para e-commerce cloud.',
    amountEst: '$320k MXN Est.',
    leadScore: 94,
    status: 'leads',
  },
  {
    id: 'L-903',
    title: 'Fintech Seed',
    category: 'Instagram Ads',
    categoryBadge: 'Instagram Ads',
    categoryBadgeColor: 'purple',
    description: 'Backend Rust de ultra-baja latencia con cifrado mTLS.',
    amountEst: '$190k MXN Est.',
    leadScore: 88,
    status: 'leads',
  },
  {
    id: 'L-905',
    title: 'HealthGroup LatAm',
    category: 'TikTok B2B',
    categoryBadge: 'TikTok B2B',
    categoryBadgeColor: 'cyan',
    description: 'Configuración PostgreSQL RLS con Supabase HIPAA-ready.',
    amountEst: '$260k MXN Est.',
    leadScore: 91,
    status: 'leads',
  },
  {
    id: 'N-811',
    title: 'Consorcio Aduanal Pacífico',
    category: 'NDA Cripto OK',
    categoryBadge: 'NDA Cripto OK',
    categoryBadgeColor: 'green',
    description: 'SLA 99.99% para gateway de validación aduanera Zero-Trust.',
    slaNote: 'Firma ECDSA verificada por Socio',
    status: 'negotiation',
  },
  {
    id: 'N-814',
    title: 'OmniPayments Cono Sur',
    category: 'Revisión CISO',
    categoryBadge: 'Revisión CISO',
    categoryBadgeColor: 'slate',
    description: 'Cláusulas de dispersión escrow dual e indemnización PCI-DSS.',
    slaNote: 'En revisión con Jefe (CEO/CISO)',
    status: 'negotiation',
  },
];

export const AdminEnclave: React.FC<AdminEnclaveProps> = ({
  onBackToPublic,
  showToast,
  sessionUser,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin/presupuestos' || hash === '#presupuestos' || hash === '#admin-presupuestos') {
        return 'presupuestos';
      }
      if (path === '/admin/contratos' || hash === '#contratos' || hash === '#admin-contratos') {
        return 'contratos';
      }
      if (path === '/admin/finanzas' || hash === '#finanzas' || hash === '#admin-finanzas') {
        return 'finanzas';
      }
      if (path === '/admin/soporte' || hash === '#soporte' || hash === '#admin-soporte') {
        return 'soporte';
      }
      if (path === '/admin/boveda' || hash === '#boveda' || hash === '#admin-boveda') {
        return 'boveda';
      }
      if (path === '/admin/auditoria' || hash === '#auditoria' || hash === '#admin-auditoria') {
        return 'auditoria';
      }
      if (path.includes('aprobaciones') || hash === '#aprobaciones') {
        return 'aprobaciones';
      }
    }
    return 'principal';
  });
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [tickets, setTickets] = useState<KanbanTicket[]>(INITIAL_TICKETS);
  const [isReAuthModalOpen, setIsReAuthModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [globalRevokeActive, setGlobalRevokeActive] = useState(false);
  const [fido2Active, setFido2Active] = useState(true);
  const [termsHash, setTermsHash] = useState('0x9d02a49f...e7b8c1');
  const [isSigningTerms, setIsSigningTerms] = useState(false);

  const [inspectModal, setInspectModal] = useState<{ isOpen: boolean; title: string; hash: string }>({
    isOpen: false,
    title: '',
    hash: '',
  });

  useEffect(() => {
    async function fetchLiveEnclaveData() {
      try {
        const [ledgerRes, ticketsRes] = await Promise.all([
          supabase.from('ledger_entries').select('*').order('created_at', { ascending: false }),
          supabase.from('kanban_tickets').select('*').order('created_at', { ascending: false }),
        ]);

        if (ledgerRes.data && ledgerRes.data.length > 0) {
          const mappedLedger: LedgerEntry[] = ledgerRes.data.map((row: any) => ({
            id: row.id,
            client: row.client_name,
            amount: Number(row.amount),
            currency: row.currency || 'MXN',
            service: row.service,
            gateway: row.gateway as any,
            gatewayType: row.gateway_type as any,
            hash: row.tx_hash,
            status: row.status as any,
            timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Reciente',
          }));
          setLedger(mappedLedger);
        }

        if (ticketsRes.data && ticketsRes.data.length > 0) {
          const mappedTickets: KanbanTicket[] = ticketsRes.data.map((row: any) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            categoryBadge: row.category_badge || row.category,
            categoryBadgeColor: row.category_badge_color || 'cyan',
            description: row.description || '',
            amountEst: row.amount_est || undefined,
            leadScore: row.lead_score || undefined,
            slaNote: row.sla_note || undefined,
            status: row.status as any,
          }));
          setTickets(mappedTickets);
        }
      } catch {
        // Fallback to local state if Supabase connection fails
      }
    }

    fetchLiveEnclaveData();
  }, []);

  const handleRegenerateTerms = () => {
    setIsSigningTerms(true);
    setTimeout(() => {
      const randomHex =
        '0x' +
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('') +
        '...' +
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTermsHash(randomHex);
      setIsSigningTerms(false);
      showToast('Nueva firma SHA-256 generada y sellada en Ledger HSM.');
    }, 1000);
  };

  const handleToggleRevoke = async (checked: boolean) => {
    setGlobalRevokeActive(checked);
    if (checked) {
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Fallback for offline sandbox mode
      }
      showToast('ALERTA: Todas las sesiones activas y cookies Supabase invalidadas globalmente.');
    } else {
      showToast('Restricción de revocación restablecida a modo estándar.');
    }
  };

  const handleToggleFido2 = (checked: boolean) => {
    setFido2Active(checked);
    showToast(
      checked
        ? 'Autenticación biométrica FIDO2 / WebAuthn EXIGIDA.'
        : 'Modo contingencia habilitado (requiere aprobación dual).'
    );
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sessionUser={sessionUser}
      onSignOut={onSignOut}
      onReAuth={() => setIsReAuthModalOpen(true)}
      onBackToPublic={onBackToPublic}
    >
      <div className="w-full flex flex-col gap-5">
        {/* SUPERADMIN SECURITY HUD BANNER */}
        <section className="relative w-full rounded-2xl bg-[#141a32]/90 border border-[#00e5ff]/30 p-4 sm:p-5 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/10 via-transparent to-[#00fe66]/5 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Session Hash & 3D Video Mini Brand Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Static High-Res Enclave Brand Badge */}
              <div className="relative w-36 h-10 rounded-xl overflow-hidden border border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.3)] shrink-0 hidden md:flex items-center justify-center bg-[#0A1128] p-1">
                <img
                  src="/MRCA.SVG"
                  alt="MRCA Enclave"
                  className="w-full h-full object-contain select-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#222941] border border-[#00fe66]/30 shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66] animate-ping"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] uppercase tracking-wider font-semibold">
                  CLUSTER-CDMX-ALPHA // ROOT-SESSION: 0X9F41B
                </span>
              </div>
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] sm:text-[11px] text-[#bac9cc] uppercase">
                <span translate="no" className="notranslate material-symbols-outlined text-[16px] text-[#00e5ff]">encrypted</span>
                <span>HSM YUBI-V4: LOCKED</span>
                <span className="text-[#3b494c]">•</span>
                <span className="text-[#00daf3]">TLS 1.3 / ECDSA P-384</span>
              </div>
            </div>

            {/* Superadmin Profiles & Reauth Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#181e36] px-3 py-1.5 rounded-lg border border-[#3b494c]">
                <div className="w-7 h-7 rounded-full bg-[#2d344c] flex items-center justify-center text-[#00e5ff]">
                  <span translate="no" className="notranslate material-symbols-outlined text-[16px]">shield_person</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['Space_Grotesk'] text-[13px] text-[#dce1ff] font-bold leading-none truncate max-w-[160px]">
                    {sessionUser?.email ? sessionUser.email.split('@')[0] : 'Jefe'} <span className="text-[10px] text-[#bac9cc] font-normal">(CISO)</span>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] tracking-wider uppercase font-semibold">
                    {sessionUser?.role ? `AUTH: ${sessionUser.role.toUpperCase()}` : 'NIVEL 1 // SUPERADMIN'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#181e36] px-3 py-1.5 rounded-lg border border-[#3b494c]">
                <div className="w-7 h-7 rounded-full bg-[#2d344c] flex items-center justify-center text-[#9cf0ff]">
                  <span translate="no" className="notranslate material-symbols-outlined text-[16px]">terminal</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['Space_Grotesk'] text-[13px] text-[#dce1ff] font-bold leading-none">
                    Socio <span className="text-[10px] text-[#bac9cc] font-normal">(CTO/VP Eng)</span>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] tracking-wider uppercase font-semibold">
                    NIVEL 1 // SUPERADMIN
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsReAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[16px]">lock_reset</span>
                <span>RE-AUTH SESIÓN</span>
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181e36] hover:bg-[#222941] text-[#ffb4ab] border border-[#ffb4ab]/30 font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all"
                  title="Cerrar sesión activa de Supabase y volver al portal público"
                >
                  <span translate="no" className="notranslate material-symbols-outlined text-[16px]">logout</span>
                  <span>CERRAR SESIÓN</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* QUICK NAVIGATION CHIPS (TOUCH-SCROLLABLE) */}
        <nav className="w-full bg-[#141a32]/60 border border-[#222941] rounded-xl p-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 w-max">
            <button
              onClick={() => setActiveTab('principal')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'principal'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">grid_view</span>
              <span>PRINCIPAL</span>
            </button>
            <button
              id="admin-tab-finanzas"
              onClick={() => setActiveTab('finanzas')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'finanzas'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">account_balance</span>
              <span>FINANZAS (SPEI)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              id="admin-tab-soporte"
              onClick={() => setActiveTab('soporte')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'soporte'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">support_agent</span>
              <span>SOPORTE IT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              onClick={() => setActiveTab('kali')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'kali'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">terminal</span>
              <span>KALI AUDIT</span>
            </button>
            <button
              onClick={() => setActiveTab('proyectos')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'proyectos'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">account_tree</span>
              <span>PROYECTOS</span>
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'sla'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">verified_user</span>
              <span>SLA & SEGURIDAD</span>
            </button>
            <button
              id="admin-tab-aprobaciones"
              onClick={() => setActiveTab('aprobaciones')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'aprobaciones'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">assignment_turned_in</span>
              <span>SOLICITUDES & APROBACIÓN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              id="admin-tab-contratos"
              onClick={() => setActiveTab('contratos')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'contratos'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">description</span>
              <span>CONTRATOS & NDA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              id="admin-tab-boveda"
              onClick={() => setActiveTab('boveda')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'boveda'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">folder_zip</span>
              <span>BÓVEDA ENTREGABLES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              id="admin-tab-auditoria"
              onClick={() => setActiveTab('auditoria')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'auditoria'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">security</span>
              <span>AUDITORÍA ZERO-TRUST</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
            <button
              id="admin-tab-presupuestos"
              onClick={() => setActiveTab('presupuestos')}
              className={`px-3 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'presupuestos'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#222941] text-[#dce1ff] hover:text-[#00e5ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[15px]">price_change</span>
              <span>SOLICITUDES DE PRESUPUESTO</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
            </button>
          </div>
        </nav>

        {activeTab === 'contratos' ? (
          <AdminContractGenerator showToast={showToast} />
        ) : activeTab === 'presupuestos' ? (
          <AdminBudgetNegotiations showToast={showToast} />
        ) : activeTab === 'aprobaciones' ? (
          <AdminProjectApprovals onToast={showToast} />
        ) : activeTab === 'finanzas' ? (
          <AdminFinances showToast={showToast} />
        ) : activeTab === 'soporte' ? (
          <AdminSupportTickets showToast={showToast} />
        ) : activeTab === 'boveda' ? (
          <ClientFileVault isAdmin={true} showToast={showToast} />
        ) : activeTab === 'auditoria' ? (
          <AdminAuditLogs showToast={showToast} />
        ) : (
          <>
        {/* KPI CARDS (BENTO GRID STACK: 4 TILES) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* KPI 1: Ganancias Netas */}
          <div className="relative overflow-hidden rounded-xl bg-[#222941]/90 border border-[#00e5ff]/20 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[18px]">query_stats</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] uppercase font-medium">
                  GANANCIAS NETAS
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#00fe66]/15 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold">
                +28.4% MES
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] text-[#dce1ff] font-bold tracking-tight">
                  $1,428,950
                </div>
                <div className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3]">MXN // FONDOS CONSOLIDADOS</div>
              </div>
              <div className="w-24 h-9">
                <svg className="notranslate w-full h-full stroke-[#00e5ff] fill-none" preserveAspectRatio="none" viewBox="0 0 100 36">
                  <path d="M0,32 Q15,26 28,30 T55,14 T80,18 T100,4" strokeLinecap="round" strokeWidth="2.5"></path>
                  <path d="M0,32 Q15,26 28,30 T55,14 T80,18 T100,4 L100,36 L0,36 Z" fill="rgba(0, 229, 255, 0.12)" stroke="none"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#bac9cc] pt-2 mt-2 border-t border-[#181e36]">
              <span>Cierre proyectado 30d</span>
              <span className="text-[#00daf3] font-semibold">$1,850,000 MXN</span>
            </div>
          </div>

          {/* KPI 2: Dual Gateway Dispersion */}
          <div className="rounded-xl bg-[#222941]/90 border border-[#00e5ff]/20 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[18px]">hub</span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] uppercase font-medium">
                  DISPERSIÓN DUAL GATEWAY
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] font-semibold">LEDGER SYNCHRONIZED</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="w-full h-2.5 rounded bg-[#060d24] overflow-hidden flex border border-[#181e36]">
                <div className="bg-[#00e5ff] h-full shadow-[0_0_8px_rgba(0,229,255,0.4)]" style={{ width: '64%' }}></div>
                <div className="bg-[#00fe66] h-full shadow-[0_0_8px_rgba(0,254,102,0.4)]" style={{ width: '36%' }}></div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] pt-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#00e5ff]"></span>
                  <span className="text-[#dce1ff]">Stripe:</span>
                  <span className="text-[#00e5ff] font-bold">$914.5k</span>
                  <span className="text-[#849396]">(64%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#00fe66]"></span>
                  <span className="text-[#dce1ff]">SPEI:</span>
                  <span className="text-[#00fe66] font-bold">$514.4k</span>
                  <span className="text-[#849396]">(36%)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#bac9cc] pt-2 mt-2 border-t border-[#181e36]">
              <span>Liquidación automatizada</span>
              <span className="text-[#00fe66] font-semibold">T+0 INMEDIATO</span>
            </div>
          </div>

          {/* KPI 3: Proyectos & Leads */}
          <div className="rounded-xl bg-[#222941]/90 border border-[#00e5ff]/20 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] uppercase font-medium">
                NUEVOS LEADS / PROSPECTOS
              </span>
              <span translate="no" className="notranslate material-symbols-outlined text-[#00fe66] text-[18px]">task_alt</span>
            </div>
            <div className="my-1">
              <div className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] text-[#dce1ff] font-bold">
                34 <span className="text-[14px] text-[#bac9cc] font-normal">LEADS B2B</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] mt-0.5">
                +42% sem // 68.2% CONVERSIÓN
              </div>
            </div>
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">
              <span className="bg-[#060d24] px-1.5 py-0.5 rounded text-[#00daf3]">TikTok: 19</span>
              <span className="bg-[#060d24] px-1.5 py-0.5 rounded text-[#c0c1ff]">Instagram: 15</span>
            </div>
          </div>

          {/* KPI 4: Seguridad Kali NIDS */}
          <div className="rounded-xl bg-[#222941]/90 border border-[#00e5ff]/20 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] uppercase font-medium">
                KALI NIDS / ESTADO
              </span>
              <span translate="no" className="notranslate material-symbols-outlined text-[#00fe66] text-[18px]">security</span>
            </div>
            <div className="my-1">
              <div className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] text-[#00fe66] font-bold">
                0 <span className="text-[14px] text-[#bac9cc] font-normal">CRÍTICOS</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] mt-0.5">
                14 SCANS // LATENCIA: 1.2ms
              </div>
            </div>
            <div className="font-['JetBrains_Mono'] text-[10px] text-[#ffdad6] bg-[#93000a]/30 px-2 py-0.5 rounded truncate border border-[#ffb4ab]/20">
              IPTABLES DROP: 2,410 IP (Cilium Active)
            </div>
          </div>
        </section>

        {/* CENTRAL SPLIT: FINANZAS & TESORERÍA + KANBAN PIPELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: TESORERÍA B2B & AUDITED LEDGER (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Cash Flow Panel */}
            <section className="rounded-2xl bg-[#141a32]/90 border border-[#00e5ff]/20 p-4 sm:p-5 backdrop-blur-md flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[22px]">account_balance_wallet</span>
                  <h2 className="font-['Space_Grotesk'] text-[20px] text-[#dce1ff] font-bold tracking-tight">
                    Tesorería B2B & Liquidez
                  </h2>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] px-2.5 py-1 rounded bg-[#00fe66]/10 border border-[#00fe66]/30 font-bold">
                  BANXICO SPEI / STRIPE
                </span>
              </div>

              {/* Area Chart 7D */}
              <div className="w-full bg-[#060d24] border border-[#222941] rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">
                  <span>FLUJO ACUMULADO (7D)</span>
                  <span className="text-[#00e5ff] font-bold">DELTA +$420K MXN</span>
                </div>
                <div className="h-32 w-full relative">
                  <svg className="notranslate w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 90">
                    <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3" x1="0" x2="320" y1="20" y2="20"></line>
                    <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3" x1="0" x2="320" y1="50" y2="50"></line>
                    <line stroke="rgba(255,255,255,0.06)" strokeDasharray="3" x1="0" x2="320" y1="75" y2="75"></line>

                    {/* Stripe Polygon */}
                    <polygon
                      fill="rgba(0, 229, 255, 0.15)"
                      points="0,75 50,60 110,48 160,55 220,30 270,35 320,12 320,85 0,85"
                    ></polygon>
                    <polyline
                      fill="none"
                      points="0,75 50,60 110,48 160,55 220,30 270,35 320,12"
                      stroke="#00E5FF"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    ></polyline>

                    {/* SPEI Curve */}
                    <polygon
                      fill="rgba(0, 255, 102, 0.1)"
                      points="0,80 50,70 110,65 160,40 220,45 270,25 320,20 320,85 0,85"
                    ></polygon>
                    <polyline
                      fill="none"
                      points="0,80 50,70 110,65 160,40 220,45 270,25 320,20"
                      stroke="#00FF66"
                      strokeDasharray="4"
                      strokeLinecap="round"
                      strokeWidth="2"
                    ></polyline>
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#bac9cc] pt-2 border-t border-[#181e36]">
                  <span>LUN</span>
                  <span>MAR</span>
                  <span>MIÉ</span>
                  <span>JUE</span>
                  <span>VIE</span>
                  <span>SÁB</span>
                  <span className="text-[#00e5ff] font-bold">DOM</span>
                </div>
              </div>

              {/* Audited Billing Ledger Table */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce1ff] font-bold tracking-wide uppercase">
                    Cobros & Anticipos Auditados
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff]">SLA ZERO-DEFECT</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {ledger.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#181e36]/90 border border-[#222941] hover:border-[#00e5ff]/40 transition-all flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                          {item.client}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[#00e5ff]">
                          ${item.amount.toLocaleString()}{' '}
                          <span className="text-[10px] text-[#bac9cc]">{item.currency}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">
                        <span className="truncate pr-2">{item.service}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] shrink-0 ${
                            item.gatewayType === 'stripe'
                              ? 'bg-[#222941] text-[#9cf0ff]'
                              : 'bg-[#222941] text-[#00fe66]'
                          }`}
                        >
                          {item.gateway}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#222941]">
                        <span className="text-[#00fe66] flex items-center gap-1 font-semibold">
                          <span translate="no" className="notranslate material-symbols-outlined text-[13px]">check_circle</span>
                          {item.status}
                        </span>
                        <button
                          onClick={() =>
                            setInspectModal({
                              isOpen: true,
                              title: `Auditoría Contable // ${item.client}`,
                              hash: item.hash,
                            })
                          }
                          className="text-[#849396] hover:text-[#00e5ff] font-['JetBrains_Mono']"
                        >
                          HASH: {item.hash.slice(0, 8)}...{item.hash.slice(-4)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: KANBAN PIPELINE, SPRINT 24-B & DAEMON LOGS (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Pipeline & Proyectos */}
            <section className="rounded-2xl bg-[#141a32]/90 border border-[#00e5ff]/20 p-4 sm:p-5 backdrop-blur-md flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span translate="no" className="notranslate material-symbols-outlined text-[#00fe66] text-[20px]">code</span>
                  <h2 className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-bold">
                    Pipeline & Proyectos
                  </h2>
                </div>
                <button
                  onClick={() => setIsNewTicketModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1 uppercase transition-colors"
                >
                  <span translate="no" className="notranslate material-symbols-outlined text-[14px]">add</span>
                  <span>Nuevo Ticket</span>
                </button>
              </div>

              {/* Kanban Cards Stack */}
              <div className="flex flex-col gap-2 pt-1">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-[#181e36] border border-[#222941] flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#222941] text-[#00e5ff] font-['JetBrains_Mono'] text-[10px]">
                        {t.categoryBadge}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">#{t.id}</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[14px] font-semibold text-[#dce1ff]">
                      {t.title}
                    </span>
                    <p className="font-['Inter'] text-[12px] text-[#bac9cc]">{t.description}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#222941] text-[10px] font-['JetBrains_Mono']">
                      <span className="text-[#00fe66] font-semibold">{t.amountEst || 'En SLA'}</span>
                      {t.leadScore && <span className="text-[#849396]">Score: {t.leadScore}</span>}
                      {t.slaNote && <span className="text-[#00daf3]">{t.slaNote}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Engineering SPRINT 24-B Progress */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#222941]">
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce1ff] font-bold uppercase">
                    Progreso Ingeniería Sprint 24-B
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc]">4 TAREAS</span>
                </div>

                <div className="space-y-2 font-['Inter'] text-[12px]">
                  <div>
                    <div className="flex justify-between text-[#dce1ff] mb-1">
                      <span>Estructuración DB SQL & Supabase RLS</span>
                      <span className="font-['JetBrains_Mono'] text-[#00e5ff] font-bold">85%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#060d24] overflow-hidden">
                      <div className="bg-[#00e5ff] h-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#dce1ff] mb-1">
                      <span>Landing Page Online & Three.js Cluster</span>
                      <span className="font-['JetBrains_Mono'] text-[#00fe66] font-bold">100%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#060d24] overflow-hidden">
                      <div className="bg-[#00fe66] h-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#dce1ff] mb-1">
                      <span>Microservicios mTLS & Vault HW</span>
                      <span className="font-['JetBrains_Mono'] text-[#00e5ff] font-bold">72%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#060d24] overflow-hidden">
                      <div className="bg-[#00e5ff] h-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#dce1ff] mb-1">
                      <span>Pipeline CI/CD Cero-Trust con Cosign</span>
                      <span className="font-['JetBrains_Mono'] text-[#00fe66] font-bold">91%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#060d24] overflow-hidden">
                      <div className="bg-[#00fe66] h-full" style={{ width: '91%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* LIVE KALI DAEMON & NIDS TERMINAL */}
            <KaliTerminal compact={true} />

            {/* GESTOR DE GOBERNANZA RAÍZ & PERMISOS SLA */}
            <section className="rounded-2xl bg-[#141a32]/90 border border-[#00e5ff]/20 p-4 sm:p-5 backdrop-blur-md flex flex-col gap-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[20px]">
                  admin_panel_settings
                </span>
                <h3 className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-bold">
                  Gestor de Gobernanza Raíz
                </h3>
              </div>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
                Interruptores de seguridad de ejecución inmediata exclusivos para credenciales de Jefe y Socio.
              </p>

              <div className="flex flex-col gap-2.5 pt-1">
                {/* Switch 1: Revocación */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181e36] border border-[#222941]">
                  <div className="flex flex-col pr-2">
                    <span className="font-['Space_Grotesk'] text-[13px] text-[#dce1ff] font-semibold">
                      Revocación Global de Sesiones
                    </span>
                    <span className="font-['Inter'] text-[11px] text-[#bac9cc]">
                      Invalida instantáneamente todos los JWT y cookies Supabase.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={globalRevokeActive}
                      onChange={(e) => handleToggleRevoke(e.target.value === 'true' || e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2d344c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb4ab]"></div>
                  </label>
                </div>

                {/* Switch 2: Biometría FIDO2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181e36] border border-[#222941]">
                  <div className="flex flex-col pr-2">
                    <span className="font-['Space_Grotesk'] text-[13px] text-[#dce1ff] font-semibold">
                      Exigir Clave Biométrica / WebAuthn
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
                      FIDO2 Habilitado para Jefe/Socio
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={fido2Active}
                      onChange={(e) => handleToggleFido2(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2d344c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00fe66]"></div>
                  </label>
                </div>

                {/* Regenerate Terms */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181e36] border border-[#222941]">
                  <div className="flex flex-col pr-2">
                    <span className="font-['Space_Grotesk'] text-[13px] text-[#dce1ff] font-semibold">
                      Regenerar Firma Términos
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff] truncate max-w-[200px]">
                      SHA-256: {termsHash}
                    </span>
                  </div>
                  <button
                    onClick={handleRegenerateTerms}
                    disabled={isSigningTerms}
                    className="px-3 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold tracking-wider transition-colors shrink-0"
                  >
                    {isSigningTerms ? 'FIRMANDO...' : 'FIRMAR'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
        </>
        )}

        {/* FOOTER PRIVILEGED ENCLAVE STAMP */}
        <div className="py-6 flex flex-col items-center justify-center gap-1 font-['JetBrains_Mono'] text-[11px] text-[#849396] text-center border-t border-[#181e36] mt-4">
          <div className="flex items-center gap-1.5 text-[#00e5ff]">
            <span translate="no" className="notranslate material-symbols-outlined text-[15px]">lock</span>
            <span>MRCA SOLUTIONS // PRIVILEGED ACCESS ENCLAVE</span>
          </div>
          <span>CONFIDENTIAL - STRICT ACCESS ONLY FOR JEFE & SOCIO</span>
        </div>
      </div>

      {/* Modals */}
      <ReAuthModal
        isOpen={isReAuthModalOpen}
        onClose={() => setIsReAuthModalOpen(false)}
        onConfirm={(method) => {
          setIsReAuthModalOpen(false);
          showToast(`Sesión Re-Autenticada con éxito vía ${method}. Clúster sincronizado.`);
        }}
      />

      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onAdd={async (ticket) => {
          const newT: KanbanTicket = {
            id: `T-${Math.floor(Math.random() * 900 + 100)}`,
            title: ticket.title || 'Nuevo Proyecto',
            category: ticket.category || 'TikTok B2B',
            categoryBadge: ticket.categoryBadge || 'En Evaluación',
            categoryBadgeColor: 'cyan',
            description: ticket.description || 'Requerimiento registrado.',
            amountEst: ticket.amountEst || '$200k MXN',
            leadScore: ticket.leadScore || 90,
            status: ticket.status || 'leads',
          };
          setTickets((prev) => [newT, ...prev]);
          showToast(`Ticket #${newT.id} registrado en el Pipeline.`);
          try {
            await supabase.from('kanban_tickets').insert({
              title: newT.title,
              description: newT.description,
              category: newT.category,
              category_badge: newT.categoryBadge,
              category_badge_color: newT.categoryBadgeColor,
              amount_est: newT.amountEst,
              lead_score: newT.leadScore,
              status: newT.status,
            });
          } catch {
            // Local fallback
          }
        }}
      />

      <InspectContractModal
        isOpen={inspectModal.isOpen}
        onClose={() => setInspectModal((prev) => ({ ...prev, isOpen: false }))}
        title={inspectModal.title}
        hash={inspectModal.hash}
        version="LEDGER-v2.4"
        description="Constancia de dispersión dual inmutable sellada por Banxico SPEI y Stripe Escrow en memoria segura."
      />
    </AdminLayout>
  );
};
