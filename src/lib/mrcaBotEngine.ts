import { supabase } from './supabase/client';
import { sendAdminAlert, sendClientConfirmationEmail } from './emailService';
import {
  MRCA_SERVICES,
  SCOPE_TIER_META,
  fetchLiveServicePricing,
  buildQuoteEstimateFromPricing,
  type MrcaServiceName,
  type MrcaScopeTier,
  type QuoteEstimateResult,
} from './mrcaPricingFallback';
import type {
  CrmLeadRecord,
  CrmLeadStatus,
  BotSupportTicketRecord,
  BotChatLogRecord,
  BotSupportPriority,
} from '../types';

/**
 * MRCA SOLUTIONS — MOTOR CONVERSACIONAL CRM, COTIZADOR DINÁMICO Y SOPORTE NIVEL 1 ($0 API)
 * Carga precios en vivo desde Supabase `service_pricing` (respaldo automático en `mrcaPricingFallback.ts`).
 *
 * REGLAS ESTRICTAS:
 * 1. Cero APIs de IA pagas; 100% determinista local con coincidencia difusa en español.
 * 2. Nunca revelar la cuenta CLABE en el chat público (solo aparece dentro del contrato formal).
 * 3. Aislamiento total de estudiantes: si `isStudentSession === true`, jamás mostrar ni referenciar
 *    el Catálogo de Puntos de Venta / Software Listo.
 */

export const BOT_SERVICE_OPTIONS = MRCA_SERVICES;
export type BotServiceOption = MrcaServiceName;

export type BotFlowStep =
  | 'idle'
  | 'quote_service'
  | 'quote_scope'
  | 'quote_review'
  | 'onboarding_name'
  | 'onboarding_company'
  | 'onboarding_email'
  | 'support_menu'
  | 'support_resolution_check'
  | 'escalation_email'
  | 'escalation_summary';

export type SupportTopicKey = 'acceso_cookies' | 'firmas_contratos' | 'pagos_facturacion' | 'general';

export interface BotQuickReply {
  label: string;
  value: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export interface BotConfirmationCard {
  type: 'lead_accepted' | 'lead_registered' | 'ticket_resolved' | 'ticket_escalated' | 'pos_catalog';
  title: string;
  subtitle: string;
  folio: string;
  details: { label: string; value: string }[];
  ctaLabel?: string;
  ctaAction?: 'open_portal' | 'open_pos_catalog' | 'new_quote' | 'reset';
}

export interface BotMessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  badge?: {
    text: string;
    tone: 'emerald' | 'cyan' | 'amber';
  };
  quoteCard?: QuoteEstimateResult;
  quickReplies?: BotQuickReply[];
  confirmationCard?: BotConfirmationCard;
  actionTriggered?: string;
}

export interface BotSessionState {
  sessionId: string;
  step: BotFlowStep;
  userEmail?: string;
  userId?: string | null;
  isStudentSession?: boolean;
  quote: {
    serviceType: MrcaServiceName | '';
    projectScope: MrcaScopeTier | '';
    estimate: QuoteEstimateResult | null;
  };
  onboarding: {
    clientName: string;
    companyName: string;
    email: string;
  };
  support: {
    topic: SupportTopicKey;
    categoryLabel: string;
    subject: string;
    resolutionSummary: string;
    escalationEmail: string;
  };
}

export const STORAGE_KEYS = {
  LEADS: 'mrca_crm_leads_v1',
  TICKETS: 'mrca_bot_support_tickets_v1',
  LOGS: 'mrca_bot_chat_logs_v1',
  AUTO_ACCEPT: 'mrca_bot_auto_accept_enabled',
} as const;

export const CRM_SYNC_EVENT = 'mrca_crm_bot_updated';

function emitCrmSyncEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CRM_SYNC_EVENT));
  }
}

// ============================================================================
// NORMALIZACIÓN ESPAÑOL + COINCIDENCIA DIFUSA (ACCENT & TYPO INSENSITIVE)
// ============================================================================

export function normalizeSpanishText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@._&\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function matchesFuzzyKeywords(rawText: string, keywords: string[]): boolean {
  const normalized = normalizeSpanishText(rawText);
  if (!normalized) return false;

  const tokens = normalized.split(' ').filter((t) => t.length >= 2);

  for (const rawKw of keywords) {
    const kw = normalizeSpanishText(rawKw);
    if (!kw) continue;

    if (normalized.includes(kw)) return true;

    if (!kw.includes(' ') && kw.length >= 4) {
      const maxEdits = kw.length >= 7 ? 2 : 1;
      for (const token of tokens) {
        if (Math.abs(token.length - kw.length) > maxEdits) continue;
        if (levenshteinDistance(token, kw) <= maxEdits) return true;
      }
    }
  }

  return false;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

// ============================================================================
// CONFIGURACIÓN DE AUTO-ACEPTACIÓN (SUPABASE + LOCALSTORAGE)
// ============================================================================

export function getAutoAcceptSettingSync(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_ACCEPT);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

export async function fetchAutoAcceptSetting(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('value_bool')
      .eq('key', 'auto_accept_enabled')
      .maybeSingle();

    if (!error && data && typeof data.value_bool === 'boolean') {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTO_ACCEPT, String(data.value_bool));
      } catch {
        // ignore storage quota errors
      }
      return data.value_bool;
    }
  } catch {
    // Fallback local
  }
  return getAutoAcceptSettingSync();
}

export async function updateAutoAcceptSetting(
  enabled: boolean,
  updatedByUserId?: string | null
): Promise<{ success: boolean; syncedRemote: boolean }> {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_ACCEPT, String(enabled));
    emitCrmSyncEvent();
  } catch {
    // ignore storage quota errors
  }

  try {
    const { error } = await supabase.from('bot_settings').upsert(
      {
        key: 'auto_accept_enabled',
        value_bool: enabled,
        updated_by: updatedByUserId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    return { success: true, syncedRemote: !error };
  } catch {
    return { success: true, syncedRemote: false };
  }
}

// ============================================================================
// PERSISTENCIA EN SUPABASE + RESPALDO LOCAL
// ============================================================================

export function mapServiceTypeToContractServices(serviceType: string): string[] {
  const norm = normalizeSpanishText(serviceType);
  if (norm.includes('web') || norm.includes('saas')) return ['webapp_dev', 'cloud_arch'];
  if (norm.includes('auditoria') || norm.includes('ciberseguridad')) return ['soc2_audit', 'pentest_offensive'];
  if (norm.includes('infraestructura') || norm.includes('nube')) return ['cloud_arch', 'zero_trust'];
  if (norm.includes('soporte') || norm.includes('mantenimiento')) return ['cloud_arch', 'zero_trust'];
  return ['webapp_dev'];
}

export async function logBotChatEntry(entry: {
  sessionId: string;
  userEmail?: string | null;
  sender: 'user' | 'bot';
  message: string;
  actionTriggered?: string | null;
}): Promise<void> {
  const localRecord: BotChatLogRecord = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    session_id: entry.sessionId,
    user_email: entry.userEmail || null,
    sender: entry.sender,
    message: entry.message,
    action_triggered: entry.actionTriggered || null,
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const existing: BotChatLogRecord[] = raw ? JSON.parse(raw) : [];
    const next = [...existing.slice(-299), localRecord];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
    if (entry.actionTriggered === 'quote_generated') {
      emitCrmSyncEvent();
    }
  } catch {
    // ignore storage errors
  }

  try {
    await supabase.from('bot_chat_logs').insert({
      session_id: entry.sessionId,
      user_email: entry.userEmail || null,
      sender: entry.sender,
      message: entry.message,
      action_triggered: entry.actionTriggered || null,
    });
  } catch {
    // Non-blocking in local/demo environments
  }
}

export async function createAutomatedCrmLead(params: {
  clientName: string;
  companyName: string;
  email: string;
  serviceType: MrcaServiceName;
  projectScope: MrcaScopeTier;
  estimatedBudget: string;
  advancePercentage: 25 | 40;
  deliveryTime: string;
  sessionId: string;
}): Promise<{ record: CrmLeadRecord; autoAccepted: boolean; syncedRemote: boolean }> {
  const autoAcceptEnabled = await fetchAutoAcceptSetting();
  const status: CrmLeadStatus = autoAcceptEnabled ? 'Aceptado Automáticamente' : 'Nuevo';
  const botNotes = autoAcceptEnabled
    ? `Cliente aceptó estimado referencial (${params.estimatedBudget}, anticipo ${params.advancePercentage}%, entrega ${params.deliveryTime}) y fue aceptado automáticamente en CRM. Alcance: ${params.projectScope}.`
    : `Cliente aceptó estimado referencial (${params.estimatedBudget}, anticipo ${params.advancePercentage}%) con Auto-Aceptación pausada por Superadmin. Alcance: ${params.projectScope}. Pendiente de revisión.`;

  const fallbackId = `LEAD-${Date.now().toString().slice(-6)}`;
  let finalRecord: CrmLeadRecord = {
    id: fallbackId,
    client_name: params.clientName.trim(),
    company_name: params.companyName.trim(),
    email: params.email.trim().toLowerCase(),
    service_type: params.serviceType,
    project_scope: params.projectScope,
    estimated_budget: params.estimatedBudget,
    custom_adjusted_price: null,
    advance_percentage: params.advancePercentage,
    status,
    bot_notes: botNotes,
    auto_accepted: autoAcceptEnabled,
    session_id: params.sessionId,
    created_at: new Date().toISOString(),
  };

  let syncedRemote = false;
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        client_name: finalRecord.client_name,
        company_name: finalRecord.company_name,
        email: finalRecord.email,
        service_type: finalRecord.service_type,
        project_scope: finalRecord.project_scope,
        estimated_budget: finalRecord.estimated_budget,
        custom_adjusted_price: null,
        advance_percentage: finalRecord.advance_percentage,
        status: finalRecord.status,
        bot_notes: finalRecord.bot_notes,
        auto_accepted: finalRecord.auto_accepted,
        session_id: finalRecord.session_id,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      finalRecord = { ...finalRecord, ...data };
      syncedRemote = true;
    } else if (!error) {
      syncedRemote = true;
    }
  } catch {
    // Local fallback below
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
    const existing: CrmLeadRecord[] = raw ? JSON.parse(raw) : [];
    const next = [finalRecord, ...existing.filter((l) => l.id !== finalRecord.id)];
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(next));
    emitCrmSyncEvent();
  } catch {
    // ignore storage quota errors
  }

  return { record: finalRecord, autoAccepted: autoAcceptEnabled, syncedRemote };
}

export async function createBotSupportTicket(params: {
  userId?: string | null;
  clientEmail: string;
  category: string;
  subject: string;
  description: string;
  priority: BotSupportPriority;
  status: 'Abierto' | 'Resuelto por Bot' | 'Escalado a Humano';
  botResolution?: string | null;
  sessionId: string;
}): Promise<{ record: BotSupportTicketRecord; syncedRemote: boolean }> {
  const fallbackId = `TKT-${Date.now().toString().slice(-6)}`;
  let finalRecord: BotSupportTicketRecord = {
    id: fallbackId,
    user_id: params.userId || null,
    client_email: params.clientEmail.trim().toLowerCase() || 'visitante@portal.mrca',
    category: params.category,
    subject: params.subject,
    description: params.description,
    priority: params.priority,
    status: params.status,
    bot_resolution: params.botResolution || null,
    session_id: params.sessionId,
    created_at: new Date().toISOString(),
  };

  let syncedRemote = false;
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: finalRecord.user_id,
        client_email: finalRecord.client_email,
        category: finalRecord.category,
        subject: finalRecord.subject,
        description: finalRecord.description,
        priority: finalRecord.priority,
        status: finalRecord.status,
        bot_resolution: finalRecord.bot_resolution,
        session_id: finalRecord.session_id,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      finalRecord = { ...finalRecord, ...data };
      syncedRemote = true;
    } else if (!error) {
      syncedRemote = true;
    }
  } catch {
    // Local fallback below
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    const existing: BotSupportTicketRecord[] = raw ? JSON.parse(raw) : [];
    const next = [finalRecord, ...existing.filter((t) => t.id !== finalRecord.id)];
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(next));
    emitCrmSyncEvent();
  } catch {
    // ignore storage errors
  }

  return { record: finalRecord, syncedRemote };
}

// ============================================================================
// BASE DE CONOCIMIENTO DE SOPORTE NIVEL 1 (100% ESPAÑOL EJECUTIVO)
// ============================================================================

const SUPPORT_GUIDES: Record<
  Exclude<SupportTopicKey, 'general'>,
  {
    categoryLabel: string;
    subject: string;
    response: string;
    resolutionSummary: string;
  }
> = {
  acceso_cookies: {
    categoryLabel: 'Acceso y Cookies',
    subject: 'Asistencia de acceso al portal y consentimiento de cookies',
    response:
      'Para acceder sin inconvenientes a tu Portal de Clientes sigue estos pasos:\n\n' +
      '1. **Consentimiento de Cookies:** Verifica haber presionado **"Aceptar Cookies"** en la ventana inicial de privacidad. Los portales corporativos permanecen bloqueados hasta aceptar las cookies técnicas de seguridad.\n' +
      '2. **Verificación de Credenciales:** Confirma que ingresas tu correo corporativo registrado sin espacios adicionales.\n' +
      '3. **Recuperación de Contraseña:** Si necesitas restablecer tu clave, ingresa a **Portal Clientes → Iniciar Sesión** y solicita el enlace seguro de recuperación a tu correo.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se explicó el desbloqueo mediante CookieConsent, verificación de credenciales y recuperación de contraseña.',
  },
  firmas_contratos: {
    categoryLabel: 'Firmas de Contratos',
    subject: 'Guía de firma digital y carga de contrato PDF firmado',
    response:
      'Desde tu **Portal de Clientes → Contratos** puedes formalizar tu documento con cualquiera de estas dos opciones válidas:\n\n' +
      '1. **Firma Digital en Pantalla (Lienzo Interactivo):** Abre tu contrato pendiente, traza tu firma en el recuadro interactivo y presiona **"Sellar y Firmar Contrato"** para emitir su constancia criptográfica SHA-256 al instante.\n' +
      '2. **Firma Física (Descargar / Subir PDF Firmado):** Descarga el PDF oficial, fírmalo de manera autógrafa y cárgalo en la pestaña **"Subir Contrato Firmado (PDF)"** para notificación automática a nuestro equipo.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se explicó el flujo de Firma Digital en lienzo interactivo y la modalidad alternativa de Descargar/Subir PDF firmado.',
  },
  pagos_facturacion: {
    categoryLabel: 'Pagos y Facturación',
    subject: 'Consulta sobre CFDI 4.0, Obra por Encargo y reglas de anticipo SPEI',
    response:
      'Aquí tienes el resumen oficial de nuestras políticas fiscales, legales y de pago empresarial:\n\n' +
      '• **Facturación CFDI 4.0 (SAT):** Emitimos facturas electrónicas CFDI 4.0 conforme a los requisitos vigentes del SAT, respaldadas con entregables mensuales como prueba de materialidad.\n' +
      '• **Propiedad Intelectual (Obra por Encargo — LFDA):** Todo desarrollo se formaliza bajo la figura de *Obra por Encargo* (Art. 83 y 84 LFDA), cediendo de forma exclusiva los derechos patrimoniales al cliente.\n' +
      '• **Reglas de Anticipo SPEI:** Los proyectos de alcance *Esencial* o *Empresarial* inician con un **25% de anticipo**, mientras que los proyectos de *Alto Alcance / A la Medida* requieren un **40% de anticipo** mediante transferencia electrónica **SPEI**.\n' +
      '• **Seguridad Bancaria:** Por protección corporativa, nunca compartimos datos bancarios ni la cuenta CLABE en el chat público; los datos oficiales de transferencia aparecen exclusivamente dentro de tu **contrato formal emitido**.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se detallaron CFDI 4.0 SAT, Obra por Encargo LFDA y reglas de anticipo SPEI 25%/40% protegiendo confidencialidad bancaria.',
  },
};

export const SERVICE_QUICK_REPLIES: BotQuickReply[] = [
  { label: '💻 Desarrollo Web & SaaS', value: 'Desarrollo Web & SaaS', variant: 'primary' },
  { label: '🛡️ Auditoría de Ciberseguridad', value: 'Auditoría de Ciberseguridad', variant: 'primary' },
  { label: '☁️ Infraestructura y Nube', value: 'Infraestructura y Nube', variant: 'primary' },
  { label: '🛠️ Soporte y Mantenimiento Técnico', value: 'Soporte y Mantenimiento Técnico', variant: 'primary' },
];

export const SCOPE_QUICK_REPLIES: BotQuickReply[] = [
  { label: '🌱 Esencial / PyME (25% anticipo)', value: 'Esencial / PyME', variant: 'primary' },
  { label: '🏢 Profesional / Empresarial (25% anticipo)', value: 'Profesional / Empresarial', variant: 'primary' },
  { label: '🚀 Alto Alcance / A la Medida (40% anticipo)', value: 'Alto Alcance / A la Medida', variant: 'primary' },
];

const RESOLUTION_QUICK_REPLIES: BotQuickReply[] = [
  { label: '✅ Sí, problema resuelto', value: '__RESOLVE_YES__', variant: 'success' },
  { label: '👤 No, necesito un especialista', value: '__RESOLVE_NO__', variant: 'warning' },
];

export const SUPPORT_TREE_QUICK_REPLIES: BotQuickReply[] = [
  { label: '🔐 Acceso y Cookies', value: '__SUPPORT_ACCESO__' },
  { label: '✍️ Firmas de Contratos', value: '__SUPPORT_FIRMAS__' },
  { label: '🧾 Pagos y Facturación', value: '__SUPPORT_PAGOS__' },
  { label: '👤 Hablar con un Especialista', value: '__START_ESCALATION__', variant: 'warning' },
];

// ============================================================================
// ESTADO INICIAL Y MENSAJE DE BIENVENIDA
// ============================================================================

export function createInitialBotSession(
  userEmail?: string,
  userId?: string | null,
  isStudentSession = false
): BotSessionState {
  const sessionId = `mrca_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    sessionId,
    step: 'idle',
    userEmail,
    userId: userId || null,
    isStudentSession,
    quote: {
      serviceType: '',
      projectScope: '',
      estimate: null,
    },
    onboarding: {
      clientName: '',
      companyName: '',
      email: userEmail || '',
    },
    support: {
      topic: 'general',
      categoryLabel: 'Soporte General',
      subject: 'Consulta de Soporte Nivel 1',
      resolutionSummary: '',
      escalationEmail: userEmail || '',
    },
  };
}

export function createWelcomeMessage(
  scope: 'public' | 'client' | 'admin' | 'student' = 'public',
  isStudentSession = false
): BotMessageItem {
  const hidePos = scope === 'student' || isStudentSession;

  const greeting =
    scope === 'admin'
      ? '¡Hola! Soy el **Asistente Ejecutivo MRCA** (Consola CRM). Puedes probar aquí el **Cotizador Dinámico en MXN** conectado a `service_pricing`, la **Auto-Aceptación de Clientes** y el **Soporte Nivel 1** con costo operativo **$0 MXN**.'
      : scope === 'client'
      ? '¡Bienvenido a tu Portal Corporativo! Soy el **Asistente Ejecutivo MRCA**. Puedo generar un **estimado en MXN**, guiarte al **Catálogo de Puntos de Venta Listos (.ZIP + Manual)** o resolver dudas de contratos y facturación al instante.'
      : hidePos
      ? '¡Hola! Soy el **Asistente MRCA**. Puedo ayudarte con dudas de acceso, soporte técnico o cotizaciones de servicios.'
      : '¡Hola! Bienvenido a **MRCA Solutions**. Soy tu Asistente Ejecutivo Automatizado. En menos de 1 minuto puedo darte una **cotización estimada transparente en MXN**, mostrarte nuestros **Puntos de Venta listos para instalar** o resolver soporte al instante.';

  const quickReplies: BotQuickReply[] = [
    { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
    ...(!hidePos
      ? [{ label: '🛒 Ver Puntos de Venta Listos', value: '__VIEW_POS_CATALOG__' } as BotQuickReply]
      : []),
    { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
    { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
  ];

  return {
    id: `bot_welcome_${Date.now()}`,
    sender: 'bot',
    text: greeting,
    timestamp: formatNowTime(),
    quickReplies,
  };
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function matchServiceSelection(input: string): MrcaServiceName | null {
  const norm = normalizeSpanishText(input);
  if (matchesFuzzyKeywords(norm, ['web', 'saas', 'pagina', 'plataforma', 'software', 'aplicacion', 'app', 'desarrollo', 'sistema'])) {
    return 'Desarrollo Web & SaaS';
  }
  if (matchesFuzzyKeywords(norm, ['auditoria', 'ciberseguridad', 'seguridad', 'pentest', 'vulnerabilidad', 'proteccion', 'blindaje'])) {
    return 'Auditoría de Ciberseguridad';
  }
  if (matchesFuzzyKeywords(norm, ['infraestructura', 'nube', 'cloud', 'servidor', 'servidores', 'aws', 'gcp', 'migracion', 'hosting'])) {
    return 'Infraestructura y Nube';
  }
  if (matchesFuzzyKeywords(norm, ['soporte', 'mantenimiento', 'tecnico', 'mesa de ayuda', 'asistencia', 'monitoreo', 'poliza'])) {
    return 'Soporte y Mantenimiento Técnico';
  }
  return null;
}

function matchScopeSelection(input: string): MrcaScopeTier | null {
  const norm = normalizeSpanishText(input);
  if (matchesFuzzyKeywords(norm, ['esencial', 'pyme', 'basico', 'inicial', 'pequeno', 'emprendedor', 'economico'])) {
    return 'Esencial / PyME';
  }
  if (matchesFuzzyKeywords(norm, ['profesional', 'empresarial', 'b2b', 'intermedio', 'estandar', 'corporativo', 'negocio'])) {
    return 'Profesional / Empresarial';
  }
  if (matchesFuzzyKeywords(norm, ['alto alcance', 'medida', 'a la medida', 'complejo', 'critico', 'enterprise', 'avanzado', '40'])) {
    return 'Alto Alcance / A la Medida';
  }
  return null;
}

function detectSupportTopic(input: string): Exclude<SupportTopicKey, 'general'> | null {
  if (
    matchesFuzzyKeywords(input, [
      'cookie',
      'cookies',
      'acceso',
      'entrar',
      'ingresar',
      'login',
      'contrasena',
      'password',
      'clave',
      'sesion',
      'bloqueado',
      'portal',
      'iniciar sesion',
    ])
  ) {
    return 'acceso_cookies';
  }

  if (
    matchesFuzzyKeywords(input, [
      'firma',
      'firmar',
      'firmas',
      'contrato',
      'contratos',
      'pdf',
      'lienzo',
      'canvas',
      'subir contrato',
      'descargar contrato',
      'documento legal',
      'nda',
    ])
  ) {
    return 'firmas_contratos';
  }

  if (
    matchesFuzzyKeywords(input, [
      'pago',
      'pagos',
      'factura',
      'facturacion',
      'cfdi',
      'sat',
      'spei',
      'anticipo',
      'clabe',
      'cuenta bancaria',
      'transferencia',
      'obra por encargo',
      'lfda',
      'propiedad intelectual',
      'iva',
    ])
  ) {
    return 'pagos_facturacion';
  }

  return null;
}

function detectPriorityFromSummary(summary: string): BotSupportPriority {
  if (
    matchesFuzzyKeywords(summary, [
      'critico',
      'urgente',
      'emergencia',
      'caido',
      'fuera de linea',
      'ataque',
      'hackeo',
      'brecha',
      'bloqueo total',
      'produccion caida',
    ])
  ) {
    return 'Crítica';
  }
  return 'Alta';
}

export interface BotTurnResult {
  nextState: BotSessionState;
  reply: BotMessageItem;
}

// ============================================================================
// PROCESADOR CONVERSACIONAL PRINCIPAL (MÁQUINA DE ESTADOS DETERMINISTA)
// ============================================================================

export async function processBotTurn(
  rawInput: string,
  state: BotSessionState,
  displayLabel?: string,
  skipUserLog = false
): Promise<BotTurnResult> {
  const trimmed = rawInput.trim();
  const userMessageForLog = displayLabel || trimmed;
  const nextState: BotSessionState = {
    ...state,
    quote: { ...state.quote },
    onboarding: { ...state.onboarding },
    support: { ...state.support },
  };

  if (!skipUserLog) {
    void logBotChatEntry({
      sessionId: nextState.sessionId,
      userEmail: nextState.userEmail || nextState.onboarding.email || nextState.support.escalationEmail || null,
      sender: 'user',
      message: userMessageForLog,
      actionTriggered: `step:${state.step}`,
    });
  }

  const makeReply = (
    text: string,
    options?: {
      badge?: BotMessageItem['badge'];
      quoteCard?: QuoteEstimateResult;
      quickReplies?: BotQuickReply[];
      confirmationCard?: BotConfirmationCard;
      actionTriggered?: string;
    }
  ): BotTurnResult => {
    const reply: BotMessageItem = {
      id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: 'bot',
      text,
      timestamp: formatNowTime(),
      badge: options?.badge,
      quoteCard: options?.quoteCard,
      quickReplies: options?.quickReplies,
      confirmationCard: options?.confirmationCard,
      actionTriggered: options?.actionTriggered,
    };

    void logBotChatEntry({
      sessionId: nextState.sessionId,
      userEmail: nextState.userEmail || nextState.onboarding.email || nextState.support.escalationEmail || null,
      sender: 'bot',
      message: text,
      actionTriggered: options?.actionTriggered || `state:${nextState.step}`,
    });

    return { nextState, reply };
  };

  // ==========================================================================
  // 1. ACCIONES RÁPIDAS GLOBALES
  // ==========================================================================

  if (
    trimmed === '__CANCEL__' ||
    (state.step !== 'idle' &&
      matchesFuzzyKeywords(trimmed, ['cancelar', 'reiniciar', 'menu principal', 'volver al inicio', 'salir']))
  ) {
    nextState.step = 'idle';
    return makeReply('Perfecto, regresamos al menú principal. ¿En qué podemos apoyar hoy a tu empresa?', {
      actionTriggered: 'flow_cancelled',
      quickReplies: [
        { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
        ...(!nextState.isStudentSession
          ? [{ label: '🛒 Ver Puntos de Venta Listos', value: '__VIEW_POS_CATALOG__' } as BotQuickReply]
          : []),
        { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
        { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
      ],
    });
  }

  // Catálogo de Puntos de Venta y Software Listo (BLOQUEADO para estudiantes)
  if (trimmed === '__VIEW_POS_CATALOG__') {
    if (nextState.isStudentSession) {
      return makeReply(
        'Esa sección está reservada exclusivamente para empresas dentro del Portal de Clientes B2B. ¿Deseas ayuda con otra consulta?',
        {
          actionTriggered: 'pos_catalog_restricted_student',
          quickReplies: [
            { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
            { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
          ],
        }
      );
    }

    nextState.step = 'idle';
    return makeReply(
      'En MRCA Solutions contamos con **Soluciones Listas y Puntos de Venta (POS)** empaquetados para instalación inmediata (`.ZIP` + Manual de Instalación y Uso paso a paso) exclusivamente en el **Portal de Clientes B2B**.',
      {
        actionTriggered: 'pos_catalog_guided',
        badge: {
          text: '🛒 Catálogo Empresarial Disponible',
          tone: 'cyan',
        },
        confirmationCard: {
          type: 'pos_catalog',
          title: 'Soluciones Listas & Puntos de Venta',
          subtitle: 'Descarga directa de paquetes .ZIP y manuales desde tu Portal de Clientes.',
          folio: 'POS-B2B',
          details: [
            { label: 'Destacado', value: 'Punto de Venta MRCA Pro (POS)' },
            { label: 'Incluye', value: 'Instalador .ZIP + Manual de Usuario' },
            { label: 'Acceso', value: 'Portal de Clientes → Soluciones Listas' },
          ],
          ctaLabel: 'Abrir Catálogo de Puntos de Venta →',
          ctaAction: 'open_pos_catalog',
        },
        quickReplies: [
          { label: '💰 Cotizar Proyecto a la Medida', value: '__START_QUOTE__', variant: 'primary' },
          { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
        ],
      }
    );
  }

  if (trimmed === '__START_QUOTE__' || trimmed === '__START_PROJECT__') {
    nextState.step = 'quote_service';
    nextState.quote = {
      serviceType: '',
      projectScope: '',
      estimate: null,
    };
    return makeReply(
      '¡Con gusto calculamos tu **estimado transparente en MXN** con nuestra lista de precios vigente!\n\n**Paso 1 de 2:** ¿Qué **servicio** necesita tu empresa?',
      {
        actionTriggered: 'start_quote_flow',
        quickReplies: SERVICE_QUICK_REPLIES,
      }
    );
  }

  if (trimmed === '__ACCEPT_QUOTE__') {
    if (!nextState.quote.estimate || !nextState.quote.serviceType || !nextState.quote.projectScope) {
      return processBotTurn('__START_QUOTE__', nextState, trimmed, true);
    }
    nextState.step = 'onboarding_name';
    nextState.onboarding = {
      clientName: '',
      companyName: '',
      email: nextState.userEmail || '',
    };
    return makeReply(
      `¡Excelente! Guardaremos tu cotización estimada para **${nextState.quote.serviceType} (${nextState.quote.projectScope})** y registraremos tu proyecto automáticamente en nuestro CRM.\n\n**Paso 1 de 3:** ¿Cuál es tu **nombre completo**?`,
      {
        actionTriggered: 'quote_accepted_start_onboarding',
        quickReplies: [{ label: 'Cancelar registro', value: '__CANCEL__' }],
      }
    );
  }

  if (trimmed === '__START_SUPPORT__') {
    nextState.step = 'support_menu';
    return makeReply(
      'Con gusto te ayudo a resolverlo de inmediato. Selecciona un tema de soporte o escribe brevemente qué necesitas:',
      {
        actionTriggered: 'open_support_tree',
        quickReplies: SUPPORT_TREE_QUICK_REPLIES,
      }
    );
  }

  if (trimmed === '__SUPPORT_ACCESO__') {
    const guide = SUPPORT_GUIDES.acceso_cookies;
    nextState.step = 'support_resolution_check';
    nextState.support = {
      ...nextState.support,
      topic: 'acceso_cookies',
      categoryLabel: guide.categoryLabel,
      subject: guide.subject,
      resolutionSummary: guide.resolutionSummary,
    };
    return makeReply(guide.response, {
      actionTriggered: 'support_guide:acceso_cookies',
      quickReplies: RESOLUTION_QUICK_REPLIES,
    });
  }

  if (trimmed === '__SUPPORT_FIRMAS__') {
    const guide = SUPPORT_GUIDES.firmas_contratos;
    nextState.step = 'support_resolution_check';
    nextState.support = {
      ...nextState.support,
      topic: 'firmas_contratos',
      categoryLabel: guide.categoryLabel,
      subject: guide.subject,
      resolutionSummary: guide.resolutionSummary,
    };
    return makeReply(guide.response, {
      actionTriggered: 'support_guide:firmas_contratos',
      quickReplies: RESOLUTION_QUICK_REPLIES,
    });
  }

  if (trimmed === '__SUPPORT_PAGOS__') {
    const guide = SUPPORT_GUIDES.pagos_facturacion;
    nextState.step = 'support_resolution_check';
    nextState.support = {
      ...nextState.support,
      topic: 'pagos_facturacion',
      categoryLabel: guide.categoryLabel,
      subject: guide.subject,
      resolutionSummary: guide.resolutionSummary,
    };
    return makeReply(guide.response, {
      actionTriggered: 'support_guide:pagos_facturacion',
      quickReplies: RESOLUTION_QUICK_REPLIES,
    });
  }

  if (trimmed === '__START_ESCALATION__' || trimmed === '__RESOLVE_NO__') {
    nextState.step = 'escalation_email';
    if (nextState.support.topic === 'general') {
      nextState.support.categoryLabel = 'Atención Especializada';
      nextState.support.subject = 'Solicitud de contacto con especialista MRCA';
    }
    const existingEmailHint = nextState.userEmail
      ? `\n\nPuedes confirmar tu correo actual (**${nextState.userEmail}**) o escribir otro correo de contacto.`
      : '';
    return makeReply(
      `Entendido, conectaré tu caso de inmediato con un especialista de nuestro equipo ejecutivo.${existingEmailHint}\n\nPor favor, indícame tu **correo electrónico** de contacto:`,
      {
        actionTriggered: 'start_human_escalation',
        quickReplies: nextState.userEmail
          ? [
              { label: `Usar ${nextState.userEmail}`, value: nextState.userEmail, variant: 'primary' },
              { label: 'Cancelar', value: '__CANCEL__' },
            ]
          : [{ label: 'Cancelar', value: '__CANCEL__' }],
      }
    );
  }

  if (trimmed === '__RESOLVE_YES__') {
    const emailToLog = nextState.userEmail || nextState.onboarding.email || 'cliente.portal@mrcasolutions.com';
    const { record } = await createBotSupportTicket({
      userId: nextState.userId,
      clientEmail: emailToLog,
      category: nextState.support.categoryLabel,
      subject: nextState.support.subject,
      description: `Consulta atendida en autoservicio Nivel 1 (${nextState.support.categoryLabel}). El cliente confirmó solución inmediata.`,
      priority: 'Baja',
      status: 'Resuelto por Bot',
      botResolution: nextState.support.resolutionSummary || 'Resuelto al instante mediante guía interactiva MRCA.',
      sessionId: nextState.sessionId,
    });

    nextState.step = 'idle';
    return makeReply(
      '¡Excelente! Registramos tu caso como resuelto al instante en nuestro centro de soporte. ¿Deseas cotizar un proyecto o tienes alguna otra consulta?',
      {
        actionTriggered: 'ticket_resolved_by_bot',
        badge: {
          text: '🛠️ Ticket Resuelto al Instante',
          tone: 'emerald',
        },
        confirmationCard: {
          type: 'ticket_resolved',
          title: 'Ticket Resuelto por Asistente MRCA',
          subtitle: 'Atención inmediata Nivel 1 sin tiempo de espera.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Categoría', value: nextState.support.categoryLabel },
            { label: 'Estado', value: 'Resuelto por Bot' },
            { label: 'Tiempo de solución', value: 'Inmediato (< 1 min)' },
          ],
          ctaLabel: '💰 Cotizar un Proyecto',
          ctaAction: 'new_quote',
        },
        quickReplies: [
          { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
          { label: '🛠️ Otra consulta de soporte', value: '__START_SUPPORT__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 2. FLUJO A — COTIZADOR ESTIMADO (VIVO DESDE SUPABASE) + AUTO-ACEPTACIÓN
  // ==========================================================================

  if (state.step === 'quote_service') {
    const matchedService = matchServiceSelection(trimmed);
    if (!matchedService) {
      return makeReply('Selecciona una de nuestras **4 líneas de servicio** para calcular tu estimado:', {
        actionTriggered: 'quote_service_retry',
        quickReplies: SERVICE_QUICK_REPLIES,
      });
    }

    nextState.quote.serviceType = matchedService;
    nextState.step = 'quote_scope';
    return makeReply(
      `Excelente elección: **${matchedService}**.\n\n**Paso 2 de 2:** ¿Cuál es el **alcance estimado** de tu proyecto?`,
      {
        actionTriggered: 'quote_service_selected',
        quickReplies: SCOPE_QUICK_REPLIES,
      }
    );
  }

  if (state.step === 'quote_scope') {
    const matchedScope = matchScopeSelection(trimmed);
    if (!matchedScope) {
      return makeReply(
        'Elige el nivel de **alcance** que mejor describe lo que necesitas para mostrar tu estimado en MXN:',
        {
          actionTriggered: 'quote_scope_retry',
          quickReplies: SCOPE_QUICK_REPLIES,
        }
      );
    }

    const serviceName = (nextState.quote.serviceType || 'Desarrollo Web & SaaS') as MrcaServiceName;
    const { rows: livePricingRows } = await fetchLiveServicePricing();
    const estimate = buildQuoteEstimateFromPricing(livePricingRows, serviceName, matchedScope);

    nextState.quote.projectScope = matchedScope;
    nextState.quote.estimate = estimate;
    nextState.step = 'quote_review';

    const scopeShort = SCOPE_TIER_META[matchedScope].shortLabel;

    return makeReply(
      `Aquí tienes tu **cotización estimada transparente** para **${serviceName}** (${scopeShort}):`,
      {
        actionTriggered: 'quote_generated',
        badge: {
          text: '💰 Estimado Referencial Generado',
          tone: 'cyan',
        },
        quoteCard: estimate,
        quickReplies: [
          { label: '✅ Aceptar Estimado y Registrar mi Proyecto', value: '__ACCEPT_QUOTE__', variant: 'success' },
          { label: '🔄 Cotizar Otro Servicio', value: '__START_QUOTE__' },
        ],
      }
    );
  }

  if (state.step === 'quote_review') {
    if (matchesFuzzyKeywords(trimmed, ['aceptar', 'registrar', 'si', 'comenzar', 'iniciar', 'continuar', 'me interesa'])) {
      return processBotTurn('__ACCEPT_QUOTE__', nextState, trimmed, true);
    }
    if (matchesFuzzyKeywords(trimmed, ['otro', 'cambiar', 'cotizar otro', 'volver', 'nuevo'])) {
      return processBotTurn('__START_QUOTE__', nextState, trimmed, true);
    }
    return makeReply(
      '¿Deseas **aceptar este estimado y registrar tu proyecto** en nuestro CRM, o prefieres **cotizar otro servicio**?',
      {
        actionTriggered: 'quote_review_prompt',
        quickReplies: [
          { label: '✅ Aceptar Estimado y Registrar mi Proyecto', value: '__ACCEPT_QUOTE__', variant: 'success' },
          { label: '🔄 Cotizar Otro Servicio', value: '__START_QUOTE__' },
        ],
      }
    );
  }

  if (state.step === 'onboarding_name') {
    if (trimmed.length < 2) {
      return makeReply('Por favor escribe tu **nombre completo** (mínimo 2 caracteres) para continuar:', {
        actionTriggered: 'onboarding_name_invalid',
      });
    }
    nextState.onboarding.clientName = trimmed;
    nextState.step = 'onboarding_company';
    return makeReply(
      `Mucho gusto, **${trimmed}**.\n\n**Paso 2 de 3:** ¿Cuál es el **nombre de tu empresa o negocio**?`,
      {
        actionTriggered: 'onboarding_name_captured',
        quickReplies: [{ label: 'Cancelar registro', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'onboarding_company') {
    if (trimmed.length < 2) {
      return makeReply('Por favor indícame el **nombre de tu empresa o negocio** para registrar tu solicitud:', {
        actionTriggered: 'onboarding_company_invalid',
      });
    }
    nextState.onboarding.companyName = trimmed;
    nextState.step = 'onboarding_email';
    return makeReply(
      `Registramos **${trimmed}**.\n\n**Paso 3 de 3:** ¿Cuál es tu **correo electrónico corporativo** para confirmar tu alta y habilitar tu acceso al portal?`,
      {
        actionTriggered: 'onboarding_company_captured',
        quickReplies: nextState.userEmail
          ? [
              { label: `Usar ${nextState.userEmail}`, value: nextState.userEmail, variant: 'primary' },
              { label: 'Cancelar registro', value: '__CANCEL__' },
            ]
          : [{ label: 'Cancelar registro', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'onboarding_email') {
    if (!isValidEmail(trimmed)) {
      return makeReply(
        'Ese correo no tiene un formato válido. Por favor ingresa un correo electrónico correcto (ejemplo: `nombre@tuempresa.com`):',
        {
          actionTriggered: 'onboarding_email_invalid',
          quickReplies: [{ label: 'Cancelar registro', value: '__CANCEL__' }],
        }
      );
    }

    nextState.onboarding.email = trimmed.toLowerCase();
    nextState.userEmail = trimmed.toLowerCase();

    const { rows: livePricingRows } = await fetchLiveServicePricing();
    const fallbackEstimate = buildQuoteEstimateFromPricing(
      livePricingRows,
      'Desarrollo Web & SaaS',
      'Profesional / Empresarial'
    );
    const activeEstimate = nextState.quote.estimate || fallbackEstimate;

    const { record, autoAccepted } = await createAutomatedCrmLead({
      clientName: nextState.onboarding.clientName,
      companyName: nextState.onboarding.companyName,
      email: nextState.onboarding.email,
      serviceType: activeEstimate.serviceType,
      projectScope: activeEstimate.projectScope,
      estimatedBudget: activeEstimate.formattedRange,
      advancePercentage: activeEstimate.advancePercentage,
      deliveryTime: activeEstimate.deliveryTime,
      sessionId: nextState.sessionId,
    });

    // Disparar alerta EmailJS administrativa ("NUEVO CLIENTE ACEPTADO EN CRM") + confirmación opcional al cliente
    void sendAdminAlert({
      event_type: 'NUEVO CLIENTE ACEPTADO EN CRM',
      client_name: record.client_name,
      company_name: record.company_name,
      client_email: record.email,
      message: `Servicio: ${record.service_type} (${record.project_scope || activeEstimate.projectScope}). Estimado referencial: ${record.estimated_budget || activeEstimate.formattedRange}. Anticipo sugerido: ${record.advance_percentage || activeEstimate.advancePercentage}% SPEI. Estado CRM: ${record.status}.`,
    });

    void sendClientConfirmationEmail({
      client_name: record.client_name,
      company_name: record.company_name,
      client_email: record.email,
      service_type: record.service_type,
      estimated_budget: record.estimated_budget || activeEstimate.formattedRange,
    });

    nextState.step = 'idle';

    if (autoAccepted) {
      return makeReply(
        `¡Listo, **${record.client_name}**! Tu proyecto para **${record.company_name}** ha sido **aceptado automáticamente en nuestro CRM** con tu estimado referencial guardado.\n\nYa puedes acceder o crear tu cuenta en el **Portal de Clientes** para platicar detalles exactos con tu líder asignado y formalizar tu contrato.`,
        {
          actionTriggered: 'crm_lead_auto_accepted',
          badge: {
            text: '✅ Proyecto Aceptado en CRM',
            tone: 'emerald',
          },
          confirmationCard: {
            type: 'lead_accepted',
            title: 'Proyecto Aceptado Automáticamente',
            subtitle: 'Tu registro y estimado referencial están activos en nuestro CRM.',
            folio: record.id.slice(0, 12).toUpperCase(),
            details: [
              { label: 'Cliente', value: record.client_name },
              { label: 'Empresa', value: record.company_name },
              { label: 'Servicio', value: record.service_type },
              { label: 'Alcance', value: record.project_scope || activeEstimate.projectScope },
              { label: 'Estimado MXN', value: record.estimated_budget || activeEstimate.formattedRange },
              { label: 'Anticipo sugerido', value: `${record.advance_percentage || activeEstimate.advancePercentage}% SPEI` },
            ],
            ctaLabel: 'Ir al Portal de Clientes →',
            ctaAction: 'open_portal',
          },
          quickReplies: [
            { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
            { label: '🔄 Cotizar Otro Servicio', value: '__START_QUOTE__' },
          ],
        }
      );
    }

    return makeReply(
      `¡Gracias, **${record.client_name}**! Guardamos tu solicitud y cotización estimada para **${record.company_name}** en nuestro CRM. Nuestro director o líder de proyecto se pondrá en contacto contigo para afinar el alcance final.`,
      {
        actionTriggered: 'crm_lead_registered_manual_review',
        badge: {
          text: '📋 Proyecto Registrado en CRM',
          tone: 'cyan',
        },
        confirmationCard: {
          type: 'lead_registered',
          title: 'Solicitud Registrada para Revisión Directa',
          subtitle: 'La auto-aceptación se encuentra en modo de revisión manual por dirección.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Cliente', value: record.client_name },
            { label: 'Empresa', value: record.company_name },
            { label: 'Servicio', value: record.service_type },
            { label: 'Estimado MXN', value: record.estimated_budget || activeEstimate.formattedRange },
          ],
          ctaLabel: 'Ir al Portal de Clientes →',
          ctaAction: 'open_portal',
        },
        quickReplies: [
          { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
          { label: '👤 Hablar con un Especialista', value: '__START_ESCALATION__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 3. FLUJO B — CONFIRMACIÓN DE RESOLUCIÓN Y ESCALACIÓN A ESPECIALISTA
  // ==========================================================================

  if (state.step === 'support_resolution_check') {
    if (matchesFuzzyKeywords(trimmed, ['si', 'resuelto', 'funciono', 'listo', 'gracias', 'perfecto', 'excelente', 'solucionado'])) {
      return processBotTurn('__RESOLVE_YES__', nextState, trimmed, true);
    }
    if (matchesFuzzyKeywords(trimmed, ['no', 'especialista', 'humano', 'agente', 'ayuda', 'sigue igual', 'no funciono', 'todavia'])) {
      return processBotTurn('__RESOLVE_NO__', nextState, trimmed, true);
    }
    const anotherTopic = detectSupportTopic(trimmed);
    if (anotherTopic) {
      const cmd =
        anotherTopic === 'acceso_cookies'
          ? '__SUPPORT_ACCESO__'
          : anotherTopic === 'firmas_contratos'
          ? '__SUPPORT_FIRMAS__'
          : '__SUPPORT_PAGOS__';
      return processBotTurn(cmd, nextState, trimmed, true);
    }
    return makeReply('Para cerrar o escalar correctamente tu consulta, confírmame por favor: **¿Esto resolvió tu problema?**', {
      actionTriggered: 'support_resolution_prompt_retry',
      quickReplies: RESOLUTION_QUICK_REPLIES,
    });
  }

  if (state.step === 'escalation_email') {
    if (!isValidEmail(trimmed)) {
      return makeReply(
        'Por favor ingresa un **correo electrónico válido** (ejemplo: `contacto@empresa.com`) para que nuestro especialista pueda responderte:',
        {
          actionTriggered: 'escalation_email_invalid',
          quickReplies: [{ label: 'Cancelar', value: '__CANCEL__' }],
        }
      );
    }
    nextState.support.escalationEmail = trimmed.toLowerCase();
    nextState.userEmail = trimmed.toLowerCase();
    nextState.step = 'escalation_summary';
    return makeReply(
      'Gracias. Ahora escribe un **breve resumen de tu situación o problema** para enviarlo directamente a nuestro especialista de guardia:',
      {
        actionTriggered: 'escalation_email_captured',
        quickReplies: [{ label: 'Cancelar', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'escalation_summary') {
    if (trimmed.length < 5) {
      return makeReply(
        'Por favor compárteme un poco más de detalle (mínimo 5 caracteres) para que nuestro especialista atienda tu caso con precisión:',
        { actionTriggered: 'escalation_summary_short' }
      );
    }

    const priority = detectPriorityFromSummary(trimmed);
    const subject =
      nextState.support.topic === 'general'
        ? `Escalación de Soporte: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? '...' : ''}`
        : `${nextState.support.categoryLabel} — Atención Especializada`;

    const { record } = await createBotSupportTicket({
      userId: nextState.userId,
      clientEmail: nextState.support.escalationEmail,
      category: nextState.support.categoryLabel,
      subject,
      description: trimmed,
      priority,
      status: 'Escalado a Humano',
      botResolution: 'Escalado a especialista humano con alerta enviada a solutionsmrca83@gmail.com.',
      sessionId: nextState.sessionId,
    });

    await sendAdminAlert({
      event_type: 'TICKET ESCALADO POR BOT',
      client_name: record.client_email.split('@')[0] || 'Cliente Portal',
      company_name: record.category,
      client_email: record.client_email,
      message: `Folio ${record.id} (Prioridad ${record.priority}). ${record.subject} — Detalle del usuario: ${record.description}`,
    });

    nextState.step = 'idle';
    return makeReply(
      `Tu caso fue **escalado con prioridad ${priority}** a un especialista y enviamos alerta inmediata a soporte directivo (**solutionsmrca83@gmail.com**).\n\nRecibirás respuesta en **${record.client_email}** a la brevedad.`,
      {
        actionTriggered: 'ticket_escalated_to_human',
        badge: {
          text: '📨 Escalado a Especialista (CISO)',
          tone: 'amber',
        },
        confirmationCard: {
          type: 'ticket_escalated',
          title: 'Caso Escalado a Especialista Humano',
          subtitle: 'Notificación enviada al equipo de atención prioritaria.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Correo de contacto', value: record.client_email },
            { label: 'Prioridad', value: String(record.priority) },
            { label: 'Estado', value: 'Escalado a Humano' },
          ],
          ctaLabel: 'Volver al Menú Principal',
          ctaAction: 'reset',
        },
        quickReplies: [
          { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
          { label: '🛠️ Otra consulta', value: '__START_SUPPORT__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 4. DETECCIÓN INTELIGENTE DE INTENCIONES (IDLE O MENÚ DE SOPORTE)
  // ==========================================================================

  // A) Intención de Puntos de Venta / Software Listo (solo si NO es estudiante)
  if (
    !nextState.isStudentSession &&
    matchesFuzzyKeywords(trimmed, [
      'punto de venta',
      'puntos de venta',
      'pos',
      'software listo',
      'soluciones listas',
      'descargar software',
      'paquete zip',
      'caja registradora',
      'inventario listo',
    ])
  ) {
    return processBotTurn('__VIEW_POS_CATALOG__', nextState, trimmed, true);
  }

  // B) Intención de cotizar / precio / proyecto
  if (
    matchesFuzzyKeywords(trimmed, [
      'cotizar',
      'cotizacion',
      'estimado',
      'precio',
      'precios',
      'costo',
      'costos',
      'cuanto cuesta',
      'presupuesto',
      'iniciar proyecto',
      'comenzar proyecto',
      'nuevo proyecto',
      'contratar',
      'servicios',
      'desarrollo web',
      'saas',
      'auditoria',
      'ciberseguridad',
      'infraestructura',
      'nube',
      'mantenimiento',
      'proyecto',
    ])
  ) {
    const directService = matchServiceSelection(trimmed);
    if (directService) {
      nextState.quote.serviceType = directService;
      nextState.step = 'quote_scope';
      return makeReply(
        `¡Perfecto! Podemos calcular tu **estimado transparente en MXN** para **${directService}**.\n\n¿Cuál es el **alcance estimado** de tu proyecto?`,
        {
          actionTriggered: 'quote_service_auto_detected',
          quickReplies: SCOPE_QUICK_REPLIES,
        }
      );
    }
    return processBotTurn('__START_QUOTE__', nextState, trimmed, true);
  }

  // C) Intención específica de Soporte Nivel 1 (Acceso, Firmas o Pagos/Facturación)
  const detectedTopic = detectSupportTopic(trimmed);
  if (detectedTopic) {
    const cmd =
      detectedTopic === 'acceso_cookies'
        ? '__SUPPORT_ACCESO__'
        : detectedTopic === 'firmas_contratos'
        ? '__SUPPORT_FIRMAS__'
        : '__SUPPORT_PAGOS__';
    return processBotTurn(cmd, nextState, trimmed, true);
  }

  // D) Intención de hablar con humano / especialista
  if (
    matchesFuzzyKeywords(trimmed, [
      'hablar con un especialista',
      'hablar con soporte',
      'especialista',
      'humano',
      'persona',
      'asesor',
      'ejecutivo',
      'director',
      'contacto',
      'urgente',
      'emergencia',
    ])
  ) {
    return processBotTurn('__START_ESCALATION__', nextState, trimmed, true);
  }

  // E) Intención general de soporte / problema
  if (
    matchesFuzzyKeywords(trimmed, [
      'problema',
      'error',
      'ayuda',
      'soporte',
      'falla',
      'no puedo',
      'no funciona',
      'duda',
      'dudas',
      'resolver',
    ])
  ) {
    return processBotTurn('__START_SUPPORT__', nextState, trimmed, true);
  }

  // F) Saludos
  if (matchesFuzzyKeywords(trimmed, ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'hey'])) {
    return makeReply(
      '¡Hola! Qué gusto saludarte. Puedo calcular un **estimado inmediato en MXN** para tu proyecto o ayudarte con cualquier duda sobre accesos, contratos y facturación. ¿Con qué empezamos?',
      {
        actionTriggered: 'greeting_reply',
        quickReplies: [
          { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
          ...(!nextState.isStudentSession
            ? [{ label: '🛒 Ver Puntos de Venta Listos', value: '__VIEW_POS_CATALOG__' } as BotQuickReply]
            : []),
          { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
          { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
        ],
      }
    );
  }

  // G) Menú guiado por defecto
  return makeReply(
    'Gracias por escribirnos. Selecciona una opción rápida para atenderte al instante —ya sea **cotizar tu proyecto en MXN**, resolver temas de **acceso/cookies**, **firmas de contratos**, **facturación CFDI 4.0** o contactar a un especialista:',
    {
      actionTriggered: 'fallback_guided_menu',
      quickReplies: [
        { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
        ...(!nextState.isStudentSession
          ? [{ label: '🛒 Ver Puntos de Venta Listos', value: '__VIEW_POS_CATALOG__' } as BotQuickReply]
          : []),
        { label: '🔐 Acceso y Cookies', value: '__SUPPORT_ACCESO__' },
        { label: '✍️ Firmas de Contratos', value: '__SUPPORT_FIRMAS__' },
        { label: '🧾 Pagos y Facturación', value: '__SUPPORT_PAGOS__' },
        { label: '👤 Hablar con un Especialista', value: '__START_ESCALATION__', variant: 'warning' },
      ],
    }
  );
}
