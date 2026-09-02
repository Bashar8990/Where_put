import { getDb, ensureSettings } from '../../db/database';
import type { AppSettings } from '../../types';

export async function getSettings(): Promise<AppSettings> {
  return ensureSettings();
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const db = getDb();
  const current = await ensureSettings();
  const next: AppSettings = { ...current, ...patch, id: 'app' };
  await db.settings.put(next);
  return next;
}
