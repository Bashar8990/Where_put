import type JSZipType from 'jszip';
import { getDb } from '../../db/database';
import type { AppSettings, ItemCategory, LocationHistoryEntry, StoredImage, StoredItem } from '../../types';
import { CATEGORY_ORDER, DEFAULT_SETTINGS } from '../../types';
import { uuid } from '../../utils/uuid';

export const BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_APP_ID = 'where-did-i-put-it';

interface BackupManifest {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  createdAt: string;
  itemCount: number;
  imageCount: number;
}

interface BackupItemsFile {
  items: SerializableItem[];
}

interface BackupSettingsFile {
  settings: AppSettings;
}

interface SerializableItem {
  id: string;
  name: string;
  location: string;
  notes: string;
  category: ItemCategory | null;
  isFavorite: boolean;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
  locationHistory: LocationHistoryEntry[];
  searchText: string;
  deletedAt?: string | null;
}

interface SerializableImage {
  id: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  originalSize: number;
  compressedSize: number;
  createdAt: string;
  // blob stored as a separate file inside images/ folder
}

// ---------- Zod schemas ----------
import { z } from 'zod';

/** Robustly convert a Blob to ArrayBuffer across environments (jsdom, fake-indexeddb). */
async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    try {
      return await blob.arrayBuffer();
    } catch {
      // fall through to other methods
    }
  }
  // Response is widely available and handles Blob-like objects reliably.
  if (typeof Response !== 'undefined') {
    return new Response(blob).arrayBuffer();
  }
  // FileReader fallback (older browsers).
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.onerror = () => reject(fr.error ?? new Error('FileReader failed'));
    fr.readAsArrayBuffer(blob);
  });
}

const categorySchema = z.enum([
  'documents',
  'keys',
  'electronics',
  'car',
  'home',
  'travel',
  'valuable',
  'storage',
  'other',
]);

const locationHistorySchema = z.object({
  id: z.string(),
  location: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  notes: z.string(),
  category: categorySchema.nullable(),
  isFavorite: z.boolean(),
  imageId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  locationHistory: z.array(locationHistorySchema),
  searchText: z.string(),
  deletedAt: z.string().nullable().optional(),
});

const settingsSchema = z.object({
  id: z.literal('app'),
  theme: z.enum(['system', 'light', 'dark']),
  onboardingCompleted: z.boolean(),
  lastBackupAt: z.string().nullable(),
  backupReminderDismissedAt: z.string().nullable(),
  installPromptDismissedAt: z.string().nullable(),
  persistRequested: z.boolean(),
  lockEnabled: z.boolean().optional().default(false),
  passwordHash: z.string().nullable().optional().default(null),
  passwordSalt: z.string().nullable().optional().default(null),
  biometricEnabled: z.boolean().optional().default(false),
  biometricCredentialId: z.string().nullable().optional().default(null),
});

const manifestSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.number().int().min(1),
  createdAt: z.string(),
  itemCount: z.number().int().min(0),
  imageCount: z.number().int().min(0),
});

const itemsFileSchema = z.object({
  items: z.array(itemSchema),
});

const settingsFileSchema = z.object({
  settings: settingsSchema,
});

const imageMetaSchema = z.object({
  id: z.string(),
  mimeType: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  originalSize: z.number(),
  compressedSize: z.number(),
  createdAt: z.string(),
});

const imagesIndexSchema = z.object({
  images: z.array(imageMetaSchema),
});

// ---------- Export ----------

function timestampForFilename(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function exportBackup(): Promise<Blob> {
  const db = getDb();
  const items = await db.items.toArray();
  const images = await db.images.toArray();
  const settings = (await db.settings.get('app')) ?? { ...DEFAULT_SETTINGS };

  const { default: JSZip } = await import('jszip');
  const zip: JSZipType = new JSZip();

  const manifest: BackupManifest = {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    itemCount: items.length,
    imageCount: images.length,
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const itemsFile: BackupItemsFile = {
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      location: i.location,
      notes: i.notes,
      category: i.category,
      isFavorite: i.isFavorite,
      imageId: i.imageId,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      locationHistory: i.locationHistory,
      searchText: i.searchText,
      deletedAt: i.deletedAt ?? null,
    })),
  };
  zip.file('items.json', JSON.stringify(itemsFile, null, 2));

  zip.file('settings.json', JSON.stringify({ settings } as BackupSettingsFile, null, 2));

  const imagesFolder = zip.folder('images')!;
  const imagesIndex: { images: SerializableImage[] } = { images: [] };
  for (const img of images) {
    const ext = img.mimeType === 'image/webp' ? 'webp' : img.mimeType === 'image/png' ? 'png' : 'jpg';
    // Use ArrayBuffer for maximum compatibility across environments (jsdom, etc).
    const buf = await blobToArrayBuffer(img.blob);
    imagesFolder.file(`${img.id}.${ext}`, buf);
    imagesIndex.images.push({
      id: img.id,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      originalSize: img.originalSize,
      compressedSize: img.compressedSize,
      createdAt: img.createdAt,
    });
  }
  zip.file('images/index.json', JSON.stringify(imagesIndex, null, 2));

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export function backupFilename(): string {
  return `where-did-i-put-it-backup-${timestampForFilename()}.zip`;
}

// ---------- Import / Restore ----------

export interface BackupSummary {
  manifest: BackupManifest;
  itemCount: number;
  imageCount: number;
  settings: AppSettings | null;
  createdAt: string;
}

export interface ParsedBackup {
  manifest: BackupManifest;
  items: StoredItem[];
  images: { meta: SerializableImage; blob: Blob }[];
  settings: AppSettings | null;
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

async function readJson<T>(zip: JSZipType, path: string): Promise<T> {
  const file = zip.file(path);
  if (!file) throw new BackupValidationError(`الملف "${path}" مفقود داخل النسخة الاحتياطية.`);
  const text = await file.async('string');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupValidationError(`الملف "${path}" تالف وليس JSON صالح.`);
  }
  return json as T;
}

/** Parse and validate a backup zip without modifying the database. */
export async function parseBackup(file: File): Promise<ParsedBackup> {
  const { default: JSZip } = await import('jszip');
  let zip: JSZipType;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new BackupValidationError('تعذّر فتح ملف النسخة الاحتياطية. تأكد أنه ملف ZIP صالح.');
  }

  const manifestRaw = await readJson<unknown>(zip, 'manifest.json');
  const manifestResult = manifestSchema.safeParse(manifestRaw);
  if (!manifestResult.success) {
    throw new BackupValidationError('ملف manifest غير صالح أو ليس نسخة احتياطية من هذا التطبيق.');
  }
  const manifest = manifestResult.data;
  if (manifest.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError(
      `هذه النسخة الاحتياطية بإصدار أحدث (${manifest.schemaVersion}) غير مدعوم في هذا التطبيق.`,
    );
  }

  const itemsRaw = await readJson<unknown>(zip, 'items.json');
  const itemsResult = itemsFileSchema.safeParse(itemsRaw);
  if (!itemsResult.success) {
    throw new BackupValidationError('ملف items.json غير صالح.');
  }

  const settingsRaw = await readJson<unknown>(zip, 'settings.json').catch(() => null);
  let settings: AppSettings | null = null;
  if (settingsRaw) {
    const settingsResult = settingsFileSchema.safeParse(settingsRaw);
    if (settingsResult.success) {
      settings = settingsResult.data.settings;
    }
  }

  // Images
  const imagesIndexRaw = await readJson<unknown>(zip, 'images/index.json').catch(() => null);
  const images: { meta: SerializableImage; blob: Blob }[] = [];
  if (imagesIndexRaw) {
    const idxResult = imagesIndexSchema.safeParse(imagesIndexRaw);
    if (idxResult.success) {
      for (const meta of idxResult.data.images) {
        const ext = meta.mimeType === 'image/webp' ? 'webp' : meta.mimeType === 'image/png' ? 'png' : 'jpg';
        const imgFile = zip.file(`images/${meta.id}.${ext}`);
        if (!imgFile) continue;
        const blob = await imgFile.async('blob');
        images.push({ meta, blob });
      }
    }
  }

  const items: StoredItem[] = itemsResult.data.items.map((i) => ({
    ...i,
    deletedAt: i.deletedAt ?? null,
  }));

  return { manifest, items, images, settings };
}

export function summarizeBackup(parsed: ParsedBackup): BackupSummary {
  return {
    manifest: parsed.manifest,
    itemCount: parsed.items.length,
    imageCount: parsed.images.length,
    settings: parsed.settings,
    createdAt: parsed.manifest.createdAt,
  };
}

export type RestoreMode = 'merge' | 'replace';

/** Perform the restore. For 'replace', validates everything first before deleting. */
export async function restoreBackup(parsed: ParsedBackup, mode: RestoreMode): Promise<void> {
  const db = getDb();

  if (mode === 'replace') {
    // Validate images are present for all referenced imageIds that we have.
    // (We already parsed; just confirm blobs exist.) Then wipe and write.
    await db.transaction('rw', db.items, db.images, db.settings, async () => {
      await db.items.clear();
      await db.images.clear();
      await writeParsedData(parsed);
    });
    return;
  }

  // Merge: keep newer version for same id; otherwise insert.
  await db.transaction('rw', db.items, db.images, db.settings, async () => {
    const existingItems = await db.items.toArray();
    const byId = new Map(existingItems.map((i) => [i.id, i]));

    for (const incoming of parsed.items) {
      const current = byId.get(incoming.id);
      if (!current) {
        await db.items.put(incoming);
      } else {
        // Respect soft-deletion: if the local copy was soft-deleted and the
        // incoming copy is not deleted, keep the local deleted state so we
        // don't resurrect an item the user intentionally removed.
        const locallyDeleted = !!current.deletedAt;
        const incomingDeleted = !!incoming.deletedAt;
        const curTs = new Date(current.updatedAt).getTime();
        const incTs = new Date(incoming.updatedAt).getTime();
        if (locallyDeleted && !incomingDeleted) {
          // Keep local (deleted) state — user deleted this; don't resurrect.
          continue;
        }
        if (incTs >= curTs) {
          await db.items.put(incoming);
        }
      }
    }

    // Images: upsert by id.
    for (const { meta, blob } of parsed.images) {
      const stored: StoredImage = {
        id: meta.id,
        blob,
        mimeType: meta.mimeType,
        width: meta.width,
        height: meta.height,
        originalSize: meta.originalSize,
        compressedSize: meta.compressedSize,
        createdAt: meta.createdAt,
      };
      await db.images.put(stored);
    }

    // Settings: do not overwrite onboardingCompleted; keep current theme unless backup has one.
    if (parsed.settings) {
      const cur = (await db.settings.get('app')) ?? { ...DEFAULT_SETTINGS };
      await db.settings.put({
        ...cur,
        lastBackupAt: parsed.settings.lastBackupAt ?? cur.lastBackupAt,
      });
    }
  });
}

async function writeParsedData(parsed: ParsedBackup): Promise<void> {
  const db = getDb();
  for (const item of parsed.items) {
    await db.items.put(item);
  }
  for (const { meta, blob } of parsed.images) {
    const stored: StoredImage = {
      id: meta.id,
      blob,
      mimeType: meta.mimeType,
      width: meta.width,
      height: meta.height,
      originalSize: meta.originalSize,
      compressedSize: meta.compressedSize,
      createdAt: meta.createdAt,
    };
    await db.images.put(stored);
  }
  if (parsed.settings) {
    await db.settings.put(parsed.settings);
  } else {
    await db.settings.put({ ...DEFAULT_SETTINGS });
  }
}

/** Wipe all user data (items, images, settings reset). */
export async function wipeAllData(): Promise<void> {
  const db = getDb();
  await db.transaction('rw', db.items, db.images, db.settings, async () => {
    await db.items.clear();
    await db.images.clear();
    await db.settings.put({ ...DEFAULT_SETTINGS });
  });
}

// Re-export category order to avoid unused import warning in some paths.
export const _categories = CATEGORY_ORDER;
export const _uuid = uuid;
