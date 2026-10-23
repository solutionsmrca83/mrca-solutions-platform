import crypto from 'crypto';

/**
 * Enterprise-Grade Data Encryption Module (AES-256-CBC)
 * MCRA Solutions - Zero-Trust Cryptographic Engine
 *
 * Utilized to protect high-sensitivity B2B customer assets (such as private IPs,
 * API secrets, payment gateway webhook tokens, and host configurations) prior to
 * persisting in Supabase or external storage.
 */

// 256-bit encryption key derivation (32 bytes required for AES-256-CBC)
const DEFAULT_FALLBACK_KEY = 'mcra_enterprise_sec_key_32bytes!';

function getEncryptionKey(): Buffer {
  const envKey =
    (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) ||
    (typeof process !== 'undefined' && process.env?.AES_SECRET_KEY) ||
    DEFAULT_FALLBACK_KEY;

  if (typeof envKey === 'string' && envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // Derive a deterministic 32-byte key via SHA-256 for consistent 256-bit entropy
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts arbitrary plaintext strings using AES-256-CBC with a cryptographically
 * secure random 16-byte Initialization Vector (IV).
 *
 * @param text - Sensitive plaintext string (e.g., server IP, gateway credential)
 * @returns Serialized encrypted payload string in the format "ivHex:ciphertextHex"
 */
export function encryptData(text: string): string {
  if (typeof text !== 'string') {
    throw new TypeError('Input data for encryption must be a valid string');
  }

  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Prefix with the Initialization Vector in hexadecimal
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC encrypted payload formatted as "ivHex:ciphertextHex".
 *
 * @param encryptedText - The formatted string containing the IV and ciphertext
 * @returns Decrypted original plaintext string
 */
export function decryptData(encryptedText: string): string {
  if (typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    throw new Error('Invalid encrypted payload format. Expected "iv:ciphertext" format.');
  }

  const [ivHex, cipherHex] = encryptedText.split(':');

  if (!ivHex || !cipherHex) {
    throw new Error('Malformed encrypted payload: IV or ciphertext missing');
  }

  const iv = Buffer.from(ivHex, 'hex');
  if (iv.length !== 16) {
    throw new Error(`Invalid IV length: expected 16 bytes, received ${iv.length} bytes`);
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default {
  encryptData,
  decryptData,
};
