/**
 * 4Nav Credentials Vault - Cryptographic Engine
 * PBKDF2 (SHA-256) with 100,000 iterations & individual cryptographic salt
 * Complies with OWASP & NIST SP 800-132 password hashing guidelines.
 */

export interface VaultCredential {
  id: string;
  title: string;
  username: string;
  password: string;
  slot?: number; // 1, 2, 3, 4
  url?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSecurityConfig {
  hasPin: boolean;
  pinHash?: string;
  salt?: string;
  iterations: number;
}

const STORAGE_KEY_CREDS = '4nav_vault_credentials';
const STORAGE_KEY_CONFIG = '4nav_vault_security_config';
const DEFAULT_ITERATIONS = 100000;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Derives a PBKDF2 SHA-256 hash (256-bit) with 100,000 iterations.
 */
export async function derivePinHash(pin: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const salt = hexToUint8Array(saltHex);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    pinData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: DEFAULT_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

/**
 * Generates a cryptographically secure random 16-byte salt in hex.
 */
export function generateCryptographicSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Loads current vault security configuration.
 */
export function getVaultSecurityConfig(): VaultSecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { hasPin: false, iterations: DEFAULT_ITERATIONS };
    const parsed = JSON.parse(raw);
    return {
      hasPin: Boolean(parsed.hasPin && parsed.pinHash && parsed.salt),
      pinHash: parsed.pinHash,
      salt: parsed.salt,
      iterations: parsed.iterations || DEFAULT_ITERATIONS,
    };
  } catch {
    return { hasPin: false, iterations: DEFAULT_ITERATIONS };
  }
}

/**
 * Configures or changes master PIN (4 to 12 digits).
 */
export async function setMasterPin(pin: string): Promise<void> {
  if (!pin || pin.length < 4 || pin.length > 12) {
    throw new Error('O PIN deve conter entre 4 e 12 caracteres.');
  }
  const salt = generateCryptographicSalt();
  const pinHash = await derivePinHash(pin, salt);

  const config: VaultSecurityConfig = {
    hasPin: true,
    pinHash,
    salt,
    iterations: DEFAULT_ITERATIONS,
  };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

/**
 * Verifies user input against saved PBKDF2 hash.
 */
export async function verifyMasterPin(inputPin: string): Promise<boolean> {
  const config = getVaultSecurityConfig();
  if (!config.hasPin || !config.pinHash || !config.salt) return true;

  const testHash = await derivePinHash(inputPin, config.salt);
  return testHash === config.pinHash;
}

/**
 * Removes master PIN protection.
 */
export function removeMasterPin(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
}

/**
 * Loads all stored credentials.
 */
export function loadVaultCredentials(): VaultCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDS);
    if (!raw) return [];
    return JSON.parse(raw) as VaultCredential[];
  } catch {
    return [];
  }
}

/**
 * Saves all credentials to storage.
 */
export function saveVaultCredentials(credentials: VaultCredential[]): void {
  localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(credentials));
}

