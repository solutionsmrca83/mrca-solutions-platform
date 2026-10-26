import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Building,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Send,
  AlertCircle,
  FileText,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { BudgetNegotiation, NegotiationStatus } from '../types';
import { supabase } from '../lib/supabase/client';

interface AdminBudgetNegotiationsProps {
  showToast?: (msg: string) => void;
}

const INITIAL_NEGOTIATIONS: BudgetNegotiation[] = [
  {
    id: 'NEG-2026-041',
    client_type: 'student',
    client_name: 'Carlos Eduardo Reyes',
    client_company_or_school: 'Facultad de Ingeniería UNAM',
    client_email: 'creyes@comunidad.unam.mx',
    client_phone: '+52 55 4912 3019',
    service_title: 'Nivel 2: Sistema Integrado Modular',
    service_category: 'academy',
    original_price: 4200,
    proposed_budget: 2500,
    approved_price: null,
    status: 'pending',
    message:
      'Hola arquitectos, soy estudiante de último semestre. Me redujeron la beca institucional y mi fondo máximo es de $2,500 MXN. ¿Podemos modularizar la entrega omitiendo la simulación en Meet?',
    admin_scope_adjustment: '',
    checkout_link: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'NEG-2026-038',
    client_type: 'enterprise',
    client_name: 'Lic. Roberto Valenzuela (COO)',
    client_company_or_school: 'Logística Transfronteriza Del Norte S.A.',
    client_email: 'rvalenzuela@transnorte.com.mx',
    client_phone: '+52 81 8390 1200',
    service_title: 'Sprint 03: Microservicios Cloud mTLS & Bóveda HSM',
    service_category: 'b2b',
    original_price: 185000,
    proposed_budget: 145000,
    approved_price: 145000,
    status: 'approved',
    message:
      'Nuestro límite trimestral de CAPEX TI para este entregable es de $145,000 MXN netos. Solicitamos diferir el soporte de monitoreo Prometheus a la fase posterior.',
    admin_scope_adjustment:
      'Alcance adaptado: Se implementa arquitectura central mTLS y HSM. El módulo complementario de Prometheus se despliega en Q1 2027.',
    admin_notes: 'Aprobado por Jefe (CISO) tras revisión de márgenes.',
    checkout_link:
      'https://enclave.mrcasolutions.com/checkout/spei?negotiation_id=NEG-2026-038&token=mrca_sec_89fa12',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'NEG-2026-042',
    client_type: 'student',
    client_name: 'Mariana Tapia G.',
    client_company_or_school: 'Instituto Politécnico Nacional (UPIITA)',
    client_email: 'mtapia@alumno.ipn.mx',
    client_phone: '+52 55 3190 8821',
    service_title: 'Topología de Redes OSPF & pfSense',
    service_category: 'academy',
    original_price: 2800,
    proposed_budget: 1800,
    approved_price: null,
    status: 'pending',
    message:
      'Tengo examen práctico en 4 días y hacemos equipo entre dos alumnos. Nuestro presupuesto conjunto alcanza $1,800 MXN. Requerimos el archivo .pkt con la segmentación VLAN.',
    admin_scope_adjustment: '',
    checkout_link: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const AdminBudgetNegotiations: React.FC<AdminBudgetNegotiationsProps> = ({
  showToast,
}) => {
  const [negotiations, setNegotiations] = useState<BudgetNegotiation[]>(() => {
    try {
      const saved = localStorage.getItem('mrca_budget_negotiations');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_NEGOTIATIONS;
  });

  const [filterType, setFilterType] = useState<
    'all' | 'pending' | 'student' | 'enterprise' | 'approved'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [scopeDrafts, setScopeDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({});
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch from Supabase
    async function fetchNegotiations() {
      try {
        const { data, error } = await supabase
          .from('budget_negotiations')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          const mapped: BudgetNegotiation[] = data.map((d: any) => ({
            id: d.id,
            client_type: d.client_type,
            client_name: d.client_name,
            client_company_or_school: d.client_company_or_school,
            client_email: d.client_email,
            client_phone: d.client_phone || undefined,
            service_title: d.service_title,
            service_category: d.service_category,
            original_price: Number(d.original_price),
            proposed_budget: Number(d.proposed_budget),
            approved_price: d.approved_price ? Number(d.approved_price) : null,
            status: d.status,
            message: d.message,
            admin_scope_adjustment: d.admin_scope_adjustment || undefined,
            admin_notes: d.admin_notes || undefined,
            checkout_link: d.checkout_link || undefined,
            created_at: d.created_at,
          }));
          setNegotiations(mapped);
          localStorage.setItem('mrca_budget_negotiations', JSON.stringify(mapped));
        }
      } catch {
        // use local
      }
    }

    fetchNegotiations();

    // 2. Listen for custom event when client creates a negotiation
    const handleNewNegotiation = (e: any) => {
      try {
        const saved = localStorage.getItem('mrca_budget_negotiations');
        if (saved) setNegotiations(JSON.parse(saved));
      } catch {
        // quota
      }
    };

    window.addEventListener('mrca_negotiation_created', handleNewNegotiation);
    return () => window.removeEventListener('mrca_negotiation_created', handleNewNegotiation);
  }, []);

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    if (showToast) showToast('Enlace de pago único copiado al portapapeles.');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleApprovePrice = async (neg: BudgetNegotiation) => {
    setIsProcessingId(neg.id);

    const adjustedScope =
      scopeDrafts[neg.id] !== undefined
        ? scopeDrafts[neg.id]
        : neg.admin_scope_adjustment ||
          `Alcance modular adaptado: Solución optimizada conforme al presupuesto acordado de $${(priceDrafts[neg.id] || neg.proposed_budget).toLocaleString('es-MX')} MXN.`;

    const finalApprovedPrice =
      priceDrafts[neg.id] !== undefined ? priceDrafts[neg.id] : neg.proposed_budget;

    const generatedCheckoutLink = `https://enclave.mrcasolutions.com/checkout/spei?negotiation_id=${neg.id}&auth_price=${finalApprovedPrice}&exp=${Date.now() + 86400000 * 3}`;

    const updated = negotiations.map((item) =>
      item.id === neg.id
        ? {
            ...item,
            status: 'approved' as NegotiationStatus,
            approved_price: finalApprovedPrice,
            admin_scope_adjustment: adjustedScope,
            checkout_link: generatedCheckoutLink,
            updated_at: new Date().toISOString(),
          }
        : item
    );

    setNegotiations(updated);
    localStorage.setItem('mrca_budget_negotiations', JSON.stringify(updated));

    // Update in Supabase
    try {
      await supabase
        .from('budget_negotiations')
        .update({
          status: 'approved',
          approved_price: finalApprovedPrice,
          admin_scope_adjustment: adjustedScope,
          checkout_link: generatedCheckoutLink,
          updated_at: new Date().toISOString(),
        })
        .eq('id', neg.id);
    } catch {
      // Local fallback
    }

    setIsProcessingId(null);
    if (showToast) {
      showToast(
        `¡Precio aprobado para ${neg.client_name}! Enlace de checkout generado ($${finalApprovedPrice.toLocaleString('es-MX')} MXN).`
      );
    }
  };

  const handleReject = async (neg: BudgetNegotiation) => {
    setIsProcessingId(neg.id);

    const updated = negotiations.map((item) =>
      item.id === neg.id
        ? {
            ...item,
            status: 'rejected' as NegotiationStatus,
            admin_notes: 'Rechazado por inviabilidad de costos mínimos de infraestructura.',
            updated_at: new Date().toISOString(),
          }
        : item
    );

    setNegotiations(updated);
    localStorage.setItem('mrca_budget_negotiations', JSON.stringify(updated));

    try {
      await supabase
        .from('budget_negotiations')
        .update({
          status: 'rejected',
          admin_notes: 'Rechazado por inviabilidad técnica/presupuestal.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', neg.id);
    } catch {
      // fallback
    }

    setIsProcessingId(null);
    if (showToast) {
      showToast(`Propuesta ${neg.id} marcada como rechazada.`);
    }
  };

  // Filter calculations
  const filtered = negotiations.filter((item) => {
    const matchesSearch =
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client_company_or_school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'pending') return item.status === 'pending';
    if (filterType === 'student') return item.client_type === 'student';
    if (filterType === 'enterprise') return item.client_type === 'enterprise';
    if (filterType === 'approved') return item.status === 'approved';
    return true;
  });

  const pendingCount = negotiations.filter((n) => n.status === 'pending').length;
  const approvedCount = negotiations.filter((n) => n.status === 'approved').length;
  const totalVolumeProposed = negotiations.reduce((acc, curr) => acc + curr.proposed_budget, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in">
      {/* Top Header & Metrics Banner */}
      <div className="rounded-3xl bg-[#091129]/95 border-2 border-[#00E5FF]/45 p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,229,255,0.2)] flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-b from-[#00E5FF]/10 to-transparent pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1b2b52] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#141e40] border border-[#00E5FF]/50 flex items-center justify-center text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.35)]">
              <SlidersHorizontal className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-bold text-[#dce1ff]">
                  Hub de Solicitudes de Presupuesto &amp; Negociaciones
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider">
                  ENCLAVE DIRECTIVO
                </span>
              </div>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] mt-0.5">
                Revisa contraofertas enviadas por Estudiantes y Clientes Corporativos. Modula el alcance y aprueba nuevos precios para actualizar dinámicamente sus enlaces de checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00E5FF] px-3 py-1.5 rounded-xl bg-[#0c1638] border border-[#00E5FF]/30 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span>{pendingCount} Pendiente(s) de Resolución</span>
            </span>
          </div>
        </div>

        {/* Metrics Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="rounded-2xl bg-[#050b1c] border border-[#1b2b50] p-4 flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              SOLICITUDES TOTALES:
            </span>
            <span className="font-['Space_Grotesk'] text-[26px] font-extrabold text-[#dce1ff]">
              {negotiations.length}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#00E5FF]">
              Academia + B2B Enclave
            </span>
          </div>

          <div className="rounded-2xl bg-[#050b1c] border border-[#ff9900]/40 p-4 flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              PENDIENTES DE REVISIÓN:
            </span>
            <span className="font-['Space_Grotesk'] text-[26px] font-extrabold text-[#ffb020]">
              {pendingCount}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#ff9900]">
              Requieren respuesta &lt; 2 hrs
            </span>
          </div>

          <div className="rounded-2xl bg-[#050b1c] border border-[#00FF66]/40 p-4 flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              APROBADAS &amp; ENLACE GENERADO:
            </span>
            <span className="font-['Space_Grotesk'] text-[26px] font-extrabold text-[#00FF66]">
              {approvedCount}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#00FF66]">
              Checkouts activos vía SPEI/Stripe
            </span>
          </div>

          <div className="rounded-2xl bg-[#050b1c] border border-[#1b2b50] p-4 flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              VOLUMEN TOTAL PROPUESTO:
            </span>
            <span className="font-['Space_Grotesk'] text-[22px] font-extrabold text-[#dce1ff]">
              ${totalVolumeProposed.toLocaleString('es-MX')} MXN
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
              Capital recuperable por contraoferta
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'TODAS' },
            { id: 'pending', label: `PENDIENTES (${pendingCount})` },
            { id: 'student', label: 'ESTUDIANTES' },
            { id: 'enterprise', label: 'ENTERPRISE B2B' },
            { id: 'approved', label: 'APROBADAS' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-[#00E5FF] text-[#00363d] shadow-[0_0_12px_rgba(0,229,255,0.35)]'
                  : 'bg-[#101938] text-[#bac9cc] hover:text-[#dce1ff] border border-[#1b2b52]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#849396] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, escuela o ID..."
            className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl pl-9 pr-3.5 py-1.5 text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
          />
        </div>
      </div>

      {/* Negotiations Cards List */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#080f24] border border-[#1b2b52] flex flex-col items-center justify-center gap-3">
            <SlidersHorizontal className="w-10 h-10 text-[#849396]" />
            <p className="font-['Space_Grotesk'] text-[16px] text-[#dce1ff]">
              No hay solicitudes de presupuesto que coincidan con el filtro.
            </p>
          </div>
        ) : (
          filtered.map((neg) => {
            const isPending = neg.status === 'pending';
            const isApproved = neg.status === 'approved';
            const isRejected = neg.status === 'rejected';
            const deltaPercent = Math.round(
              ((neg.original_price - neg.proposed_budget) / neg.original_price) * 100
            );

            const currentDraftScope =
              scopeDrafts[neg.id] !== undefined
                ? scopeDrafts[neg.id]
                : neg.admin_scope_adjustment || '';

            const currentDraftPrice =
              priceDrafts[neg.id] !== undefined
                ? priceDrafts[neg.id]
                : neg.approved_price || neg.proposed_budget;

            return (
              <div
                key={neg.id}
                className={`rounded-3xl p-5 sm:p-6 border transition-all flex flex-col gap-5 ${
                  isPending
                    ? 'bg-[#091129]/95 border-[#ff9900]/40 shadow-[0_0_25px_rgba(255,153,0,0.1)]'
                    : isApproved
                    ? 'bg-[#070e24]/90 border-[#00FF66]/40 shadow-[0_0_25px_rgba(0,255,102,0.1)]'
                    : 'bg-[#060c20]/80 border-[#1a2850]'
                }`}
              >
                {/* Header Row: Folio, Client Type Badge, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18264d]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['JetBrains_Mono'] text-[13px] font-extrabold text-[#00E5FF]">
                      {neg.id}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        neg.client_type === 'student'
                          ? 'bg-[#00daf3]/15 border border-[#00daf3]/40 text-[#00daf3]'
                          : 'bg-[#c084fc]/15 border border-[#c084fc]/40 text-[#c084fc]'
                      }`}
                    >
                      {neg.client_type === 'student' ? (
                        <>
                          <GraduationCap className="w-3 h-3" />
                          <span>Academia (Estudiante)</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-3 h-3" />
                          <span>B2B Corporativo</span>
                        </>
                      )}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30'
                          : isPending
                          ? 'bg-[#ff9900]/15 text-[#ffb020] border border-[#ffb020]/40 animate-pulse'
                          : 'bg-[#ff3366]/15 text-[#ff8099] border border-[#ff3366]/40'
                      }`}
                    >
                      {isApproved
                        ? 'PRECIO APROBADO & CHECKOUT ACTIVO'
                        : isPending
                        ? 'PENDIENTE DE RESOLUCIÓN'
                        : 'RECHAZADA'}
                    </span>
                  </div>

                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                    Registrado: {new Date(neg.created_at).toLocaleDateString('es-MX')} •{' '}
                    {new Date(neg.created_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Client & Project Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left Column: Client Data */}
                  <div className="flex flex-col gap-1.5 font-['JetBrains_Mono'] text-[12px] bg-[#050b1c] p-4 rounded-2xl border border-[#19274e]">
                    <span className="text-[10px] text-[#849396] uppercase font-bold">
                      Datos del Solicitante:
                    </span>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                      {neg.client_name}
                    </span>
                    <span className="text-[#00E5FF] text-[11px] font-semibold">
                      {neg.client_company_or_school}
                    </span>
                    <div className="pt-2 text-[#bac9cc] flex flex-col gap-0.5 text-[11px]">
                      <span>Email: <strong className="text-[#dce1ff] select-all">{neg.client_email}</strong></span>
                      {neg.client_phone && <span>Tel/WA: <strong className="text-[#dce1ff]">{neg.client_phone}</strong></span>}
                    </div>
                  </div>

                  {/* Middle Column: Project & Scope Message */}
                  <div className="flex flex-col gap-2 bg-[#050b1c] p-4 rounded-2xl border border-[#19274e] lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase font-bold">
                        Proyecto en Negociación:
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase">
                        Cat: {neg.service_category.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                      {neg.service_title}
                    </h4>

                    {/* Client Message */}
                    <div className="p-3 rounded-xl bg-[#091129] border border-[#1e2f5a] font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase block mb-1 font-semibold">
                        Justificación / Mensaje del Cliente:
                      </span>
                      "{neg.message}"
                    </div>
                  </div>
                </div>

                {/* Price Matrix Comparison Bento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#060d24] p-4 rounded-2xl border border-[#18264d]">
                  <div className="flex flex-col">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
                      Precio Oficial Anterior:
                    </span>
                    <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#849396] line-through">
                      ${neg.original_price.toLocaleString('es-MX')} MXN
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb020] uppercase font-bold">
                      Presupuesto Propuesto por Cliente:
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Space_Grotesk'] text-[22px] font-extrabold text-[#ffb020]">
                        ${neg.proposed_budget.toLocaleString('es-MX')}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">MXN</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end justify-center">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
                      Descuento Solicitado:
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#ff9900]/15 border border-[#ff9900]/40 text-[#ffb020] font-['JetBrains_Mono'] text-[12px] font-extrabold">
                      -{deltaPercent}% (-${(neg.original_price - neg.proposed_budget).toLocaleString('es-MX')} MXN)
                    </span>
                  </div>
                </div>

                {/* Interactive Admin Scope & Approval Section */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#18264d]">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-['JetBrains_Mono'] text-[11px] text-[#00E5FF] uppercase font-bold flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Ajuste de Alcance del Proyecto (Scope Modularization):</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isApproved}
                      value={currentDraftScope}
                      onChange={(e) =>
                        setScopeDrafts((prev) => ({ ...prev, [neg.id]: e.target.value }))
                      }
                      placeholder="Ej: Se aprueba reducción de costo omitiendo la sesión de simulación en vivo por Meet y manteniendo la entrega del código comentado..."
                      className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2 text-[#dce1ff] font-['Inter'] text-[12px] focus:outline-none focus:border-[#00E5FF] disabled:opacity-70 resize-none"
                    />
                  </div>

                  {/* Approved Link Banner or Action Row */}
                  {isApproved && neg.checkout_link ? (
                    <div className="p-3.5 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-['JetBrains_Mono'] text-[11px]">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-[#00FF66] shrink-0" />
                        <div>
                          <span className="text-[#00FF66] font-bold block">
                            Nuevo Precio Vigente: ${neg.approved_price?.toLocaleString('es-MX')} MXN
                          </span>
                          <span className="text-[#849396] text-[10px] line-clamp-1 select-all">
                            Checkout: {neg.checkout_link}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(neg.checkout_link!, neg.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#00FF66]/20 hover:bg-[#00FF66]/30 text-[#00FF66] border border-[#00FF66]/40 font-bold flex items-center gap-1.5 transition-all"
                        >
                          {copiedLink === neg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink === neg.id ? 'Copiado' : 'Copiar Checkout Link'}</span>
                        </button>
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      {/* Price adjustment input */}
                      <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
                        <span className="text-[#849396] uppercase font-bold">Precio Final a Aprobar:</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#00FF66] font-bold">$</span>
                          <input
                            type="number"
                            value={currentDraftPrice}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [neg.id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="bg-[#050b1c] border border-[#1e2a52] rounded-xl pl-6 pr-12 py-1.5 text-[#00FF66] font-bold font-mono text-[13px] w-36 focus:outline-none focus:border-[#00FF66]"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#849396] text-[10px]">
                            MXN
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          disabled={isProcessingId === neg.id}
                          onClick={() => handleReject(neg)}
                          className="px-4 py-2 rounded-xl bg-[#141f40] hover:bg-[#202f5a] text-[#ff8099] font-['JetBrains_Mono'] text-[11px] font-bold transition-colors"
                        >
                          Rechazar
                        </button>

                        <button
                          type="button"
                          id={`btn-aprobar-precio-${neg.id.toLowerCase()}`}
                          disabled={isProcessingId === neg.id}
                          onClick={() => handleApprovePrice(neg)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#38ef7d] to-[#00FF66] hover:brightness-110 text-[#00363d] font-['Space_Grotesk'] text-[12px] font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#00363d]" />
                          <span>Aprobar Nuevo Precio &amp; Generar Checkout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff8099] font-['JetBrains_Mono'] text-[11px] flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{neg.admin_notes || 'Propuesta rechazada por el equipo directivo.'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
