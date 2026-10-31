/**
 * @fileoverview Save file cryptographic HMAC integrity verification and canonicalization.
 * Ensures exported save JSON data cannot be tampered with or altered.
 * @module core/SaveIntegrity
 * @role Anti-Tamper & Save Integrity Manager
 */

import type { SaveData } from './SaveManager';

export const SIGNED_SAVE_FORMAT = 'CRYSTAL_OVERDRIVE_SIGNED_SAVE';
const HMAC_KEY_SECRET = 'CRYSTAL_OVERDRIVE_SAVE_INTEGRITY_SALT_V1_@JoaoBernardoVeiga';

export interface SignedSaveEnvelope {
  format: typeof SIGNED_SAVE_FORMAT;
  version: 1;
  timestamp: number;
  signature: string;
  data: SaveData;
}

export interface VerificationResult {
  valid: boolean;
  data?: SaveData;
  error?: 'MALFORMED_JSON' | 'MISSING_SIGNATURE' | 'TAMPERED_OR_INVALID_SIGNATURE' | 'PARSE_ERROR';
}

/**
 * Deterministically serializes any JavaScript object or array by sorting object keys recursively.
 * Ensures equivalent objects produce identical JSON strings regardless of key insertion order.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalize(item)).join(',') + ']';
  }
  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries: string[] = [];
  for (const key of sortedKeys) {
    const val = record[key];
    if (val !== undefined) {
      entries.push(JSON.stringify(key) + ':' + canonicalize(val));
    }
  }
  return '{' + entries.join(',') + '}';
}

let cachedHmacKey: CryptoKey | null = null;

async function getHmacKey(): Promise<CryptoKey> {
  if (cachedHmacKey) return cachedHmacKey;
  const enc = new TextEncoder();
  const keyData = enc.encode(HMAC_KEY_SECRET);
  cachedHmacKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );
  return cachedHmacKey;
}

/**
 * Computes an HMAC-SHA256 hex digest for any data object using canonical JSON representation.
 */
export async function computeHmacSignature(data: unknown): Promise<string> {
  const canonicalString = canonicalize(data);
  const enc = new TextEncoder();
  const key = await getHmacKey();
  const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(canonicalString));
  const bytes = new Uint8Array(signatureBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Performs a timing-safe comparison of the expected HMAC signature against the computed signature.
 */
export async function verifyHmacSignature(data: unknown, expectedSignature: string): Promise<boolean> {
  if (!expectedSignature || typeof expectedSignature !== 'string') {
    return false;
  }
  try {
    const computed = await computeHmacSignature(data);
    if (computed.length !== expectedSignature.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Wraps a SaveData payload in an authenticated envelope with an HMAC-SHA256 signature.
 */
export async function signSaveData(saveData: SaveData): Promise<SignedSaveEnvelope> {
  const signature = await computeHmacSignature(saveData);
  return {
    format: SIGNED_SAVE_FORMAT,
    version: 1,
    timestamp: Date.now(),
    signature,
    data: saveData,
  };
}

/**
 * Verifies that a raw JSON string represents an authentic, unaltered SignedSaveEnvelope.
 * Returns the inner SaveData if verification passes, or an error classification if invalid/altered.
 */
export async function verifySaveEnvelope(rawJson: string): Promise<VerificationResult> {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'MALFORMED_JSON' };
    }
    if (parsed.format !== SIGNED_SAVE_FORMAT || typeof parsed.signature !== 'string' || !parsed.data) {
      return { valid: false, error: 'MISSING_SIGNATURE' };
    }
    const isValid = await verifyHmacSignature(parsed.data, parsed.signature);
    if (!isValid) {
      return { valid: false, error: 'TAMPERED_OR_INVALID_SIGNATURE' };
    }
    return { valid: true, data: parsed.data as SaveData };
  } catch {
    return { valid: false, error: 'PARSE_ERROR' };
  }
}
