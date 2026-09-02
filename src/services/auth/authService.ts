/**
 * App lock authentication service.
 *
 * Two mechanisms, both local-only (no server):
 *
 * 1. Password — stored as SHA-256(salt + password) with a random 16-byte
 *    salt. This is a UI gate, NOT encryption. IndexedDB data remains
 *    unencrypted; the password only prevents casual access to the UI.
 *
 * 2. Biometric — WebAuthn platform authenticator (fingerprint / face).
 *    Uses `navigator.credentials.create/get` with
 *    `userVerification: 'required'` and `authenticatorAttachment: 'platform'`.
 *    Only the credential ID is stored; the OS/hardware performs the
 *    biometric verification. Available on iOS Safari 14+, Android Chrome,
 *    and Windows Edge (Windows Hello) within a secure context (HTTPS).
 *
 * All functions are safe to call in unsupported environments — they either
 * return false or throw a descriptive error that the UI can surface.
 */

import { getSettings, updateSettings } from '../settings/settingsService';

// ── Encoding helpers ────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Ensure a Uint8Array is backed by a plain ArrayBuffer (not SharedArrayBuffer),
 *  which Web Crypto and WebAuthn APIs require. */
function toAB(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// ── Password ────────────────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', toAB(data));
  return new Uint8Array(digest);
}

function randomSalt(bytes = 16): Uint8Array {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return arr;
}

/** Hash a password with a fresh random salt. Returns {hash, salt} in base64. */
export async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = randomSalt(16);
  const combined = new Uint8Array(salt.length + strToBytes(password).length);
  combined.set(salt, 0);
  combined.set(strToBytes(password), salt.length);
  const hashBytes = await sha256(combined);
  return { hash: bytesToBase64(hashBytes), salt: bytesToBase64(salt) };
}

/** Verify a plaintext password against stored hash+salt. */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const salt = base64ToBytes(storedSalt);
  const pwBytes = strToBytes(password);
  const combined = new Uint8Array(salt.length + pwBytes.length);
  combined.set(salt, 0);
  combined.set(pwBytes, salt.length);
  const hashBytes = await sha256(combined);
  const computed = bytesToBase64(hashBytes);
  // Constant-time-ish comparison to avoid timing attacks (not critical
  // for a local UI gate, but good practice).
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/** Enable the app lock with the given password. */
export async function enableLock(password: string): Promise<void> {
  if (password.length < 4) {
    throw new Error('كلمة السر يجب أن تكون 4 أحرف على الأقل.');
  }
  const { hash, salt } = await hashPassword(password);
  await updateSettings({
    lockEnabled: true,
    passwordHash: hash,
    passwordSalt: salt,
  });
}

/** Change the password (requires the current password to be correct). */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const s = await getSettings();
  if (!s.lockEnabled || !s.passwordHash || !s.passwordSalt) {
    throw new Error('القفل غير مفعّل.');
  }
  const ok = await verifyPassword(currentPassword, s.passwordHash, s.passwordSalt);
  if (!ok) throw new Error('كلمة السر الحالية غير صحيحة.');
  if (newPassword.length < 4) {
    throw new Error('كلمة السر الجديدة يجب أن تكون 4 أحرف على الأقل.');
  }
  const { hash, salt } = await hashPassword(newPassword);
  await updateSettings({ passwordHash: hash, passwordSalt: salt });
}

/** Disable the lock entirely (also removes biometric). */
export async function disableLock(): Promise<void> {
  await updateSettings({
    lockEnabled: false,
    passwordHash: null,
    passwordSalt: null,
    biometricEnabled: false,
    biometricCredentialId: null,
  });
}

/** Verify password against current stored settings. */
export async function checkPassword(password: string): Promise<boolean> {
  const s = await getSettings();
  if (!s.passwordHash || !s.passwordSalt) return false;
  return verifyPassword(password, s.passwordHash, s.passwordSalt);
}

// ── Biometric (WebAuthn) ────────────────────────────────────────────

/** Check if a platform authenticator (biometric) is available on this device. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof PublicKeyCredential === 'undefined') return false;
  if (
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
    'function'
  ) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function randomChallenge(bytes = 32): Uint8Array {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return arr;
}

/** Register a biometric credential. Requires the lock to be enabled first. */
export async function enableBiometric(): Promise<void> {
  const s = await getSettings();
  if (!s.lockEnabled) {
    throw new Error('يجب تفعيل كلمة السر أولاً قبل تفعيل البصمة.');
  }
  if (!(await isBiometricAvailable())) {
    throw new Error('جهازك لا يدعم البصمة أو لم يتم تفعيلها.');
  }

  const challenge = randomChallenge();
  const userId = strToBytes('where-did-i-put-it-user');

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: toAB(challenge),
      rp: { name: 'وين حطيته؟' },
      user: {
        id: toAB(userId),
        name: 'المستخدم',
        displayName: 'المستخدم',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('تعذّر تسجيل البصمة.');
  }

  const credId = bytesToBase64(new Uint8Array(credential.rawId));
  await updateSettings({
    biometricEnabled: true,
    biometricCredentialId: credId,
  });
}

/** Disable biometric (keeps password lock active). */
export async function disableBiometric(): Promise<void> {
  await updateSettings({
    biometricEnabled: false,
    biometricCredentialId: null,
  });
}

/** Attempt biometric unlock. Returns true if the user verified successfully. */
export async function checkBiometric(): Promise<boolean> {
  const s = await getSettings();
  if (!s.biometricEnabled || !s.biometricCredentialId) return false;
  if (!(await isBiometricAvailable())) return false;

  const challenge = randomChallenge();
  const credId = base64ToBytes(s.biometricCredentialId);

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: toAB(challenge),
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [
          {
            id: toAB(credId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      },
    });
    return assertion !== null;
  } catch {
    // User cancelled or biometric failed.
    return false;
  }
}
