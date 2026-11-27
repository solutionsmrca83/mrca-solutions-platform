import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  CheckCircle2,
  Calculator,
  DollarSign,
  Search,
  RefreshCw,
  FileText,
  MessageSquare,
  Lock,
  Unlock,
  X,
  Building,
  Sparkles,
  LifeBuoy,
  Clock,
  Check,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { isSuperAdmin } from '../../lib/auth';
import {
  STORAGE_KEYS,
  CRM_SYNC_EVENT,
  fetchAutoAcceptSetting,
  getAutoAcceptSettingSync,
  updateAutoAcceptSetting,
} from '../../lib/mrcaBotEngine';
import type {
  CrmLeadRecord,
  CrmLeadStatus,
  BotSupportTicketRecord,
  BotChatLogRecord,
  ContractPrefillLead,
} from '../../types';

interface AdminCrmConsoleProps {
  defaultSection?: 'leads' | 'tickets';
  sessionUser?: any;
  showToast?: (msg: string) => void;
  onSendToContractGenerator?: (lead: ContractPrefillLead) => void;
}

const DEMO_CRM_LEADS: CrmLeadRecord[] = [
  {
    id: 'LEAD-904101',
    client_name: 'Ing. Rodrigo Salinas Valenzuela',
    company_name: 'Banco NeoPay LatAm S.A. de C.V.',
    email: 'rsalinas@neopay.lat',
    service_type: 'Infraestructura y Nube',
    project_scope: 'Alto Alcance / A la Medida',
    estimated_budget: '$150,000 - $320,000 MXN',
    advance_percentage: 40,
    status: 'Aceptado Automáticamente',
    bot_notes:
      'Cliente aceptó estimado referencial ($150,000 - $320,000 MXN, anticipo 40%, entrega 6 a 12 semanas) y fue aceptado automáticamente en CRM.',
    auto_accepted: true,
    session_id: 'demo_sess_neopay',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'LEAD-904102',
    client_name: 'Lic. Mariana Ortiz Estrada',
    company_name: 'Aduana Express Cloud S.A.P.I. de C.V.',
    email: 'mortiz@aduanaexpress.mx',
    service_type: 'Desarrollo Web & SaaS',
    project_scope: 'Profesional / Empresarial',
    estimated_budget: '$65,000 - $145,000 MXN',
    advance_percentage: 25,
    status: 'En Contrato',
    bot_notes:
      'Cotización estimada aceptada vía chat. Datos enviados al Generador de Contratos con esquema de 25% de anticipo SPEI.',
    auto_accepted: true,
    session_id: 'demo_sess_aduana',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'LEAD-904103',
    client_name: 'Dr. Alejandro Méndez Arismendi',
    company_name: 'Salud Digital Corporativa',
    email: 'amendez@saluddigital.org',
    service_type: 'Auditoría de Ciberseguridad',
    project_scope: 'Profesional / Empresarial',
    estimated_budget: '$55,000 - $120,000 MXN',
    advance_percentage: 25,
    status: 'Aceptado Automáticamente',
    bot_notes:
      'Estimado de auditoría aceptado y dado de alta de forma automática por el Asistente MRCA.',
    auto_accepted: true,
    session_id: 'demo_sess_salud',
    created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
  },
];

const DEMO_SUPPORT_TICKETS: BotSupportTicketRecord[] = [
  {
    id: 'TKT-882101',
    client_email: 'finanzas@retailmex.com',
    category: 'Pagos y Facturación',
    subject: 'Consulta sobre CFDI 4.0, Obra por Encargo y reglas de anticipo SPEI',
    description:
      'Consulta atendida en autoservicio Nivel 1 (Pagos y Facturación). El cliente confirmó solución inmediata.',
    priority: 'Baja',
    status: 'Resuelto por Bot',
    bot_resolution:
      'Se detallaron CFDI 4.0 SAT, Obra por Encargo LFDA y reglas de anticipo SPEI 25%/40% protegiendo confidencialidad bancaria.',
    session_id: 'demo_sess_retail',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'TKT-882102',
    client_email: 'operaciones@aduanaexpress.mx',
    category: 'Firmas de Contratos',
    subject: 'Guía de firma digital y carga de contrato PDF firmado',
    description:
      'El cliente consultó cómo cargar su contrato firmado autógrafamente en formato PDF desde el portal.',
    priority: 'Baja',
    status: 'Resuelto por Bot',
    bot_resolution:
      'Se explicó el flujo de Firma Digital en lienzo interactivo y la modalidad alternativa de Descargar/Subir PDF firmado.',
    session_id: 'demo_sess_aduana',
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  {
    id: 'TKT-882103',
    client_email: 'ti@neopay.lat',
    category: 'Acceso y Cookies',
    subject: 'Acceso y Cookies — Atención Especializada',
    description:
      'Nuestro firewall corporativo bloquea la actualización de sesión en una oficina remota; requerimos validación directa del especialista.',
    priority: 'Alta',
    status: 'Escalado a Humano',
    bot_resolution:
      'Escalado a especialista humano con alerta enviada a solutionsmrca83@gmail.com.',
    session_id: 'demo_sess_neopay',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const DEMO_CHAT_LOGS: Record<string, BotChatLogRecord[]> = {
  demo_sess_neopay: [
    {
      id: 'dlog_1',
      session_id: 'demo_sess_neopay',
      user_email: 'rsalinas@neopay.lat',
      sender: 'user',
      message: '💰 Cotizar Proyecto (Estimado)',
      action_triggered: 'start_quote_flow',
      created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    },
    {
      id: 'dlog_2',
      session_id: 'demo_sess_neopay',
      user_email: 'rsalinas@neopay.lat',
      sender: 'bot',
      message:
        'Aquí tienes tu cotización estimada transparente para Infraestructura y Nube (Alto Alcance / A la Medida): $150,000 - $320,000 MXN • Entrega 6 a 12 semanas • 40% anticipo SPEI.',
      action_triggered: 'quote_generated',
      created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    },
    {
      id: 'dlog_3',
      session_id: 'demo_sess_neopay',
      user_email: 'rsalinas@neopay.lat',
      sender: 'user',
      message: '✅ Aceptar Estimado y Registrar mi Proyecto',
      action_triggered: 'quote_accepted_start_onboarding',
      created_at: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
    },
    {
      id: 'dlog_4',
      session_id: 'demo_sess_neopay',
      user_email: 'rsalinas@neopay.lat',
      sender: 'bot',
      message:
        '¡Listo! Tu proyecto para Banco NeoPay LatAm S.A. de C.V. ha sido aceptado automáticamente en nuestro CRM con tu estimado referencial guardado.',
      action_triggered: 'crm_lead_auto_accepted',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ],
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function normalizeTicketStatusLabel(status: string): 'Resuelto por Bot' | 'Escalado a Humano' | 'Abierto' {
  if (status === 'Resuelto por Bot' || status === 'resolved') return 'Resuelto por Bot';
  if (status === 'Escalado a Humano' || status === 'in_progress') return 'Escalado a Humano';
  return 'Abierto';
}

function normalizePriorityLabel(priority: string): 'Baja' | 'Media' | 'Alta' | 'Crítica' {
  const p = (priority || '').toLowerCase();
  if (p === 'crítica' || p === 'critica' || p === 'critical') return 'Crítica';
  if (p === 'alta' || p === 'high') return 'Alta';
  if (p === 'baja' || p === 'low') return 'Baja';
  return 'Media';
}

export const AdminCrmConsole: React.FC<AdminCrmConsoleProps> = ({
  defaultSection = 'leads',
  sessionUser,
  showToast,
  onSendToContractGenerator,
}) => {
  const isSuper = isSuperAdmin(sessionUser);

  const [activeSection, setActiveSection] = useState<'leads' | 'tickets'>(defaultSection);
  const [leads, setLeads] = useState<CrmLeadRecord[]>([]);
  const [tickets, setTickets] = useState<BotSupportTicketRecord[]>([]);
  const [quotesGeneratedCount, setQuotesGeneratedCount] = useState<number>(DEMO_CRM_LEADS.length);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState<boolean>(() => getAutoAcceptSettingSync());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTogglingAutoAccept, setIsTogglingAutoAccept] = useState<boolean>(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'Todos' | CrmLeadStatus>('Todos');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    'Todos' | 'Resuelto por Bot' | 'Escalado a Humano' | 'Abierto'
  >('Todos');

  // Modal "Ver Conversación"
  const [conversationModal, setConversationModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    notes?: string | null;
    logs: BotChatLogRecord[];
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    notes: null,
    logs: [],
    loading: false,
  });

  // Estado de ajuste de costo final en línea por lead (solo Superadmin)
  const [inlinePriceDrafts, setInlinePriceDrafts] = useState<Record<string, string>>({});
  const [savingPriceLeadId, setSavingPriceLeadId] = useState<string | null>(null);

  // Modal de edición de datos protegidos (client_name, company_name, estimated_budget) — SOLO Superadmin
  const [editingLead, setEditingLead] = useState<CrmLeadRecord | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editEstimatedBudget, setEditEstimatedBudget] = useState('');

  useEffect(() => {
    setActiveSection(defaultSection);
  }, [defaultSection]);

  const loadLocalLeads = (): CrmLeadRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const loadLocalTickets = (): BotSupportTicketRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const loadLocalQuoteLogsCount = (): number => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      const parsed: BotChatLogRecord[] = raw ? JSON.parse(raw) : [];
      return parsed.filter((l) => l.action_triggered === 'quote_generated').length;
    } catch {
      return 0;
    }
  };

  const fetchConsoleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsRes, ticketsRes, quoteLogsRes, autoAcceptVal] = await Promise.all([
        supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
        supabase
          .from('bot_chat_logs')
          .select('id', { count: 'exact', head: true })
          .eq('action_triggered', 'quote_generated'),
        fetchAutoAcceptSetting(),
      ]);

      setAutoAcceptEnabled(autoAcceptVal);

      const localLeads = loadLocalLeads();
      const remoteLeads: CrmLeadRecord[] =
        !leadsRes.error && Array.isArray(leadsRes.data) ? (leadsRes.data as CrmLeadRecord[]) : [];

      const mergedLeadsMap = new Map<string, CrmLeadRecord>();
      [...remoteLeads, ...localLeads].forEach((item) => {
        if (!mergedLeadsMap.has(item.id)) mergedLeadsMap.set(item.id, item);
      });
      const finalLeads =
        mergedLeadsMap.size > 0 ? Array.from(mergedLeadsMap.values()) : DEMO_CRM_LEADS;
      finalLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLeads(finalLeads);

      const remoteQuotes = !quoteLogsRes.error && typeof quoteLogsRes.count === 'number' ? quoteLogsRes.count : 0;
      const localQuotes = loadLocalQuoteLogsCount();
      const leadsWithEstimates = finalLeads.filter(
        (l) => Boolean(l.estimated_budget) && !l.estimated_budget?.toLowerCase().includes('por definir')
      ).length;
      setQuotesGeneratedCount(Math.max(remoteQuotes, localQuotes, leadsWithEstimates));

      const localTickets = loadLocalTickets();
      const remoteTickets: BotSupportTicketRecord[] =
        !ticketsRes.error && Array.isArray(ticketsRes.data)
          ? (ticketsRes.data as any[]).map((row) => ({
              id: String(row.id),
              user_id: row.user_id || row.client_id || null,
              client_email: row.client_email || 'cliente@empresa.corp',
              category: row.category || 'Soporte General',
              subject: row.subject || 'Consulta de Soporte',
              description: row.description || '',
              priority: row.priority || 'Media',
              status: row.status || 'Abierto',
              bot_resolution: row.bot_resolution || row.admin_reply || null,
              session_id: row.session_id || null,
              created_at: row.created_at || new Date().toISOString(),
            }))
          : [];

      const mergedTicketsMap = new Map<string, BotSupportTicketRecord>();
      [...remoteTickets, ...localTickets].forEach((item) => {
        if (!mergedTicketsMap.has(item.id)) mergedTicketsMap.set(item.id, item);
      });
      const finalTickets =
        mergedTicketsMap.size > 0 ? Array.from(mergedTicketsMap.values()) : DEMO_SUPPORT_TICKETS;
      finalTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTickets(finalTickets);
    } catch {
      const localLeads = loadLocalLeads();
      const localTickets = loadLocalTickets();
      const fallbackLeads = localLeads.length > 0 ? localLeads : DEMO_CRM_LEADS;
      setLeads(fallbackLeads);
      setTickets(localTickets.length > 0 ? localTickets : DEMO_SUPPORT_TICKETS);
      setQuotesGeneratedCount(Math.max(loadLocalQuoteLogsCount(), fallbackLeads.length));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConsoleData();
    const handleSync = () => {
      void fetchConsoleData();
    };
    window.addEventListener(CRM_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(CRM_SYNC_EVENT, handleSync);
  }, [fetchConsoleData]);

  // Interruptor Maestro de Auto-Aceptación (Exclusivo Superadmin)
  const handleToggleAutoAccept = async () => {
    if (!isSuper) {
      showToast?.('Acceso restringido: Solo el rol Superadmin puede activar o pausar la Auto-Aceptación.');
      return;
    }
    const nextValue = !autoAcceptEnabled;
    setIsTogglingAutoAccept(true);
    setAutoAcceptEnabled(nextValue);

    await updateAutoAcceptSetting(nextValue, sessionUser?.id || null);
    setIsTogglingAutoAccept(false);
    showToast?.(
      nextValue
        ? 'Auto-Aceptación Automática ACTIVADA. Nuevos clientes serán aceptados al instante.'
        : 'Auto-Aceptación Automática PAUSADA. Nuevas solicitudes pasarán a revisión manual.'
    );
  };

  // Cambiar estado de un Lead
  const handleUpdateLeadStatus = async (leadId: string, newStatus: CrmLeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await supabase.from('crm_leads').update({ status: newStatus }).eq('id', leadId);
    } catch {
      // local fallback
    }
    try {
      const local = loadLocalLeads();
      if (local.some((l) => l.id === leadId)) {
        localStorage.setItem(
          STORAGE_KEYS.LEADS,
          JSON.stringify(local.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
        );
      }
    } catch {}
    showToast?.(`Estado del prospecto actualizado a "${newStatus}".`);
  };

  // Guardar edición de campos restringidos (client_name, company_name, estimated_budget) — SOLO Superadmin
  const handleSaveLeadProtectedFields = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    if (!isSuper) {
      showToast?.(
        'Permiso denegado: Solo Superadmin puede modificar cliente, empresa o presupuesto estimado.'
      );
      return;
    }

    const updatedName = editClientName.trim();
    const updatedCompany = editCompanyName.trim();
    const updatedBudget = editEstimatedBudget.trim();
    if (!updatedName || !updatedCompany) return;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === editingLead.id
          ? {
              ...l,
              client_name: updatedName,
              company_name: updatedCompany,
              estimated_budget: updatedBudget || l.estimated_budget,
            }
          : l
      )
    );

    try {
      await supabase
        .from('crm_leads')
        .update({
          client_name: updatedName,
          company_name: updatedCompany,
          estimated_budget: updatedBudget || editingLead.estimated_budget,
        })
        .eq('id', editingLead.id);
    } catch {
      // fallback
    }

    try {
      const local = loadLocalLeads();
      if (local.some((l) => l.id === editingLead.id)) {
        localStorage.setItem(
          STORAGE_KEYS.LEADS,
          JSON.stringify(
            local.map((l) =>
              l.id === editingLead.id
                ? {
                    ...l,
                    client_name: updatedName,
                    company_name: updatedCompany,
                    estimated_budget: updatedBudget || l.estimated_budget,
                  }
                : l
            )
          )
        );
      }
    } catch {}

    setEditingLead(null);
    showToast?.('Datos protegidos del prospecto actualizados con privilegios Superadmin.');
  };

  // Guardar ajuste en línea de Costo Final MXN (custom_adjusted_price — SOLO Superadmin)
  const handleSaveInlineAdjustedPrice = async (lead: CrmLeadRecord) => {
    if (!isSuper) {
      showToast?.('Acceso denegado: Solo Superadmin puede ajustar el costo final de un cliente.');
      return;
    }
    const rawDraft = (inlinePriceDrafts[lead.id] ?? '').replace(/[^0-9.]/g, '');
    if (!rawDraft) {
      showToast?.('Ingresa un monto numérico válido en MXN.');
      return;
    }
    const numericVal = Number(rawDraft);
    if (Number.isNaN(numericVal) || numericVal < 0) {
      showToast?.('El monto ajustado debe ser un número mayor o igual a 0.');
      return;
    }

    setSavingPriceLeadId(lead.id);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, custom_adjusted_price: numericVal } : l))
    );

    try {
      await supabase
        .from('crm_leads')
        .update({ custom_adjusted_price: numericVal })
        .eq('id', lead.id);
    } catch {
      // local fallback
    }

    try {
      const local = loadLocalLeads();
      if (local.some((l) => l.id === lead.id)) {
        localStorage.setItem(
          STORAGE_KEYS.LEADS,
          JSON.stringify(
            local.map((l) => (l.id === lead.id ? { ...l, custom_adjusted_price: numericVal } : l))
          )
        );
      }
    } catch {}

    setSavingPriceLeadId(null);
    showToast?.(
      `Costo final ajustado para ${lead.company_name}: $${numericVal.toLocaleString('es-MX')} MXN.`
    );
  };

  // Enviar Lead al Generador de Contratos en 1 clic (usa costo ajustado si existe + anticipo 25%/40%)
  const handleSendLeadToContract = async (lead: CrmLeadRecord) => {
    await handleUpdateLeadStatus(lead.id, 'En Contrato');
    const suggestedAdvance: 25 | 40 =
      lead.advance_percentage === 40 ||
      (lead.project_scope || '').toLowerCase().includes('alto alcance')
        ? 40
        : 25;

    const finalBudgetLabel =
      typeof lead.custom_adjusted_price === 'number' && lead.custom_adjusted_price > 0
        ? `$${lead.custom_adjusted_price.toLocaleString('es-MX')} MXN`
        : lead.estimated_budget;

    if (onSendToContractGenerator) {
      onSendToContractGenerator({
        leadId: lead.id,
        clientName: lead.client_name,
        companyName: lead.company_name,
        email: lead.email,
        serviceType: lead.service_type,
        projectScope: lead.project_scope,
        estimatedBudget: finalBudgetLabel,
        advancePercentage: suggestedAdvance,
        botNotes: lead.bot_notes,
      });
    } else {
      showToast?.(`Datos de ${lead.company_name} preparados para el Generador de Contratos.`);
    }
  };

  // Marcar ticket escalado/abierto como resuelto
  const handleResolveTicket = async (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'Resuelto por Bot',
              bot_resolution:
                t.bot_resolution || 'Atendido y cerrado por el equipo ejecutivo desde Consola CRM.',
            }
          : t
      )
    );

    try {
      await supabase
        .from('support_tickets')
        .update({ status: 'Resuelto por Bot' })
        .eq('id', ticketId);
    } catch {
      // fallback
    }

    try {
      const local = loadLocalTickets();
      if (local.some((t) => t.id === ticketId)) {
        localStorage.setItem(
          STORAGE_KEYS.TICKETS,
          JSON.stringify(
            local.map((t) => (t.id === ticketId ? { ...t, status: 'Resuelto por Bot' } : t))
          )
        );
      }
    } catch {}

    showToast?.(`Ticket ${ticketId.slice(0, 10)} marcado como resuelto.`);
  };

  // Abrir Modal "Ver Conversación" (consulta bot_chat_logs en Supabase + respaldo local)
  const handleOpenConversation = async (params: {
    title: string;
    subtitle: string;
    sessionId?: string | null;
    email?: string | null;
    notes?: string | null;
  }) => {
    setConversationModal({
      isOpen: true,
      title: params.title,
      subtitle: params.subtitle,
      notes: params.notes || null,
      logs: [],
      loading: true,
    });

    let remoteLogs: BotChatLogRecord[] = [];
    try {
      let query = supabase
        .from('bot_chat_logs')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(80);

      if (params.sessionId) {
        query = query.eq('session_id', params.sessionId);
      } else if (params.email) {
        query = query.ilike('user_email', params.email);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        remoteLogs = data as BotChatLogRecord[];
      }
    } catch {
      // fallback local
    }

    let localLogs: BotChatLogRecord[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      const parsed: BotChatLogRecord[] = raw ? JSON.parse(raw) : [];
      localLogs = parsed.filter(
        (l) =>
          (params.sessionId && l.session_id === params.sessionId) ||
          (params.email && (l.user_email || '').toLowerCase() === params.email.toLowerCase())
      );
    } catch {
      localLogs = [];
    }

    const demoLogs =
      params.sessionId && DEMO_CHAT_LOGS[params.sessionId] ? DEMO_CHAT_LOGS[params.sessionId] : [];
    const combined =
      remoteLogs.length > 0 ? remoteLogs : localLogs.length > 0 ? localLogs : demoLogs;

    setConversationModal((prev) => ({
      ...prev,
      logs: combined,
      loading: false,
    }));
  };

  // =========================================================================
  // CÁLCULO DE KPIs EN VIVO
  // =========================================================================
  const kpiAutoAcceptedCount = leads.filter(
    (l) => l.auto_accepted || l.status === 'Aceptado Automáticamente'
  ).length;

  const kpiResolvedByBotCount = tickets.filter(
    (t) => normalizeTicketStatusLabel(String(t.status)) === 'Resuelto por Bot'
  ).length;

  const kpiEscalatedCount = tickets.filter(
    (t) => normalizeTicketStatusLabel(String(t.status)) === 'Escalado a Humano'
  ).length;

  // Listas filtradas
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = leadStatusFilter === 'Todos' || lead.status === leadStatusFilter;
    const matchesQuery =
      !normalizedSearch ||
      lead.client_name.toLowerCase().includes(normalizedSearch) ||
      lead.company_name.toLowerCase().includes(normalizedSearch) ||
      lead.email.toLowerCase().includes(normalizedSearch) ||
      lead.service_type.toLowerCase().includes(normalizedSearch) ||
      (lead.project_scope || '').toLowerCase().includes(normalizedSearch) ||
      (lead.estimated_budget || '').toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesQuery;
  });

  const filteredTickets = tickets.filter((ticket) => {
    const normStatus = normalizeTicketStatusLabel(String(ticket.status));
    const matchesStatus = ticketStatusFilter === 'Todos' || normStatus === ticketStatusFilter;
    const matchesQuery =
      !normalizedSearch ||
      ticket.client_email.toLowerCase().includes(normalizedSearch) ||
      ticket.category.toLowerCase().includes(normalizedSearch) ||
      ticket.subject.toLowerCase().includes(normalizedSearch) ||
      ticket.description.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-slate-100">
      {/* ===================================================================== */}
      {/* ENCABEZADO EJECUTIVO & INTERRUPTOR MAESTRO DE AUTO-ACEPTACIÓN         */}
      {/* ===================================================================== */}
      <section className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.18)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                CRM AUTOMATIZADO, COTIZADOR MXN Y SOPORTE NIVEL 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                COSTO OPERATIVO: $0 MXN
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-white tracking-tight">
              Consola de Control — Asistente Ejecutivo MRCA
            </h2>
            <p className="text-[13px] text-slate-300 max-w-2xl leading-relaxed">
              Monitorea cotizaciones generadas, clientes aceptados automáticamente y tickets resueltos sin espera, con transferencia directa en 1 clic al Generador de Contratos.
            </p>
          </div>

          {/* INTERRUPTOR MAESTRO (SOLO SUPERADMIN) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div
              className={`p-3.5 rounded-xl border backdrop-blur-md flex items-center justify-between gap-4 transition-all ${
                autoAcceptEnabled
                  ? 'bg-emerald-950/35 border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.18)]'
                  : 'bg-amber-950/35 border-amber-500/40'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white">
                    Auto-Aceptación Automática
                  </span>
                  {!isSuper && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-['JetBrains_Mono'] text-[9px] font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Solo Superadmin
                    </span>
                  )}
                </div>
                <span
                  className={`font-['JetBrains_Mono'] text-[10.5px] font-semibold mt-0.5 ${
                    autoAcceptEnabled ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {autoAcceptEnabled ? 'Activa (Alta inmediata en CRM)' : 'Pausada (Revisión manual)'}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={autoAcceptEnabled}
                disabled={!isSuper || isTogglingAutoAccept}
                onClick={() => void handleToggleAutoAccept()}
                title={
                  isSuper
                    ? 'Activar o pausar la auto-aceptación automática de clientes'
                    : 'Solo el rol Superadmin puede modificar este interruptor'
                }
                className={`relative inline-flex h-7 w-13 items-center rounded-full transition-all border ${
                  autoAcceptEnabled
                    ? 'bg-emerald-500/30 border-emerald-400'
                    : 'bg-slate-800 border-slate-600'
                } ${!isSuper ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full transition-transform shadow-md ${
                    autoAcceptEnabled
                      ? 'translate-x-6 bg-emerald-400 shadow-[0_0_10px_#10b981]'
                      : 'translate-x-1 bg-slate-400'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void fetchConsoleData()}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-['JetBrains_Mono'] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* TARJETAS KPI EN VIVO (SUPABASE)                                       */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Clientes Aceptados por Bot */}
        <div className="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 uppercase font-semibold">
              Clientes Aceptados por Bot
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-['Space_Grotesk'] text-[30px] font-bold text-white leading-none">
              {kpiAutoAcceptedCount}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1.5 font-['JetBrains_Mono']">
              De {leads.length} prospecto(s) en CRM
            </p>
          </div>
        </div>

        {/* KPI 2: Cotizaciones Generadas */}
        <div className="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 uppercase font-semibold">
              Cotizaciones Generadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-['Space_Grotesk'] text-[30px] font-bold text-cyan-300 leading-none">
              {quotesGeneratedCount}
            </div>
            <p className="text-[11px] text-cyan-400/90 mt-1.5 font-['JetBrains_Mono']">
              Estimados referenciales en MXN
            </p>
          </div>
        </div>

        {/* KPI 3: Problemas Resueltos sin Espera */}
        <div className="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 uppercase font-semibold">
              Problemas Resueltos sin Espera
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-['Space_Grotesk'] text-[30px] font-bold text-teal-300 leading-none">
              {kpiResolvedByBotCount}
            </div>
            <p className="text-[11px] text-amber-300/90 mt-1.5 font-['JetBrains_Mono']">
              {kpiEscalatedCount} escalado(s) a especialista
            </p>
          </div>
        </div>

        {/* KPI 4: Costo Operativo ($0 MXN) */}
        <div className="rounded-xl bg-slate-900/90 border border-emerald-500/40 p-5 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.12)] flex flex-col justify-between hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 uppercase font-semibold">
              Costo Operativo ($0 MXN)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-['Space_Grotesk'] text-[30px] font-bold text-emerald-400 leading-none">
              $0 MXN
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 font-['JetBrains_Mono']">
              Motor determinista local • 0 APIs pagas
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SELECTOR DE SECCIÓN + BUSCADOR Y FILTROS                              */}
      {/* ===================================================================== */}
      <section className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/90 border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setActiveSection('leads')}
              className={`px-3.5 py-2 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'leads'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Aprobaciones Leads ({leads.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('tickets')}
              className={`px-3.5 py-2 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'tickets'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Soporte Clientes VIP ({tickets.length})</span>
            </button>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSection === 'leads'
                  ? 'Buscar cliente, empresa, servicio o monto...'
                  : 'Buscar correo, categoría o asunto...'
              }
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/30 focus:border-cyan-400 text-[12px] text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-['JetBrains_Mono']">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtrar:</span>
          </span>

          {activeSection === 'leads'
            ? (['Todos', 'Aceptado Automáticamente', 'Nuevo', 'En Contrato', 'Rechazado'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLeadStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                      leadStatusFilter === st
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                )
              )
            : (['Todos', 'Resuelto por Bot', 'Escalado a Humano', 'Abierto'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    ticketStatusFilter === st
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
        </div>

        {/* =================================================================== */}
        {/* TABLA 1: LEADS Y COTIZACIONES AUTOMATIZADAS (CRM)                   */}
        {/* =================================================================== */}
        {activeSection === 'leads' && (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-900/95 border-b border-white/10 text-slate-400 font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cliente &amp; Empresa</th>
                  <th className="py-3 px-4">Servicio &amp; Alcance</th>
                  <th className="py-3 px-4">Presupuesto Estimado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones Ejecutivas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-['JetBrains_Mono'] text-[12px]">
                      No se encontraron prospectos con el filtro actual.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const advancePct =
                      lead.advance_percentage === 40 ||
                      (lead.project_scope || '').toLowerCase().includes('alto alcance')
                        ? 40
                        : 25;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-['Space_Grotesk'] font-bold text-white text-[13.5px]">
                                {lead.company_name}
                              </span>
                              {isSuper && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLead(lead);
                                    setEditClientName(lead.client_name);
                                    setEditCompanyName(lead.company_name);
                                    setEditEstimatedBudget(lead.estimated_budget || '');
                                  }}
                                  title="Editar cliente, empresa o presupuesto (Solo Superadmin)"
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer ml-1"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                            <span className="text-slate-300 text-[12px]">{lead.client_name}</span>
                            <span className="font-['JetBrains_Mono'] text-[10.5px] text-cyan-400">
                              {lead.email}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-100">{lead.service_type}</span>
                            <span className="w-fit px-2 py-0.5 rounded bg-slate-800/90 border border-white/10 font-['JetBrains_Mono'] text-[10px] text-slate-300">
                              {lead.project_scope || 'Profesional / Empresarial'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-['JetBrains_Mono'] font-bold text-[12px] text-emerald-400 whitespace-nowrap">
                              {lead.estimated_budget || 'Por definir'}
                            </span>
                            <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-300">
                              Anticipo sugerido: {advancePct}% SPEI
                            </span>

                            {/* Ajuste en línea de Costo Final MXN — EXCLUSIVO SUPERADMIN */}
                            {isSuper ? (
                              <div className="mt-1 flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  step={500}
                                  value={
                                    inlinePriceDrafts[lead.id] ??
                                    (lead.custom_adjusted_price != null
                                      ? String(lead.custom_adjusted_price)
                                      : '')
                                  }
                                  onChange={(e) =>
                                    setInlinePriceDrafts((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      void handleSaveInlineAdjustedPrice(lead);
                                    }
                                  }}
                                  placeholder="Ajustar Costo Final MXN"
                                  aria-label={`Ajustar Costo Final MXN para ${lead.company_name}`}
                                  className="w-40 bg-slate-950 border border-amber-500/40 focus:border-cyan-400 rounded-lg px-2 py-1 text-[11px] text-amber-200 font-['JetBrains_Mono'] placeholder-slate-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={savingPriceLeadId === lead.id}
                                  onClick={() => void handleSaveInlineAdjustedPrice(lead)}
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 font-['JetBrains_Mono'] text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {savingPriceLeadId === lead.id ? '...' : 'Fijar'}
                                </button>
                              </div>
                            ) : lead.custom_adjusted_price != null ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 font-['JetBrains_Mono'] text-[10px] text-amber-300 w-fit">
                                <Lock className="w-2.5 h-2.5" />
                                Costo Final: ${Number(lead.custom_adjusted_price).toLocaleString('es-MX')} MXN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-['JetBrains_Mono'] text-[9.5px] text-slate-500">
                                <Lock className="w-2.5 h-2.5 text-amber-400/70" />
                                Ajuste final solo Superadmin
                              </span>
                            )}

                            {typeof lead.custom_adjusted_price === 'number' &&
                              lead.custom_adjusted_price > 0 &&
                              isSuper && (
                                <span className="font-['JetBrains_Mono'] text-[10px] text-amber-300 font-semibold">
                                  ✓ Final fijado: ${lead.custom_adjusted_price.toLocaleString('es-MX')} MXN
                                </span>
                              )}

                            <span className="font-['JetBrains_Mono'] text-[9.5px] text-slate-500">
                              {formatDateTime(lead.created_at)}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              void handleUpdateLeadStatus(lead.id, e.target.value as CrmLeadStatus)
                            }
                            aria-label={`Cambiar estado de ${lead.company_name}`}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-['JetBrains_Mono'] font-bold focus:outline-none cursor-pointer ${
                              lead.status === 'Aceptado Automáticamente'
                                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                : lead.status === 'En Contrato'
                                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                                : lead.status === 'Rechazado'
                                ? 'bg-red-950/70 border-red-500/40 text-red-300'
                                : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            <option value="Aceptado Automáticamente">Aceptado Automáticamente</option>
                            <option value="Nuevo">Nuevo</option>
                            <option value="En Contrato">En Contrato</option>
                            <option value="Rechazado">Rechazado</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleOpenConversation({
                                  title: `Conversación — ${lead.company_name}`,
                                  subtitle: `${lead.client_name} • ${lead.email}`,
                                  sessionId: lead.session_id,
                                  email: lead.email,
                                  notes: lead.bot_notes,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 font-['JetBrains_Mono'] text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Ver Conversación</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleSendLeadToContract(lead)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['JetBrains_Mono'] text-[10.5px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.35)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Enviar al Generador de Contratos</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* =================================================================== */}
        {/* TABLA 2: TICKETS DE SOPORTE (BOT NIVEL 1 Y ESCALACIONES VIP)        */}
        {/* =================================================================== */}
        {activeSection === 'tickets' && (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-900/95 border-b border-white/10 text-slate-400 font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cliente &amp; Categoría</th>
                  <th className="py-3 px-4">Asunto / Detalle</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-['JetBrains_Mono'] text-[12px]">
                      No hay tickets de soporte que coincidan con el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const normStatus = normalizeTicketStatusLabel(String(ticket.status));
                    const normPriority = normalizePriorityLabel(String(ticket.priority));

                    return (
                      <tr key={ticket.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-cyan-300">
                              {ticket.client_email}
                            </span>
                            <span className="text-[11px] text-slate-300 mt-0.5">
                              {ticket.category}
                            </span>
                            <span className="font-['JetBrains_Mono'] text-[10px] text-slate-500">
                              {formatDateTime(ticket.created_at)}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-md">
                          <div className="font-['Space_Grotesk'] font-bold text-white text-[13px]">
                            {ticket.subject}
                          </div>
                          <p className="text-[11.5px] text-slate-400 line-clamp-2 mt-0.5">
                            {ticket.description}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold border ${
                              normPriority === 'Crítica'
                                ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                                : normPriority === 'Alta'
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : normPriority === 'Media'
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {normPriority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-['JetBrains_Mono'] font-bold border ${
                              normStatus === 'Resuelto por Bot'
                                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                : normStatus === 'Escalado a Humano'
                                ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                            }`}
                          >
                            {normStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleOpenConversation({
                                  title: `Conversación de Soporte — ${ticket.category}`,
                                  subtitle: `${ticket.client_email} • ${normStatus}`,
                                  sessionId: ticket.session_id,
                                  email: ticket.client_email,
                                  notes: ticket.bot_resolution || ticket.description,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 font-['JetBrains_Mono'] text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Ver Conversación</span>
                            </button>

                            {normStatus !== 'Resuelto por Bot' && (
                              <button
                                type="button"
                                onClick={() => void handleResolveTicket(ticket.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Marcar Resuelto</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* MODAL: VER CONVERSACIÓN (bot_chat_logs)                               */}
      {/* ===================================================================== */}
      {conversationModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setConversationModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-border-pulse overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="px-5 py-4 bg-slate-950/90 border-b border-cyan-500/25 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-white">
                  {conversationModal.title}
                </h3>
                <p className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 mt-0.5">
                  {conversationModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConversationModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar conversación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {conversationModal.notes && (
                <div className="p-3.5 rounded-xl bg-cyan-950/35 border border-cyan-500/30 text-[12px] text-slate-200 leading-relaxed">
                  <span className="block font-['JetBrains_Mono'] text-[10px] uppercase text-cyan-400 font-bold mb-1">
                    Resumen del Asistente MRCA:
                  </span>
                  {conversationModal.notes}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Registro de Conversación (bot_chat_logs)</span>
                </span>

                {conversationModal.loading ? (
                  <div className="py-8 text-center text-cyan-300 font-['JetBrains_Mono'] text-[12px] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Consultando conversación...</span>
                  </div>
                ) : conversationModal.logs.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/70 border border-dashed border-white/10 text-center text-slate-400 text-[12px]">
                    No existen mensajes adicionales registrados para esta sesión. El resumen operativo se muestra arriba.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {conversationModal.logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-[12px] ${
                          log.sender === 'user'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-50 self-end max-w-[88%]'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 self-start max-w-[88%]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-['JetBrains_Mono'] text-slate-400 mb-1">
                          <span
                            className={
                              log.sender === 'user'
                                ? 'text-cyan-300 font-bold'
                                : 'text-emerald-400 font-bold'
                            }
                          >
                            {log.sender === 'user' ? 'Cliente' : 'Asistente MRCA'}
                          </span>
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{log.message}</p>
                        {log.action_triggered && (
                          <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-slate-950/70 border border-white/10 font-['JetBrains_Mono'] text-[9px] text-slate-400">
                            Acción: {log.action_triggered}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDITAR CAMPOS PROTEGIDOS DEL LEAD (SOLO SUPERADMIN)            */}
      {/* ===================================================================== */}
      {editingLead && isSuper && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEditingLead(null)}
        >
          <form
            onSubmit={(e) => void handleSaveLeadProtectedFields(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-amber-400" />
                <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                  Editar Datos del Lead (Solo Superadmin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                  Presupuesto Estimado (MXN)
                </label>
                <input
                  type="text"
                  value={editEstimatedBudget}
                  onChange={(e) => setEditEstimatedBudget(e.target.value)}
                  placeholder="Ej. $65,000 - $145,000 MXN"
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-[13px] text-emerald-300 font-['JetBrains_Mono'] focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-[12px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-[12px] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCrmConsole;
