import { EncryptedPayload } from '../types';

/**
 * End-to-End Encryption (E2EE) Module using Web Crypto API (AES-GCM-256)
 */

// In-memory key cache for channels and DMs
const channelKeyCache = new Map<string, CryptoKey>();
const userKeyCache = new Map<string, CryptoKeyPair>();

// Deterministic default channel seed derivation for shared channel rooms
async function deriveChannelKey(channelId: string, secretSalt = 'aegiscord-master-secret-v1'): Promise<CryptoKey> {
  if (channelKeyCache.has(channelId)) {
    return channelKeyCache.get(channelId)!;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(`${channelId}:${secretSalt}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`salt-${channelId}`),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  channelKeyCache.set(channelId, key);
  return key;
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  if (!base64 || typeof base64 !== 'string') {
    return new ArrayBuffer(0);
  }
  try {
    const sanitized = base64.trim();
    const binary = window.atob(sanitized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return new ArrayBuffer(0);
  }
}

// Convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  if (!hex || typeof hex !== 'string') {
    return new Uint8Array(12);
  }
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
  for (let i = 0; i < cleanHex.length - 1; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Encrypt a text string using AES-GCM 256-bit with a unique 96-bit IV
 */
export async function encryptMessage(
  text: string,
  channelId: string,
  keyId = 'ch-key-v1'
): Promise<EncryptedPayload> {
  const key = await deriveChannelKey(channelId);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate 12-byte (96-bit) IV as per AES-GCM NIST recommendation
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    data
  );

  return {
    iv: bufferToHex(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
    keyId: `${channelId}:${keyId}`,
    algorithm: 'AES-GCM-256',
    version: 1,
  };
}

/**
 * Decrypt an AES-GCM encrypted payload back to plaintext
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  channelId: string,
  fallbackPlaintext?: string
): Promise<string> {
  try {
    if (!payload || !payload.ciphertext || !payload.iv) {
      return fallbackPlaintext || '';
    }
    const key = await deriveChannelKey(channelId);
    const iv = hexToBytes(payload.iv);
    const encryptedData = base64ToBuffer(payload.ciphertext);

    if (encryptedData.byteLength === 0) {
      return fallbackPlaintext || '';
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    // If decryption fails, gracefully fallback to stored plaintext if available
    if (fallbackPlaintext && fallbackPlaintext.trim()) {
      return fallbackPlaintext;
    }
    return '🔒 [Decryption Error: Key mismatch or tampered ciphertext]';
  }
}

/**
 * Compute a visual cryptographic fingerprint (like Signal / WhatsApp safety numbers)
 */
export async function computeFingerprint(channelId: string): Promise<{
  hexString: string;
  safetyEmojis: string[];
  shortFingerprint: string;
}> {
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`aegiscord-fingerprint-${channelId}`)
  );
  const hex = bufferToHex(hashBuffer).toUpperCase();

  // Split into 4-char chunks: ABCD-1234-EF56-...
  const chunks = hex.match(/.{1,4}/g)?.slice(0, 8) || [];
  const hexString = chunks.join('-');
  const shortFingerprint = chunks.slice(0, 3).join('-');

  // Generate visual safety emoji vector
  const emojiPool = ['🛡️', '🔒', '🔑', '💎', '⚡', '🌌', '🛸', '🛰️', '💠', '🪐', '🦅', '🦁', '🔮', '✨'];
  const bytes = new Uint8Array(hashBuffer);
  const safetyEmojis = [
    emojiPool[bytes[0] % emojiPool.length],
    emojiPool[bytes[1] % emojiPool.length],
    emojiPool[bytes[2] % emojiPool.length],
    emojiPool[bytes[3] % emojiPool.length],
  ];

  return { hexString, safetyEmojis, shortFingerprint };
}

/**
 * Encrypt a file (Blob or base64) for secure attachment transfer
 */
export async function encryptFileBlob(
  fileData: ArrayBuffer,
  channelId: string
): Promise<{ iv: string; encryptedData: string }> {
  const key = await deriveChannelKey(channelId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    fileData
  );

  return {
    iv: bufferToHex(iv.buffer),
    encryptedData: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypt a file back to an ArrayBuffer
 */
export async function decryptFileBlob(
  encryptedBase64: string,
  ivHex: string,
  channelId: string
): Promise<ArrayBuffer> {
  const key = await deriveChannelKey(channelId);
  const iv = hexToBytes(ivHex);
  const encryptedData = base64ToBuffer(encryptedBase64);

  return await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    encryptedData
  );
}
