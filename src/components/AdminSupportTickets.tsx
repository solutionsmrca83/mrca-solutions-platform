import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Send,
  User,
  Building,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { SupportTicket, TicketStatus, TicketPriority } from '../types';
import { supabase } from '../lib/supabase/client';

interface AdminSupportTicketsProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_GLOBAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-2026-102',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    subject: 'Solicitud de Hardening adicional en endpoint de Webhooks Banxico',
    description:
      'Deseamos validar la firma HMAC-SHA256 en las notificaciones entrantes de SPEI para evitar ataques de repetición.',
    priority: 'medium',
    status: 'in_progress',
    admin_reply:
      'Recibido por Jefe (CISO). Estamos preparando el filtro de validación de nonces en el proxy eBPF. Tiempo estimado de entrega: 4 horas.',
    created_at: 'Hoy, 09:30 AM',
  },
  {
    id: 'TCK-2026-105',
    client_id: 'usr_client_aduana_02',
    client_company: 'Aduana Express Cloud',
    client_email: 'mortiz@aduanaexpress.mx',
    subject: 'Picos de latencia inusuales en base de datos sharded de aduanas',
    description:
      'Se registraron tiempos de respuesta > 250ms en la consulta de pedimentos durante el cambio de turno.',
    priority: 'critical',
    status: 'open',
    created_at: 'Hoy, 11:15 AM',
  },
  {
    id: 'TCK-2026-098',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    subject: 'Rotación preventiva de certificados mTLS de producción',
    description:
      'Requerimos renovar el par de llaves asimétricas del cluster de pruebas antes del paso a producción.',
    priority: 'low',
    status: 'resolved',
    admin_reply:
      'Certificados renovados satisfactoriamente con algoritmo ECDSA P-384. Las credenciales fueron despachadas a su canal seguro.',
    created_at: '09 Oct 2026',
  },
  {
    id: 'TCK-2026-092',
    client_id: 'usr_client_neo',
    client_company: 'NeoLogistics LatAm',
    client_email: 'cto@neologistics.io',
    subject: 'Auditoría de políticas RLS para nuevo microservicio de tracking',
    description:
      'Requerimos revisión formal de las cláusulas USING / WITH CHECK para el rol de operador logístico.',
    priority: 'medium',
    status: 'resolved',
    admin_reply:
      'Políticas auditadas y selladas con zero data leakage bajo estándar SOC-2.',
    created_at: '04 Oct 2026',
  },
];

export const AdminSupportTickets: React.FC<AdminSupportTicketsProps> = ({ showToast }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('mrca_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_GLOBAL_TICKETS;
  });

  const [replyingTicket, setReplyingTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          setTickets(data as SupportTicket[]);
        }
      } catch {
        // fallback
      }
    }
    fetchTickets();

    const handleSync = () => {
      try {
        const saved = localStorage.getItem('mrca_support_tickets');
        if (saved) setTickets(JSON.parse(saved));
      } catch {
        // quota
      }
    };
    window.addEventListener('mrca_ticket_updated', handleSync);
    return () => window.removeEventListener('mrca_ticket_updated', handleSync);
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
        : t
    );

    try {
      await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
    } catch {
      // fallback
    }

    setTickets(updated);
    try {
      localStorage.setItem('mrca_support_tickets', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mrca_ticket_updated'));
    } catch {
      // quota
    }

    if (showToast) {
      showToast(`Ticket ${ticketId} movido a "${newStatus.toUpperCase()}".`);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTicket || !replyText.trim()) return;

    setIsSubmittingReply(true);

    const updated = tickets.map((t) =>
      t.id === replyingTicket.id
        ? {
            ...t,
            admin_reply: replyText.trim(),
            status: 'resolved' as TicketStatus,
            updated_at: new Date().toISOString(),
          }
        : t
    );

    try {
      await supabase
        .from('support_tickets')
        .update({
          admin_reply: replyText.trim(),
          status: 'resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', replyingTicket.id);
    } catch {
      // fallback
    }

    setTickets(updated);
    try {
      localStorage.setItem('mrca_support_tickets', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mrca_ticket_updated'));
    } catch {
      // quota
    }

    setTimeout(() => {
      setIsSubmittingReply(false);
      setReplyingTicket(null);
      setReplyText('');
      if (showToast) {
        showToast('Respuesta despachada al cliente y ticket marcado como RESUELTO.');
      }
    }, 600);
  };

  const criticalCount = tickets.filter((t) => t.priority === 'critical' && t.status !== 'resolved').length;

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.client_company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const openTickets = filteredTickets.filter((t) => t.status === 'open');
  const inProgressTickets = filteredTickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = filteredTickets.filter((t) => t.status === 'resolved');

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#141a32]/95 via-[#0c163a]/90 to-[#141a32]/95 border-2 border-[#00E5FF]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5" />
                ADMIN ENCLAVE // TABLERO KANBAN DE SOPORTE TÉCNICO
              </span>
              {criticalCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff3333]/20 border border-[#ff3333]/50 text-[#ff4444] font-['JetBrains_Mono'] text-[10px] font-bold animate-pulse">
                  🔥 {criticalCount} INCIDENTE(S) CRÍTICO(S)
                </span>
              )}
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Gestor Global de Tickets &amp; Resolución de Incidentes IT
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Supervise los requerimientos corporativos en tiempo real, asigne diagnóstico y despache dictámenes técnicos directos a las empresas cliente.
            </p>
          </div>

          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-[#849396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente o asunto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl bg-[#081026] border border-[#1e2a52] text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF] w-64"
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. KANBAN BOARD (3 COLUMNS)                                        */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: ABIERTOS / EN COLA */}
        <div className="rounded-2xl bg-[#091129]/95 border border-[#1c2b54] p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18264d]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb020] animate-pulse"></span>
              <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Abiertos / En Cola ({openTickets.length})
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb020] font-bold uppercase">
              Pendientes
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {openTickets.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col gap-2.5 shadow-md ${
                  t.priority === 'critical'
                    ? 'bg-[#180a0a] border-[#ff3333] shadow-[0_0_20px_rgba(255,51,51,0.35)] animate-pulse'
                    : 'bg-[#0d1633] border-[#1f2f5c] hover:border-[#00E5FF]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#00E5FF]">
                    {t.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase ${
                      t.priority === 'critical'
                        ? 'bg-[#ff3333]/25 text-[#ff4444]'
                        : t.priority === 'medium'
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                        : 'bg-[#00FF66]/20 text-[#00FF66]'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <div className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff]">
                  {t.subject}
                </div>
                <p className="font-['Inter'] text-[12px] text-[#849396] line-clamp-2">
                  {t.description}
                </p>

                <div className="pt-2 border-t border-[#18264d] flex items-center justify-between font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                  <span>{t.client_company}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                    className="px-2.5 py-1 rounded bg-[#00E5FF]/15 hover:bg-[#00E5FF]/30 text-[#00E5FF] font-bold flex items-center gap-1 transition-all"
                  >
                    <span>Iniciar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: EN DIAGNÓSTICO / PROGRESO */}
        <div className="rounded-2xl bg-[#091129]/95 border border-[#1c2b54] p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18264d]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping"></span>
              <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                En Diagnóstico ({inProgressTickets.length})
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#00E5FF] font-bold uppercase">
              En Ejecución
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {inProgressTickets.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-[#0d1633] border border-[#00E5FF]/40 p-4 flex flex-col gap-2.5 shadow-md hover:border-[#00E5FF] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#00E5FF]">
                    {t.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase ${
                      t.priority === 'critical'
                        ? 'bg-[#ff3333]/25 text-[#ff4444]'
                        : t.priority === 'medium'
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                        : 'bg-[#00FF66]/20 text-[#00FF66]'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <div className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff]">
                  {t.subject}
                </div>
                <p className="font-['Inter'] text-[12px] text-[#bac9cc] line-clamp-2">
                  {t.description}
                </p>

                {t.admin_reply && (
                  <div className="p-2 rounded-xl bg-[#060e22] text-[10px] text-[#00FF66] font-['JetBrains_Mono'] border border-[#00FF66]/20">
                    Última nota: "{t.admin_reply}"
                  </div>
                )}

                <div className="pt-2 border-t border-[#18264d] flex items-center justify-between font-['JetBrains_Mono'] text-[10px]">
                  <span className="text-[#849396]">{t.client_company}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyingTicket(t)}
                      className="px-2 py-1 rounded bg-[#18244b] hover:bg-[#223366] text-[#00E5FF] font-semibold"
                    >
                      Responder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t.id, 'resolved')}
                      className="px-2.5 py-1 rounded bg-[#00FF66]/20 hover:bg-[#00FF66]/30 text-[#00FF66] font-bold"
                    >
                      Resolver ✓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: RESUELTOS */}
        <div className="rounded-2xl bg-[#091129]/95 border border-[#1c2b54] p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18264d]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]"></span>
              <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Resueltos &amp; Auditados ({resolvedTickets.length})
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#00FF66] font-bold uppercase">
              Cerrados
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {resolvedTickets.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-[#060d20] border border-[#152345] p-4 flex flex-col gap-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#849396]">
                    {t.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase bg-[#00FF66]/15 text-[#00FF66]">
                    RESUELTO
                  </span>
                </div>

                <div className="font-['Space_Grotesk'] text-[13px] font-semibold text-[#cad6ff]">
                  {t.subject}
                </div>

                {t.admin_reply && (
                  <div className="p-2 rounded-xl bg-[#040816] text-[10px] text-[#00FF66] font-['JetBrains_Mono']">
                    ✓ "{t.admin_reply}"
                  </div>
                )}

                <div className="pt-2 border-t border-[#111c38] flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#849396]">
                  <span>{t.client_company}</span>
                  <span>{t.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. MODAL: ADMIN REPLY & RESOLUTION MODAL                           */}
      {/* ================================================================== */}
      {replyingTicket && (
        <div className="fixed inset-0 z-50 bg-[#060c1e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#091129] border-2 border-[#00E5FF]/50 p-6 shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col gap-4 font-['JetBrains_Mono'] text-[12px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2b52]">
              <div>
                <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                  Responder &amp; Dictaminar Ticket // {replyingTicket.id}
                </h3>
                <span className="text-[10px] text-[#00E5FF]">
                  Cliente: {replyingTicket.client_company}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTicket(null)}
                className="text-[#849396] hover:text-[#dce1ff] text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050b1c] border border-[#1a2850] flex flex-col gap-1 text-[11px]">
              <span className="text-[#849396] uppercase font-bold">Asunto:</span>
              <span className="text-[#dce1ff]">{replyingTicket.subject}</span>
              <span className="text-[#849396] uppercase font-bold mt-1">Detalle:</span>
              <span className="text-[#bac9cc]">{replyingTicket.description}</span>
            </div>

            <form onSubmit={handleSendReply} className="flex flex-col gap-3">
              <label className="text-[#849396] uppercase font-bold text-[11px]">
                Respuesta Técnica / Diagnóstico para el Cliente:
              </label>
              <textarea
                rows={4}
                required
                placeholder="Escriba la solución, parche aplicado o confirmación del requerimiento..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl p-3 text-[#dce1ff] focus:outline-none focus:border-[#00E5FF] leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTicket(null)}
                  className="px-4 py-2 rounded-xl bg-[#141f42] text-[#bac9cc]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="px-5 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#40ff88] text-[#00363d] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_#00FF66]"
                >
                  {isSubmittingReply ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Despachando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Despachar &amp; Marcar Resuelto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
