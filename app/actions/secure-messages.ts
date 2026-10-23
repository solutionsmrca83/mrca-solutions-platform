'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { encryptData, decryptData } from '@/lib/encryption';
import type { SecureMessage } from '@/src/types';

export interface SendMessageInput {
  subject: string;
  payload: string; // Sensitive data: server IP, API token, incident report, DB config
  category?: 'critical' | 'high' | 'normal' | 'audit';
  clientCompany?: string;
  recipientId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  receiptHash?: string;
  error?: string;
  timestamp: string;
}

/**
 * ==============================================================================
 * SERVER ACTION: Send Secure Encrypted Message
 * ==============================================================================
 *
 * Enforces End-to-End Enterprise Data Confidentiality:
 * 1. Verifies authentic caller session via Supabase cookies.
 * 2. Encrypts sensitive subject and data payload using AES-256-CBC.
 * 3. Persists record in 'secure_messages' table governed by PostgreSQL RLS.
 */
export async function sendSecureMessage(
  input: SendMessageInput
): Promise<SendMessageResponse> {
  const timestamp = new Date().toISOString();

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'ZERO-TRUST ERROR: Se requiere una sesión válida de Supabase para enviar mensajes cifrados.',
        timestamp,
      };
    }

    if (!input.subject?.trim() || !input.payload?.trim()) {
      return {
        success: false,
        error: 'VALIDATION ERROR: Asunto y contenido son requeridos.',
        timestamp,
      };
    }

    // 2. Perform AES-256-CBC Encryption on Server
    const encryptedSubject = encryptData(input.subject.trim());
    const encryptedPayload = encryptData(input.payload.trim());

    // Generate SHA-256 payload integrity seal (receipt hash)
    const receiptHash = crypto
      .createHash('sha256')
      .update(input.payload)
      .digest('hex');

    const metadata = {
      category: input.category || 'normal',
      clientCompany: input.clientCompany || user.user_metadata?.company || 'B2B Client',
      receiptHash,
      cipherSpec: 'AES-256-CBC // PKCS#7',
      senderEmail: user.email,
      submittedAt: timestamp,
    };

    // 3. Persist encrypted payload in Supabase 'secure_messages' table
    const { data, error: insertError } = await supabase
      .from('secure_messages')
      .insert({
        sender_id: user.id,
        recipient_id: input.recipientId || null,
        encrypted_subject: encryptedSubject,
        encrypted_payload: encryptedPayload,
        metadata,
        read: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[SUPABASE RLS INSERT ERROR]', insertError);
      return {
        success: false,
        error: `Error al persistir en Supabase: ${insertError.message}`,
        timestamp,
      };
    }

    return {
      success: true,
      messageId: data.id,
      receiptHash,
      timestamp,
    };
  } catch (err: any) {
    console.error('[SECURE MESSAGE ACTION ERROR]', err);
    return {
      success: false,
      error: err.message || 'Error inesperado durante el cifrado AES-256.',
      timestamp,
    };
  }
}

/**
 * ==============================================================================
 * SERVER ACTION: Fetch & Decrypt Client's Own Secure Messages
 * ==============================================================================
 *
 * Automatically constrained by Supabase RLS: clients can strictly only query
 * rows where sender_id = auth.uid() or recipient_id = auth.uid().
 */
export async function getClientMessages(): Promise<{
  success: boolean;
  messages: Array<
    SecureMessage & { decryptedSubject: string; decryptedPayload: string }
  >;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, messages: [], error: 'Sesión no autenticada.' };
    }

    // Queries through RLS
    const { data, error } = await supabase
      .from('secure_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, messages: [], error: error.message };
    }

    // Decrypt messages securely on server before rendering to verified owner
    const decryptedList = (data || []).map((msg) => {
      let decryptedSubject = msg.encrypted_subject;
      let decryptedPayload = msg.encrypted_payload;

      try {
        decryptedSubject = decryptData(msg.encrypted_subject);
      } catch (e) {
        decryptedSubject = '[Cifrado AES-256 Protegido]';
      }

      try {
        decryptedPayload = decryptData(msg.encrypted_payload);
      } catch (e) {
        decryptedPayload = '[Cifrado AES-256 Protegido]';
      }

      return {
        ...msg,
        decryptedSubject,
        decryptedPayload,
      };
    });

    return { success: true, messages: decryptedList };
  } catch (err: any) {
    return { success: false, messages: [], error: err.message };
  }
}
