import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';

beforeEach(async () => {
  // Reset the db singleton and clear all tables for a clean state.
  const { getDb, setDbForTesting, AppDatabase } = await import('../db/database');
  // Replace singleton with a fresh instance using a unique name per test.
  const uniqueName = `test-where-put-${Math.random().toString(36).slice(2)}`;
  const db = new (AppDatabase as unknown as new (name?: string) => InstanceType<typeof AppDatabase>)(
    uniqueName,
  );
  setDbForTesting(db);
  await db.open();
  // Ensure settings row exists.
  await db.settings.put({
    id: 'app',
    theme: 'system',
    onboardingCompleted: true,
    lastBackupAt: null,
    backupReminderDismissedAt: null,
    installPromptDismissedAt: null,
    persistRequested: false,
    lockEnabled: false,
    passwordHash: null,
    passwordSalt: null,
    biometricEnabled: false,
    biometricCredentialId: null,
  });
  void getDb;
});
