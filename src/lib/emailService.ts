import emailjs from '@emailjs/browser';

/**
 * MRCA SOLUTIONS — SERVICIO DE ALERTAS EMAILJS (@emailjs/browser)
 * Configura IDs reales de producción con soporte de sobrescritura por variables `.env`.
 * Si `VITE_EMAILJS_PUBLIC_KEY` no está configurada, falla silenciosamente con una
 * advertencia limpia sin PII para jamás interrumpir cargas de contratos, leads o tickets.
 */

export const SERVICE_ID = (
  import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_38j2b4f'
).trim();

export const ADMIN_ALERT_TEMPLATE_ID = (
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_5bps8lp'
).trim();

export const CLIENT_CONFIRM_TEMPLATE_ID = (
  import.meta.env.VITE_EMAILJS_CLIENT_TEMPLATE_ID || 'template_glxda7e'
).trim();

export const PUBLIC_KEY = (
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
).trim();

export type AdminAlertEventType =
  | 'CONTRATO FIRMADO SUBIDO'
  | 'TICKET ESCALADO POR BOT'
  | 'NUEVO CLIENTE ACEPTADO EN CRM';

export interface AdminAlertParams {
  event_type: AdminAlertEventType;
  client_name: string;
  company_name: string;
  client_email: string;
  message: string;
}

export interface ClientConfirmationParams {
  client_name: string;
  company_name: string;
  client_email: string;
  service_type: string;
  estimated_budget?: string;
  message?: string;
}

export interface EmailSendResult {
  success: boolean;
  skipped?: boolean;
  message: string;
}

function getMexicoCityTimestamp(): string {
  return new Date().toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
  });
}

/**
 * Envía una alerta inmediata al correo administrativo configurado en EmailJS (`template_5bps8lp`).
 * Pasa estrictamente las llaves: event_type, client_name, company_name, client_email, message, timestamp.
 */
export async function sendAdminAlert(params: AdminAlertParams): Promise<EmailSendResult> {
  if (!PUBLIC_KEY) {
    console.warn(
      '[MRCA EmailJS] VITE_EMAILJS_PUBLIC_KEY no configurada; alerta administrativa omitida sin interrumpir el flujo.'
    );
    return {
      success: false,
      skipped: true,
      message: 'Alerta omitida por falta de VITE_EMAILJS_PUBLIC_KEY.',
    };
  }

  const templateParams = {
    event_type: params.event_type,
    client_name: params.client_name,
    company_name: params.company_name,
    client_email: params.client_email,
    message: params.message,
    timestamp: getMexicoCityTimestamp(),
  };

  try {
    await emailjs.send(SERVICE_ID, ADMIN_ALERT_TEMPLATE_ID, templateParams, {
      publicKey: PUBLIC_KEY,
    });
    return {
      success: true,
      message: 'Alerta administrativa enviada exitosamente vía EmailJS.',
    };
  } catch {
    console.warn(
      '[MRCA EmailJS] No fue posible entregar la alerta administrativa; la operación principal continúa normalmente.'
    );
    return {
      success: false,
      message: 'Envío de alerta administrativa no completado.',
    };
  }
}

/**
 * Envía un correo opcional de confirmación al cliente usando `template_glxda7e`,
 * protegido con try/catch para que nunca falle la experiencia de usuario.
 */
export async function sendClientConfirmationEmail(
  params: ClientConfirmationParams
): Promise<EmailSendResult> {
  if (!PUBLIC_KEY) {
    return {
      success: false,
      skipped: true,
      message: 'Confirmación al cliente omitida por falta de VITE_EMAILJS_PUBLIC_KEY.',
    };
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      CLIENT_CONFIRM_TEMPLATE_ID,
      {
        to_email: params.client_email,
        client_name: params.client_name,
        company_name: params.company_name,
        client_email: params.client_email,
        service_type: params.service_type,
        estimated_budget: params.estimated_budget || 'Por definir en consultoría',
        message:
          params.message ||
          `Confirmamos el registro automático de tu proyecto (${params.service_type}) para ${params.company_name} en MRCA Solutions.`,
        timestamp: getMexicoCityTimestamp(),
      },
      {
        publicKey: PUBLIC_KEY,
      }
    );
    return {
      success: true,
      message: 'Correo de confirmación enviado al cliente.',
    };
  } catch {
    console.warn(
      '[MRCA EmailJS] No fue posible entregar el correo de confirmación al cliente; el registro en CRM permanece guardado.'
    );
    return {
      success: false,
      message: 'Confirmación al cliente omitida.',
    };
  }
}
