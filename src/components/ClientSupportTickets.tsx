import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Flame,
  MessageSquare,
  Search,
  Sparkles,
  Info,
  RefreshCw,
  Plus
} from 'lucide-react';
import { SupportTicket, TicketPriority, TicketStatus } from '../types';
import { supabase } from '../lib/supabase/client';

interface ClientSupportTicketsProps {
  clientCompany?: string;
  clientEmail?: string;
  showToast?: (msg: string) => void;
}

export const ClientSupportTickets: React.FC<ClientSupportTicketsProps> = ({
  clientCompany = 'Cuenta Corporativa',
  clientEmail = '',
  showToast,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCriticalPulsing, setIsCriticalPulsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadMyTickets() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const email = (clientEmail || user?.email || '').trim().toLowerCase();
        if (!user && !email) {
          if (mounted) setTickets([]);
          return;
        }
        let query = supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (user && email) {
          query = query.or(`user_id.eq.${user.id},client_id.eq.${user.id},client_email.ilike.${email}`);
        } else if (user) {
          query = query.or(`user_id.eq.${user.id},client_id.eq.${user.id}`);
        } else {
          query = query.ilike('client_email', email);
        }

        const { data, error } = await query;
        if (mounted && !error && Array.isArray(data)) {
          const mapped: SupportTicket[] = data.map((row: any) => {
            const rawPrio = String(row.priority || 'medium').toLowerCase();
            const normPrio: TicketPriority =
              rawPrio === 'critical' || rawPrio === 'crítica' || rawPrio === 'critica' || rawPrio === 'alta'
                ? 'critical'
                : rawPrio === 'low' || rawPrio === 'baja'
                ? 'low'
                : 'medium';
            const rawStatus = String(row.status || 'open').toLowerCase();
            const normStatus: TicketStatus =
              rawStatus === 'resolved' || rawStatus === 'resuelto por bot'
                ? 'resolved'
                : rawStatus === 'in_progress' || rawStatus === 'escalado a humano'
                ? 'in_progress'
                : 'open';
            return {
              id: String(row.id),
              client_id: String(row.client_id || row.user_id || user?.id || ''),
              client_company: row.client_company || clientCompany,
              client_email: row.client_email || email,
              subject: row.subject || 'Solicitud de soporte',
              description: row.description || '',
              priority: normPrio,
              status: normStatus,
              admin_reply: row.admin_reply || row.bot_resolution || undefined,
              created_at: row.created_at
                ? new Date(row.created_at).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
            };
          });
          setTickets(mapped);
        } else if (mounted) {
          setTickets([]);
        }
      } catch {
        if (mounted) setTickets([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadMyTickets();

    const handleSync = () => {
      void loadMyTickets();
    };
    window.addEventListener('mrca_ticket_updated', handleSync);
    return () => {
      mounted = false;
      window.removeEventListener('mrca_ticket_updated', handleSync);
    };
  }, [clientCompany, clientEmail]);

  // Handle critical priority selection with urgent red pulse
  const handleSelectPriority = (newPriority: TicketPriority) => {
    setPriority(newPriority);
    if (newPriority === 'critical') {
      setIsCriticalPulsing(true);
      if (showToast) {
        showToast('⚠️ PRIORIDAD CRÍTICA SELECCIONADA: Alerta de emergencia activada.');
      }
      setTimeout(() => {
        setIsCriticalPulsing(false);
      }, 3500);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      if (showToast) {
        showToast('Por favor ingrese el asunto y la descripción del incidente.');
      }
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveEmail = clientEmail || user?.email || '';
    const generatedId = `TCK-${Date.now().toString().slice(-6)}`;

    let persistedId = generatedId;
    try {
      const { data: inserted } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || null,
          client_email: effectiveEmail,
          category: 'Soporte VIP Portal',
          subject: subject.trim(),
          description: description.trim(),
          priority: priority === 'critical' ? 'Crítica' : priority === 'low' ? 'Baja' : 'Media',
          status: 'Abierto',
        })
        .select('id')
        .maybeSingle();

      if (inserted?.id) {
        persistedId = String(inserted.id);
      }
    } catch {
      // handled gracefully
    }

    const newTicket: SupportTicket = {
      id: persistedId,
      client_id: user?.id || '',
      client_company: clientCompany,
      client_email: effectiveEmail,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'open',
      created_at: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    setTickets((prev) => [newTicket, ...prev]);
    window.dispatchEvent(new CustomEvent('mrca_ticket_updated'));

    setIsSubmitting(false);
    setSubject('');
    setDescription('');
    setPriority('medium');
    if (showToast) {
      showToast(`Ticket registrado correctamente y asignado al equipo de soporte.`);
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#141a32]/95 via-[#0b1432]/90 to-[#141a32]/95 border-2 border-[#00E5FF]/40 p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5" />
                MESA DE SOPORTE TÉCNICO // ENCLAVE DE INGENIERÍA
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-semibold">
                • SLA RESPUESTA &lt; 15 MIN
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Mesa de Ayuda &amp; Gestión de Incidentes IT
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Canal prioritario para reportar incidencias de software, requerimientos de arquitectura o consultas sobre sus servicios. Cada ticket es atendido directamente por nuestros ingenieros senior.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#081026] border border-[#00FF66]/30 font-['JetBrains_Mono'] text-[11px] text-[#00FF66] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]"></span>
            <span>INGENIEROS DE GUARDIA ACTIVOS</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TICKET SUBMISSION FORM (WITH CRITICAL RED PULSE UX)            */}
      {/* ================================================================== */}
      <div
        className={`relative rounded-3xl bg-[#091129]/95 border-2 p-6 sm:p-7 backdrop-blur-2xl transition-all duration-500 shadow-2xl flex flex-col gap-5 ${
          priority === 'critical' || isCriticalPulsing
            ? 'border-[#ff3333] shadow-[0_0_40px_rgba(255,51,51,0.55)] animate-pulse'
            : 'border-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.15)]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2b52]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                priority === 'critical'
                  ? 'bg-[#2b0808] border-[#ff3333] text-[#ff4444]'
                  : 'bg-[#141f42] border-[#00E5FF]/40 text-[#00E5FF]'
              }`}
            >
              {priority === 'critical' ? (
                <Flame className="w-5 h-5 text-[#ff4444] animate-bounce" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
                Crear Nuevo Ticket de Soporte Técnico
              </h3>
              <p className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                EMPRESA: <span className="text-[#00E5FF]">{clientCompany}</span> • PRIORIZACIÓN EN TIEMPO REAL
              </p>
            </div>
          </div>

          {/* Critical Mode Warning Banner */}
          {priority === 'critical' && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#ff3333]/20 border border-[#ff3333]/50 text-[#ff4444] font-['JetBrains_Mono'] text-[11px] font-bold animate-bounce">
              <ShieldAlert className="w-4 h-4" />
              <span>INCIDENTE CRÍTICO // SLA EMERGENCIAS ACTIVADO</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4 font-['JetBrains_Mono'] text-[12px]">
          {/* Priority Select Buttons */}
          <div>
            <label className="block text-[#849396] uppercase mb-1.5 font-bold">
              Nivel de Severidad / Prioridad:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Baja */}
              <button
                type="button"
                onClick={() => handleSelectPriority('low')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  priority === 'low'
                    ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                    : 'bg-[#050b1c] border-[#1b2b52] text-[#849396] hover:text-[#dce1ff]'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-[#00FF66]"></span>
                <div>
                  <div className="font-bold font-['Space_Grotesk'] text-[14px]">Baja</div>
                  <div className="text-[10px] text-[#849396]">Consultas &amp; Mejoras menores</div>
                </div>
              </button>

              {/* Media */}
              <button
                type="button"
                onClick={() => handleSelectPriority('medium')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  priority === 'medium'
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-[#050b1c] border-[#1b2b52] text-[#849396] hover:text-[#dce1ff]'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-[#00E5FF]"></span>
                <div>
                  <div className="font-bold font-['Space_Grotesk'] text-[14px]">Media</div>
                  <div className="text-[10px] text-[#849396]">Interrupciones no bloqueantes</div>
                </div>
              </button>

              {/* Crítica */}
              <button
                type="button"
                onClick={() => handleSelectPriority('critical')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  priority === 'critical'
                    ? 'bg-[#ff3333]/25 border-[#ff3333] text-[#ff4444] shadow-[0_0_25px_rgba(255,51,51,0.6)] font-bold'
                    : 'bg-[#050b1c] border-[#1b2b52] text-[#849396] hover:text-[#ff4444]'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-[#ff3333] animate-ping"></span>
                <div>
                  <div className="font-bold font-['Space_Grotesk'] text-[14px] text-[#ff4444]">
                    🔥 Crítica (Urgencia)
                  </div>
                  <div className="text-[10px] text-[#ff8888]">Bloqueo de servicio total</div>
                </div>
              </button>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-[#849396] uppercase mb-1">
              Asunto / Resumen del Requerimiento:
            </label>
            <input
              type="text"
              placeholder="Ej: Intermitencia en endpoint mTLS de producción o duda sobre factura SPEI"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-4 py-2.5 text-[#dce1ff] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-[#849396] uppercase mb-1">
              Descripción Detallada &amp; Logs Relevantes:
            </label>
            <textarea
              rows={4}
              placeholder="Describa el comportamiento observado, códigos de error HTTP, IPs privadas o solicitud puntual..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl p-4 text-[#dce1ff] leading-relaxed focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#849396]">
              Su ticket será enrutado directamente a nuestra mesa de ingeniería.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-105 cursor-pointer flex items-center gap-2 ${
                priority === 'critical'
                  ? 'bg-gradient-to-r from-[#ff3333] to-[#ff5555] text-white shadow-[0_0_25px_rgba(255,51,51,0.6)]'
                  : 'bg-gradient-to-r from-[#00E5FF] to-[#00b4d8] text-[#00363d] shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmitir Ticket al Enclave</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================================================================== */}
      {/* 3. TICKETS HISTORY LIST & ADMIN REPLIES                            */}
      {/* ================================================================== */}
      <div className="rounded-3xl bg-[#091129]/90 border border-[#1b2b52] p-5 sm:p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18264d]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
              Historial de Tickets de su Empresa ({tickets.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#849396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#050a1a] border border-[#1e2a52] text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {isLoading && (
            <div className="p-8 text-center rounded-2xl bg-[#070f24] border border-[#1a2850] font-['JetBrains_Mono'] text-[12px] text-[#849396]">
              Consultando tus tickets de soporte en Supabase...
            </div>
          )}
          {!isLoading && filteredTickets.length === 0 && (
            <div className="p-10 text-center rounded-2xl bg-[#070f24] border border-dashed border-[#1a2850] flex flex-col items-center gap-1.5">
              <LifeBuoy className="w-8 h-8 text-[#849396]/70" />
              <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Sin tickets registrados aún
              </span>
              <p className="font-['Inter'] text-[12px] text-[#849396]">
                Cuando abras una solicitud de soporte técnico, podrás seguir su avance aquí en tiempo real.
              </p>
            </div>
          )}
          {filteredTickets.map((t) => {
            const isResolved = t.status === 'resolved';
            const isInProgress = t.status === 'in_progress';
            const isOpen = t.status === 'open';

            return (
              <div
                key={t.id}
                className="rounded-2xl bg-[#070f24] border border-[#1a2850] p-5 flex flex-col gap-3 hover:border-[#00E5FF]/50 transition-all shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#00E5FF]">
                      {t.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                        t.priority === 'critical'
                          ? 'bg-[#ff3333]/20 text-[#ff4444] border border-[#ff3333]/40 animate-pulse'
                          : t.priority === 'medium'
                          ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                          : 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
                      }`}
                    >
                      Prioridad {t.priority === 'critical' ? 'Crítica' : t.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                        isResolved
                          ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30'
                          : isInProgress
                          ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                          : 'bg-[#ff9900]/15 text-[#ffb020] border border-[#ffb020]/30'
                      }`}
                    >
                      {isResolved ? 'RESUELTO' : isInProgress ? 'EN DIAGNÓSTICO' : 'ABIERTO'}
                    </span>
                  </div>

                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                    Registrado: {t.created_at}
                  </span>
                </div>

                <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                  {t.subject}
                </h4>

                <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
                  {t.description}
                </p>

                {/* Admin Reply Bubble if available */}
                {t.admin_reply && (
                  <div className="mt-2 rounded-2xl bg-[#0a1533] border border-[#00FF66]/30 p-4 flex flex-col gap-1.5 shadow-inner">
                    <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Dictamen / Respuesta de MRCA Solutions:</span>
                    </div>
                    <p className="font-['Inter'] text-[12px] text-[#cad6ff] leading-relaxed">
                      "{t.admin_reply}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
