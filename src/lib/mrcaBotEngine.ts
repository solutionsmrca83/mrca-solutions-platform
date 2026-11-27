import { supabase } from './supabase/client';
import { sendSupportEscalationEmailNotification } from './emailNotification';
import type {
  CrmLeadRecord,
  CrmLeadStatus,
  BotSupportTicketRecord,
  BotChatLogRecord,
  BotSupportPriority,
} from '../types';

/**
 * MRCA SOLUTIONS — MOTOR CONVERSACIONAL CRM & SOPORTE NIVEL 1 (COSTO $0 MXN)
 * 100% local en TypeScript: máquina de estados determinista + coincidencia difusa
 * en español (insensible a acentos y errores tipográficos) + integración Supabase.
 *
 * REGLA ESTRICTA DE SEGURIDAD BANCARIA:
 * Nunca incluir ni revelar la cuenta CLABE en el chat público; la CLABE oficial
 * aparece únicamente dentro del contrato formal emitido al cliente.
 */

export const BOT_SERVICE_OPTIONS = [
  'Desarrollo Web & SaaS',
  'Auditoría de Ciberseguridad',
  'Infraestructura y Nube',
  'Soporte Técnico',
] as const;

export type BotServiceOption = (typeof BOT_SERVICE_OPTIONS)[number];

export type BotFlowStep =
  | 'idle'
  | 'onboarding_name'
  | 'onboarding_company'
  | 'onboarding_email'
  | 'onboarding_service'
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
  type: 'lead_accepted' | 'lead_registered' | 'ticket_resolved' | 'ticket_escalated';
  title: string;
  subtitle: string;
  folio: string;
  details: { label: string; value: string }[];
  ctaLabel?: string;
  ctaAction?: 'open_portal' | 'new_project' | 'reset';
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
  quickReplies?: BotQuickReply[];
  confirmationCard?: BotConfirmationCard;
  actionTriggered?: string;
}

export interface BotSessionState {
  sessionId: string;
  step: BotFlowStep;
  userEmail?: string;
  userId?: string | null;
  onboarding: {
    clientName: string;
    companyName: string;
    email: string;
    serviceType: string;
  };
  support: {
    topic: SupportTopicKey;
    categoryLabel: string;
    subject: string;
    resolutionSummary: string;
    escalationEmail: string;
  };
}

// ============================================================================
// CLAVES DE ALMACENAMIENTO LOCAL (Sincronización y respaldo offline)
// ============================================================================
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

/**
 * Normaliza texto en español: minúsculas, remueve acentos (á, é, í, ó, ú, ü),
 * convierte ñ -> n y limpia puntuación redundante.
 */
export function normalizeSpanishText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@._&\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Distancia de Levenshtein ligera para coincidencia difusa de palabras clave en español.
 */
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

/**
 * Verifica si el texto coincide exacta o difusamente con una lista de frases/palabras clave.
 */
export function matchesFuzzyKeywords(rawText: string, keywords: string[]): boolean {
  const normalized = normalizeSpanishText(rawText);
  if (!normalized) return false;

  const tokens = normalized.split(' ').filter((t) => t.length >= 2);

  for (const rawKw of keywords) {
    const kw = normalizeSpanishText(rawKw);
    if (!kw) continue;

    // 1. Subcadena directa (ideal para frases de 2+ palabras)
    if (normalized.includes(kw)) return true;

    // 2. Coincidencia difusa por token para palabras individuales >= 4 letras
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
    // Fallback a almacenamiento local
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
// PERSISTENCIA EN SUPABASE + RESPALDO LOCAL (LEADS, TICKETS Y LOGS DE CHAT)
// ============================================================================

function getEstimatedBudgetForService(serviceType: string): string {
  const norm = normalizeSpanishText(serviceType);
  if (norm.includes('web') || norm.includes('saas')) return '$140,000 - $280,000 MXN';
  if (norm.includes('auditoria') || norm.includes('ciberseguridad')) return '$120,000 - $260,000 MXN';
  if (norm.includes('infraestructura') || norm.includes('nube')) return '$160,000 - $340,000 MXN';
  return '$45,000 - $95,000 MXN / mensual';
}

export function mapServiceTypeToContractServices(serviceType: string): string[] {
  const norm = normalizeSpanishText(serviceType);
  if (norm.includes('web') || norm.includes('saas')) return ['webapp_dev', 'cloud_arch'];
  if (norm.includes('auditoria') || norm.includes('ciberseguridad')) return ['soc2_audit', 'pentest_offensive'];
  if (norm.includes('infraestructura') || norm.includes('nube')) return ['cloud_arch', 'zero_trust'];
  if (norm.includes('soporte')) return ['cloud_arch', 'zero_trust'];
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
    const next = [...existing.slice(-249), localRecord];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
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
  serviceType: string;
  sessionId: string;
}): Promise<{ record: CrmLeadRecord; autoAccepted: boolean; syncedRemote: boolean }> {
  const autoAcceptEnabled = await fetchAutoAcceptSetting();
  const status: CrmLeadStatus = autoAcceptEnabled ? 'Aceptado Automáticamente' : 'Nuevo';
  const estimatedBudget = getEstimatedBudgetForService(params.serviceType);
  const botNotes = autoAcceptEnabled
    ? `Cliente validado y aceptado automáticamente por Asistente Ejecutivo MRCA (Costo $0 MXN). Servicio solicitado: ${params.serviceType}. Listo para generación de contrato y acceso al portal.`
    : `Solicitud registrada vía Asistente Ejecutivo MRCA con Auto-Aceptación pausada por Superadmin. Servicio: ${params.serviceType}. Pendiente de revisión ejecutiva.`;

  const fallbackId = `LEAD-${Date.now().toString().slice(-6)}`;
  let finalRecord: CrmLeadRecord = {
    id: fallbackId,
    client_name: params.clientName.trim(),
    company_name: params.companyName.trim(),
    email: params.email.trim().toLowerCase(),
    service_type: params.serviceType,
    estimated_budget: estimatedBudget,
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
        estimated_budget: finalRecord.estimated_budget,
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
// BASE DE CONOCIMIENTO DE SOPORTE NIVEL 1 (100% ESPAÑOL CORPORATIVO)
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
      'Para ingresar sin contratiempos a tu Portal de Clientes sigue estos pasos:\n\n' +
      '1. **Consentimiento de Cookies:** Verifica haber hecho clic en **"Aceptar Cookies"** en la ventana inicial de privacidad. Sin este consentimiento, los portales corporativos permanecen protegidos.\n' +
      '2. **Verificación de Credenciales:** Confirma que estás usando el correo electrónico corporativo registrado (sin espacios al inicio o al final).\n' +
      '3. **Restablecer Contraseña:** Si olvidaste tu clave, abre **Portal Clientes → Iniciar Sesión** y selecciona la opción de recuperación de acceso para recibir un enlace seguro en tu correo.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se guiaron pasos de validación de Cookie Gate, revisión de credenciales corporativas y recuperación de contraseña.',
  },
  firmas_contratos: {
    categoryLabel: 'Firmas de Contratos',
    subject: 'Guía de firma digital y carga de contrato PDF firmado',
    response:
      'En MRCA Solutions contamos con dos modalidades con plena validez para firmar tu contrato desde el Portal de Clientes:\n\n' +
      '1. **Firma Digital en Pantalla (Lienzo Interactivo):** Abre tu contrato pendiente, traza tu firma directamente en el recuadro de firma digital y presiona **"Sellar y Firmar Contrato"** para generar su constancia con integridad SHA-256 al instante.\n' +
      '2. **Firma Física (Descargar / Subir PDF Firmado):** Si prefieres firma autógrafa, descarga el documento oficial en PDF, fírmalo e imprímelo/escanéalo y súbelo en la pestaña **"Subir Contrato Firmado (PDF)"** para notificación inmediata a nuestro equipo legal.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se explicó el uso del Lienzo de Firma Digital criptográfica y el flujo alternativo de Descargar/Subir PDF firmado.',
  },
  pagos_facturacion: {
    categoryLabel: 'Pagos y Facturación',
    subject: 'Consulta sobre CFDI 4.0, Obra por Encargo y reglas de anticipo SPEI',
    response:
      'Aquí tienes el resumen oficial de nuestras políticas fiscales, legales y de pago empresarial:\n\n' +
      '• **Facturación CFDI 4.0 (SAT):** Emitimos factura electrónica CFDI 4.0 conforme a los lineamientos vigentes del SAT, acompañada de entregables mensuales que acreditan la materialidad fiscal del servicio.\n' +
      '• **Propiedad Intelectual (Obra por Encargo — LFDA):** Todo desarrollo se formaliza bajo la figura de *Obra por Encargo* (Art. 83 y 84 LFDA), cediendo de forma exclusiva los derechos patrimoniales al cliente.\n' +
      '• **Reglas de Anticipo SPEI:** Los proyectos estándar inician con un **25% de anticipo** y los proyectos de alto alcance o alta complejidad con un **40% de anticipo** mediante transferencia electrónica **SPEI**.\n' +
      '• **Seguridad Bancaria:** Por protección financiera, nuestra cuenta CLABE oficial nunca se comparte en chats públicos; aparecerá únicamente dentro de tu **contrato formal emitido** en el portal.\n\n' +
      '¿Esto resolvió tu problema?',
    resolutionSummary:
      'Se detallaron lineamientos de facturación CFDI 4.0 (SAT), propiedad intelectual Obra por Encargo (LFDA) y reglas de anticipo SPEI 25%/40% sin exponer datos bancarios.',
  },
};

const RESOLUTION_QUICK_REPLIES: BotQuickReply[] = [
  { label: '✅ Sí, problema resuelto', value: '__RESOLVE_YES__', variant: 'success' },
  { label: '👤 No, necesito un especialista', value: '__RESOLVE_NO__', variant: 'warning' },
];

export const SERVICE_QUICK_REPLIES: BotQuickReply[] = [
  { label: '💻 Desarrollo Web & SaaS', value: 'Desarrollo Web & SaaS', variant: 'primary' },
  { label: '🛡️ Auditoría de Ciberseguridad', value: 'Auditoría de Ciberseguridad', variant: 'primary' },
  { label: '☁️ Infraestructura y Nube', value: 'Infraestructura y Nube', variant: 'primary' },
  { label: '🛠️ Soporte Técnico', value: 'Soporte Técnico', variant: 'primary' },
];

export const SUPPORT_TREE_QUICK_REPLIES: BotQuickReply[] = [
  { label: '🔐 Acceso y Cookies', value: '__SUPPORT_ACCESO__' },
  { label: '✍️ Firmas de Contratos', value: '__SUPPORT_FIRMAS__' },
  { label: '🧾 Pagos y Facturación', value: '__SUPPORT_PAGOS__' },
  { label: '👤 Escalar a Especialista', value: '__START_ESCALATION__', variant: 'warning' },
];

// ============================================================================
// ESTADO INICIAL Y PROCESADOR CONVERSACIONAL PRINCIPAL
// ============================================================================

export function createInitialBotSession(userEmail?: string, userId?: string | null): BotSessionState {
  const sessionId = `mrca_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    sessionId,
    step: 'idle',
    userEmail,
    userId: userId || null,
    onboarding: {
      clientName: '',
      companyName: '',
      email: userEmail || '',
      serviceType: '',
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

export function createWelcomeMessage(scope: 'public' | 'client' | 'admin' = 'public'): BotMessageItem {
  const greeting =
    scope === 'admin'
      ? '¡Hola! Soy el **Asistente Ejecutivo MRCA** (Modo Consola CRM). Puedes probar aquí el flujo de auto-aceptación de clientes, soporte Nivel 1 o escalaciones con costo operativo **$0 MXN**.'
      : scope === 'client'
      ? '¡Bienvenido a tu Portal Corporativo! Soy el **Asistente Ejecutivo MRCA**. Puedo ayudarte al instante con firmas de contratos, facturación CFDI 4.0, acceso al portal o iniciar un nuevo proyecto.'
      : '¡Hola! Bienvenido a **MRCA Solutions**. Soy tu Asistente Ejecutivo Automatizado. Puedo **aceptar e iniciar tu proyecto en menos de 1 minuto** o resolver tus dudas de acceso, contratos y facturación al instante.';

  return {
    id: `bot_welcome_${Date.now()}`,
    sender: 'bot',
    text: greeting,
    timestamp: formatNowTime(),
    quickReplies: [
      { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
      { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
      { label: '📄 Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
    ],
  };
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function matchServiceSelection(input: string): BotServiceOption | null {
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
  if (matchesFuzzyKeywords(norm, ['soporte', 'mantenimiento', 'tecnico', 'mesa de ayuda', 'asistencia', 'monitoreo'])) {
    return 'Soporte Técnico';
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
      'precio',
      'costo',
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

/**
 * Procesa una entrada del usuario (texto libre o botón de respuesta rápida),
 * actualiza la máquina de estados, ejecuta inserciones en Supabase si corresponde
 * y devuelve la respuesta ejecutiva del asistente.
 */
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
    onboarding: { ...state.onboarding },
    support: { ...state.support },
  };

  // Registrar mensaje del usuario en bot_chat_logs (una sola vez por turno)
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
  // 1. ACCIONES RÁPIDAS GLOBALES (Interrumpen cualquier flujo con elegancia)
  // ==========================================================================

  if (
    trimmed === '__CANCEL__' ||
    (state.step !== 'idle' &&
      matchesFuzzyKeywords(trimmed, ['cancelar', 'reiniciar', 'menu principal', 'volver al inicio', 'salir']))
  ) {
    nextState.step = 'idle';
    return makeReply(
      'Perfecto, regresamos al menú principal. ¿En qué podemos apoyar hoy a tu empresa?',
      {
        actionTriggered: 'flow_cancelled',
        quickReplies: [
          { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
          { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
          { label: '📄 Dudas de Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
          { label: '👤 Hablar con Soporte', value: '__START_ESCALATION__' },
        ],
      }
    );
  }

  if (trimmed === '__START_PROJECT__') {
    nextState.step = 'onboarding_name';
    nextState.onboarding = {
      clientName: '',
      companyName: '',
      email: nextState.userEmail || '',
      serviceType: '',
    };
    return makeReply(
      '¡Excelente decisión! Activaremos tu **registro automático de proyecto** en 4 breves pasos para darte alta inmediata en nuestro CRM.\n\n**Paso 1 de 4:** ¿Cuál es tu **nombre completo**?',
      {
        actionTriggered: 'start_onboarding_flow',
        quickReplies: [{ label: 'Cancelar proceso', value: '__CANCEL__' }],
      }
    );
  }

  if (trimmed === '__START_SUPPORT__') {
    nextState.step = 'support_menu';
    return makeReply(
      'Con gusto te ayudo a resolverlo al instante. Selecciona el tema relacionado con tu consulta o escribe brevemente qué necesitas:',
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
      description: `Consulta atendida en autoservicio Nivel 1 (${nextState.support.categoryLabel}). El usuario confirmó resolución inmediata.`,
      priority: 'Baja',
      status: 'Resuelto por Bot',
      botResolution: nextState.support.resolutionSummary || 'Resuelto al instante mediante guía interactiva MRCA.',
      sessionId: nextState.sessionId,
    });

    nextState.step = 'idle';
    return makeReply(
      '¡Excelente noticia! Hemos registrado tu caso como resuelto automáticamente para nuestro control de calidad. ¿Hay algo más en lo que pueda ayudarte hoy?',
      {
        actionTriggered: 'ticket_resolved_by_bot',
        badge: {
          text: '🛠️ Caso Resuelto al Instante',
          tone: 'emerald',
        },
        confirmationCard: {
          type: 'ticket_resolved',
          title: 'Caso Resuelto por Asistente MRCA',
          subtitle: 'Atención inmediata Nivel 1 sin tiempo de espera.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Categoría', value: nextState.support.categoryLabel },
            { label: 'Estado', value: 'Resuelto por Bot' },
            { label: 'Tiempo de solución', value: 'Inmediato (< 1 min)' },
          ],
          ctaLabel: '🚀 Iniciar un Proyecto',
          ctaAction: 'new_project',
        },
        quickReplies: [
          { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
          { label: '🛠️ Otra consulta de soporte', value: '__START_SUPPORT__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 2. FLUJO A — ONBOARDING AUTOMÁTICO (AUTO-ACEPTACIÓN DE CLIENTES)
  // ==========================================================================

  if (state.step === 'onboarding_name') {
    if (trimmed.length < 2) {
      return makeReply('Por favor escribe tu **nombre completo** (mínimo 2 caracteres) para continuar con tu alta:', {
        actionTriggered: 'onboarding_name_invalid',
      });
    }
    nextState.onboarding.clientName = trimmed;
    nextState.step = 'onboarding_company';
    return makeReply(
      `Mucho gusto, **${trimmed}**.\n\n**Paso 2 de 4:** ¿Cuál es el **nombre de tu empresa o negocio**?`,
      {
        actionTriggered: 'onboarding_name_captured',
        quickReplies: [{ label: 'Cancelar proceso', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'onboarding_company') {
    if (trimmed.length < 2) {
      return makeReply('Por favor indícame el **nombre de tu empresa o negocio** para registrar tu cuenta:', {
        actionTriggered: 'onboarding_company_invalid',
      });
    }
    nextState.onboarding.companyName = trimmed;
    nextState.step = 'onboarding_email';
    return makeReply(
      `Perfecto, registramos **${trimmed}**.\n\n**Paso 3 de 4:** ¿Cuál es tu **correo electrónico corporativo** para enviarte el seguimiento y habilitar tu acceso?`,
      {
        actionTriggered: 'onboarding_company_captured',
        quickReplies: nextState.userEmail
          ? [
              { label: `Usar ${nextState.userEmail}`, value: nextState.userEmail, variant: 'primary' },
              { label: 'Cancelar proceso', value: '__CANCEL__' },
            ]
          : [{ label: 'Cancelar proceso', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'onboarding_email') {
    if (!isValidEmail(trimmed)) {
      return makeReply(
        'Ese formato de correo no parece válido. Por favor ingresa un correo electrónico correcto (ejemplo: `nombre@tuempresa.com`):',
        {
          actionTriggered: 'onboarding_email_invalid',
          quickReplies: [{ label: 'Cancelar proceso', value: '__CANCEL__' }],
        }
      );
    }
    nextState.onboarding.email = trimmed.toLowerCase();
    nextState.userEmail = trimmed.toLowerCase();
    nextState.step = 'onboarding_service';
    return makeReply(
      `Correo verificado (**${nextState.onboarding.email}**).\n\n**Paso 4 de 4:** Selecciona el **servicio principal** que requiere tu empresa:`,
      {
        actionTriggered: 'onboarding_email_captured',
        quickReplies: SERVICE_QUICK_REPLIES,
      }
    );
  }

  if (state.step === 'onboarding_service') {
    const matchedService = matchServiceSelection(trimmed);
    if (!matchedService) {
      return makeReply(
        'Por favor selecciona una de nuestras 4 soluciones empresariales para completar tu solicitud:',
        {
          actionTriggered: 'onboarding_service_retry',
          quickReplies: SERVICE_QUICK_REPLIES,
        }
      );
    }

    nextState.onboarding.serviceType = matchedService;
    const { record, autoAccepted } = await createAutomatedCrmLead({
      clientName: nextState.onboarding.clientName,
      companyName: nextState.onboarding.companyName,
      email: nextState.onboarding.email,
      serviceType: matchedService,
      sessionId: nextState.sessionId,
    });

    nextState.step = 'idle';

    if (autoAccepted) {
      return makeReply(
        `¡Listo, **${record.client_name}**! Tu solicitud para **${record.company_name}** ha sido **aceptada automáticamente** en nuestro CRM corporativo.\n\nYa puedes crear o acceder a tu **Portal de Clientes** para revisar tu propuesta, firmar tu contrato y dar seguimiento en tiempo real.`,
        {
          actionTriggered: 'crm_lead_auto_accepted',
          badge: {
            text: '✅ Solicitud Aceptada Automáticamente',
            tone: 'emerald',
          },
          confirmationCard: {
            type: 'lead_accepted',
            title: 'Alta Automática Confirmada en CRM',
            subtitle: 'Tu cuenta está pre-autorizada para continuar en el Portal de Clientes.',
            folio: record.id.slice(0, 12).toUpperCase(),
            details: [
              { label: 'Cliente', value: record.client_name },
              { label: 'Empresa', value: record.company_name },
              { label: 'Servicio', value: record.service_type },
              { label: 'Estado', value: 'Aceptado Automáticamente' },
            ],
            ctaLabel: 'Acceder / Crear Portal de Clientes →',
            ctaAction: 'open_portal',
          },
          quickReplies: [
            { label: '📄 Dudas de Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
            { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
          ],
        }
      );
    }

    return makeReply(
      `¡Gracias, **${record.client_name}**! Registramos tu solicitud para **${record.company_name}** en nuestro CRM corporativo. Nuestro equipo directivo revisará el alcance y se pondrá en contacto contigo muy pronto.`,
      {
        actionTriggered: 'crm_lead_registered_manual_review',
        badge: {
          text: '📋 Solicitud Registrada en CRM',
          tone: 'cyan',
        },
        confirmationCard: {
          type: 'lead_registered',
          title: 'Solicitud Registrada para Revisión Ejecutiva',
          subtitle: 'La auto-aceptación se encuentra en modo de revisión manual por dirección.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Cliente', value: record.client_name },
            { label: 'Empresa', value: record.company_name },
            { label: 'Servicio', value: record.service_type },
            { label: 'Estado', value: 'Nuevo (En revisión)' },
          ],
          ctaLabel: 'Ir al Portal de Clientes →',
          ctaAction: 'open_portal',
        },
        quickReplies: [
          { label: '📄 Dudas de Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
          { label: '👤 Hablar con Soporte', value: '__START_ESCALATION__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 3. FLUJO B — CONFIRMACIÓN DE RESOLUCIÓN Y ESCALACIÓN A HUMANO
  // ==========================================================================

  if (state.step === 'support_resolution_check') {
    if (matchesFuzzyKeywords(trimmed, ['si', 'resuelto', 'funciono', 'listo', 'gracias', 'perfecto', 'excelente', 'solucionado'])) {
      return processBotTurn('__RESOLVE_YES__', nextState, trimmed, true);
    }
    if (matchesFuzzyKeywords(trimmed, ['no', 'especialista', 'humano', 'agente', 'ayuda', 'sigue igual', 'no funciono', 'todavia'])) {
      return processBotTurn('__RESOLVE_NO__', nextState, trimmed, true);
    }
    // Si pregunta sobre otro tema directamente, detectarlo sin trabar al usuario
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
    return makeReply('Para cerrar o escalar correctamente tu caso, dime por favor: **¿Esto resolvió tu problema?**', {
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
      `Gracias. Ahora escribe un **breve resumen de tu situación o problema** para enviarlo directamente a nuestro especialista de guardia:`,
      {
        actionTriggered: 'escalation_email_captured',
        quickReplies: [{ label: 'Cancelar', value: '__CANCEL__' }],
      }
    );
  }

  if (state.step === 'escalation_summary') {
    if (trimmed.length < 5) {
      return makeReply('Por favor compárteme un poco más de detalle (al menos 5 caracteres) para que el especialista pueda ayudarte rápido:', {
        actionTriggered: 'escalation_summary_short',
      });
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
      botResolution: 'Escalado a especialista humano con alerta de correo corporativo.',
      sessionId: nextState.sessionId,
    });

    // Disparar alerta de correo a solutionsmrca83@gmail.com reutilizando emailNotification.ts
    await sendSupportEscalationEmailNotification({
      ticketId: record.id,
      clientEmail: record.client_email,
      category: record.category,
      subject: record.subject,
      description: record.description,
      priority: String(record.priority),
      sessionId: nextState.sessionId,
    });

    nextState.step = 'idle';
    return makeReply(
      `Tu caso ha sido **escalado con prioridad ${priority}** a nuestro equipo especialista y hemos enviado una alerta directa a dirección de soporte (**solutionsmrca83@gmail.com**).\n\nRecibirás respuesta en **${record.client_email}** a la brevedad.`,
      {
        actionTriggered: 'ticket_escalated_to_human',
        badge: {
          text: '📨 Escalado a Especialista (CISO)',
          tone: 'amber',
        },
        confirmationCard: {
          type: 'ticket_escalated',
          title: 'Ticket Escalado a Especialista Humano',
          subtitle: 'Notificación corporativa enviada al equipo de atención prioritaria.',
          folio: record.id.slice(0, 12).toUpperCase(),
          details: [
            { label: 'Correo de respuesta', value: record.client_email },
            { label: 'Prioridad', value: String(record.priority) },
            { label: 'Estado', value: 'Escalado a Humano' },
          ],
          ctaLabel: 'Volver al Menú Principal',
          ctaAction: 'reset',
        },
        quickReplies: [
          { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
          { label: '🛠️ Otra consulta', value: '__START_SUPPORT__' },
        ],
      }
    );
  }

  // ==========================================================================
  // 4. DETECCIÓN INTELIGENTE DE INTENCIONES (IDLE O MENÚ DE SOPORTE)
  // ==========================================================================

  // A) Intención de iniciar proyecto / cotizar / contratar / onboarding
  if (
    matchesFuzzyKeywords(trimmed, [
      'iniciar proyecto',
      'comenzar proyecto',
      'nuevo proyecto',
      'cotizar',
      'cotizacion',
      'presupuesto',
      'contratar',
      'quiero contratar',
      'servicios',
      'desarrollo web',
      'saas',
      'auditoria',
      'ciberseguridad',
      'infraestructura',
      'nube',
      'consultoria',
      'proyecto',
    ])
  ) {
    return processBotTurn('__START_PROJECT__', nextState, trimmed, true);
  }

  // B) Intención específica de Soporte Nivel 1 (Acceso, Firmas o Pagos/Facturación)
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

  // C) Intención de hablar con humano / soporte directo
  if (
    matchesFuzzyKeywords(trimmed, [
      'hablar con soporte',
      'humano',
      'persona',
      'especialista',
      'asesor',
      'ejecutivo',
      'contacto',
      'correo',
      'llamar',
      'urgente',
      'emergencia',
    ])
  ) {
    return processBotTurn('__START_ESCALATION__', nextState, trimmed, true);
  }

  // D) Intención general de soporte / problema / error
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

  // E) Saludos cordiales
  if (matchesFuzzyKeywords(trimmed, ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'hey'])) {
    return makeReply(
      '¡Hola! Qué gusto saludarte. Estoy listo para ayudarte al instante a iniciar un proyecto empresarial o resolver cualquier duda sobre accesos, contratos o facturación. ¿Qué te gustaría hacer?',
      {
        actionTriggered: 'greeting_reply',
        quickReplies: [
          { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
          { label: '🛠️ Resolver un Problema', value: '__START_SUPPORT__' },
          { label: '📄 Dudas de Contratos y Facturación', value: '__SUPPORT_PAGOS__' },
          { label: '👤 Hablar con Soporte', value: '__START_ESCALATION__' },
        ],
      }
    );
  }

  // F) Respuesta ejecutiva guiada por defecto (sin callejones sin salida)
  return makeReply(
    'Gracias por escribirnos. Para atenderte con precisión y sin esperas, selecciona una de las siguientes opciones rápidas o cuéntame si buscas **iniciar un proyecto**, resolver un tema de **acceso/cookies**, **firmas de contratos** o **facturación CFDI 4.0 / SPEI**:',
    {
      actionTriggered: 'fallback_guided_menu',
      quickReplies: [
        { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
        { label: '🔐 Acceso y Cookies', value: '__SUPPORT_ACCESO__' },
        { label: '✍️ Firmas de Contratos', value: '__SUPPORT_FIRMAS__' },
        { label: '🧾 Pagos y Facturación', value: '__SUPPORT_PAGOS__' },
        { label: '👤 Hablar con Soporte', value: '__START_ESCALATION__', variant: 'warning' },
      ],
    }
  );
}
