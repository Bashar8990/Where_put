import Dexie, { type Table } from 'dexie';
import type { AppSettings, StoredImage, StoredItem } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export interface DBSchema {
  items: Table<StoredItem, string>;
  images: Table<StoredImage, string>;
  settings: Table<AppSettings, string>;
}

export const DB_NAME = 'where-did-i-put-it';
export const DB_VERSION = 1;

export class AppDatabase extends Dexie implements DBSchema {
  items!: Table<StoredItem, string>;
  images!: Table<StoredImage, string>;
  settings!: Table<AppSettings, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      // Indexed fields: id (pk), searchText, isFavorite, category, updatedAt, deletedAt
      items: 'id, searchText, isFavorite, category, updatedAt, deletedAt',
      images: 'id',
      settings: 'id',
    });
  }
}

let _db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!_db) {
    _db = new AppDatabase();
  }
  return _db;
}

/** For tests: allow injecting a fresh in-memory db. */
export function setDbForTesting(db: AppDatabase | null): void {
  _db = db;
}

/** Ensure the singleton settings row exists; returns current settings.
 *  Merges with DEFAULT_SETTINGS so newly-added fields get their defaults
 *  even for existing databases that predate those fields. */
export async function ensureSettings(): Promise<AppSettings> {
  const db = getDb();
  const existing = await db.settings.get('app');
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };
  await db.settings.put({ ...DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS };
}
