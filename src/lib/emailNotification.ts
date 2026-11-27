import { sendAdminAlert } from './emailService';

/**
 * MRCA SOLUTIONS — ADAPTADOR COMPATIBLE DE NOTIFICACIONES DE CONTRATO Y SOPORTE
 * Delega directamente en `src/lib/emailService.ts` (@emailjs/browser) con
 * `template_5bps8lp` y llaves estrictas de producción.
 */

export interface ContractEmailPayload {
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  contractId: string;
  contractTitle?: string;
  fileName?: string;
  signatureType?: 'digital' | 'physical_pdf';
}

export interface SupportEscalationEmailPayload {
  ticketId: string;
  clientEmail: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  sessionId?: string;
}

export interface EmailNotificationResponse {
  success: boolean;
  message: string;
  targetEmail: string;
  payloadSummary: string;
}

const TARGET_NOTIFICATION_EMAIL = 'solutionsmrca83@gmail.com';

export async function sendContractSignedEmailNotification(
  params: ContractEmailPayload
): Promise<EmailNotificationResponse> {
  const modeLabel =
    params.signatureType === 'digital'
      ? 'Firma Digital Criptográfica'
      : 'Documento PDF Firmado Subido';

  const summary = `${modeLabel} — Folio ${params.contractId}${
    params.fileName ? ` (${params.fileName})` : ''
  }`;

  const result = await sendAdminAlert({
    event_type: 'CONTRATO FIRMADO SUBIDO',
    client_name: params.clientName,
    company_name: params.clientCompany || 'Empresa B2B',
    client_email: params.clientEmail || 'cliente@empresa.corp',
    message: `${summary}. Contrato: ${params.contractTitle || 'Contrato Marco de Servicios & SLA'}.`,
  });

  return {
    success: result.success,
    message: result.message,
    targetEmail: TARGET_NOTIFICATION_EMAIL,
    payloadSummary: summary,
  };
}

export async function sendSupportEscalationEmailNotification(
  params: SupportEscalationEmailPayload
): Promise<EmailNotificationResponse> {
  const summary = `[Prioridad ${params.priority}] ${params.category}: ${params.subject}`;

  const result = await sendAdminAlert({
    event_type: 'TICKET ESCALADO POR BOT',
    client_name: params.clientEmail.split('@')[0] || 'Cliente Portal',
    company_name: params.category,
    client_email: params.clientEmail,
    message: `Folio ${params.ticketId} (${params.priority}). ${params.subject} — Detalle: ${params.description}`,
  });

  return {
    success: result.success,
    message: result.message,
    targetEmail: TARGET_NOTIFICATION_EMAIL,
    payloadSummary: summary,
  };
}
