import { describe, expect, it } from 'vitest';
import {
  changePassword,
  checkPassword,
  disableLock,
  enableLock,
  hashPassword,
  isBiometricAvailable,
  verifyPassword,
} from './authService';
import { getSettings } from '../settings/settingsService';

describe('authService', () => {
  describe('hashPassword / verifyPassword', () => {
    it('produces different hashes for the same password (random salt)', async () => {
      const a = await hashPassword('secret');
      const b = await hashPassword('secret');
      expect(a.hash).not.toBe(b.hash);
      expect(a.salt).not.toBe(b.salt);
    });

    it('verifies the correct password', async () => {
      const { hash, salt } = await hashPassword('mypassword');
      expect(await verifyPassword('mypassword', hash, salt)).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const { hash, salt } = await hashPassword('mypassword');
      expect(await verifyPassword('wrong', hash, salt)).toBe(false);
    });

    it('rejects empty password', async () => {
      const { hash, salt } = await hashPassword('mypassword');
      expect(await verifyPassword('', hash, salt)).toBe(false);
    });
  });

  describe('enableLock', () => {
    it('enables the lock and stores a hash', async () => {
      await enableLock('1234');
      const s = await getSettings();
      expect(s.lockEnabled).toBe(true);
      expect(s.passwordHash).toBeTruthy();
      expect(s.passwordSalt).toBeTruthy();
    });

    it('rejects passwords shorter than 4 characters', async () => {
      await expect(enableLock('12')).rejects.toThrow();
      const s = await getSettings();
      expect(s.lockEnabled).toBe(false);
    });

    it('accepts a 4-character password', async () => {
      await enableLock('1234');
      const s = await getSettings();
      expect(s.lockEnabled).toBe(true);
    });
  });

  describe('checkPassword', () => {
    it('returns true for the correct password after enableLock', async () => {
      await enableLock('mypw');
      expect(await checkPassword('mypw')).toBe(true);
    });

    it('returns false for an incorrect password', async () => {
      await enableLock('mypw');
      expect(await checkPassword('wrong')).toBe(false);
    });

    it('returns false when lock is not enabled', async () => {
      expect(await checkPassword('anything')).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('changes the password when current is correct', async () => {
      await enableLock('oldpw');
      await changePassword('oldpw', 'newpw');
      expect(await checkPassword('newpw')).toBe(true);
      expect(await checkPassword('oldpw')).toBe(false);
    });

    it('rejects change when current password is wrong', async () => {
      await enableLock('oldpw');
      await expect(changePassword('wrong', 'newpw')).rejects.toThrow();
      expect(await checkPassword('oldpw')).toBe(true);
    });

    it('rejects new password shorter than 4 characters', async () => {
      await enableLock('oldpw');
      await expect(changePassword('oldpw', 'ab')).rejects.toThrow();
    });

    it('throws when lock is not enabled', async () => {
      await expect(changePassword('x', 'y')).rejects.toThrow();
    });
  });

  describe('disableLock', () => {
    it('disables the lock and clears all lock fields', async () => {
      await enableLock('1234');
      await disableLock();
      const s = await getSettings();
      expect(s.lockEnabled).toBe(false);
      expect(s.passwordHash).toBeNull();
      expect(s.passwordSalt).toBeNull();
      expect(s.biometricEnabled).toBe(false);
      expect(s.biometricCredentialId).toBeNull();
    });
  });

  describe('isBiometricAvailable', () => {
    it('returns false in jsdom (no WebAuthn support)', async () => {
      expect(await isBiometricAvailable()).toBe(false);
    });
  });
});
