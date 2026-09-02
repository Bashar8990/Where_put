import { describe, expect, it } from 'vitest';
import { createItem, moveItem } from '../items/itemService';
import { saveImage } from '../images/imageService';
import {
  BACKUP_SCHEMA_VERSION,
  BackupValidationError,
  exportBackup,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  wipeAllData,
} from './backupService';
import { listAllItems } from '../items/itemService';
import { getDb } from '../../db/database';

function makeBlob(): Blob {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new Blob([bytes], { type: 'image/png' });
}

describe('backupService', () => {
  it('exports and parses a valid backup round-trip', async () => {
    const item = await createItem({ name: 'جواز السفر', location: 'درج المكتب', notes: 'ملف أزرق', category: 'documents', isFavorite: true });
    await moveItem(item.id, 'حقيبة السفر'); // create history

    const img = await saveImage({
      blob: makeBlob(),
      mimeType: 'image/png',
      width: 100,
      height: 100,
      originalSize: 8,
      compressedSize: 8,
    });
    await createItem({ name: 'USB', location: 'الحقيبة', imageId: img.id });

    const blob = await exportBackup();
    expect(blob.size).toBeGreaterThan(0);

    const file = new File([blob], 'backup.zip', { type: 'application/zip' });
    const parsed = await parseBackup(file);
    expect(parsed.manifest.app).toBe('where-did-i-put-it');
    expect(parsed.manifest.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(parsed.items.length).toBe(2);
    expect(parsed.images.length).toBe(1);

    const summary = summarizeBackup(parsed);
    expect(summary.itemCount).toBe(2);
    expect(summary.imageCount).toBe(1);
  });

  it('rejects a non-zip file', async () => {
    const file = new File(['not a zip'], 'bad.zip', { type: 'application/zip' });
    await expect(parseBackup(file)).rejects.toBeInstanceOf(BackupValidationError);
  });

  it('restore merge keeps newer version for same id', async () => {
    const item = await createItem({ name: 'مفتاح', location: 'الخزنة' });
    // Export current state.
    const blob = await exportBackup();
    const file = new File([blob], 'backup.zip', { type: 'application/zip' });
    const parsed = await parseBackup(file);

    // Modify the item locally (newer updatedAt).
    await moveItem(item.id, 'المكتب');

    // Restore merge — should keep the newer local version.
    await restoreBackup(parsed, 'merge');
    const after = await listAllItems();
    const found = after.find((i) => i.id === item.id);
    expect(found?.location).toBe('المكتب');
  });

  it('restore replace wipes and writes backup data', async () => {
    await createItem({ name: 'محلي', location: 'مكان' });
    const blob = await exportBackup();
    const file = new File([blob], 'backup.zip', { type: 'application/zip' });
    const parsed = await parseBackup(file);

    // Add another item after export.
    await createItem({ name: 'إضافي', location: 'إضافي' });
    expect((await listAllItems()).length).toBe(2);

    await restoreBackup(parsed, 'replace');
    const after = await listAllItems();
    // Should only contain the items from the backup (1: "محلي").
    expect(after.length).toBe(1);
    expect(after[0].name).toBe('محلي');
  });

  it('wipeAllData clears items and images', async () => {
    await createItem({ name: 'x', location: 'y' });
    await saveImage({ blob: makeBlob(), mimeType: 'image/png', width: 1, height: 1, originalSize: 1, compressedSize: 1 });
    await wipeAllData();
    const db = getDb();
    expect(await db.items.count()).toBe(0);
    expect(await db.images.count()).toBe(0);
    const settings = await db.settings.get('app');
    expect(settings).toBeDefined();
    expect(settings?.onboardingCompleted).toBe(false);
  });

  it('rejects backup with unsupported schema version', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file(
      'manifest.json',
      JSON.stringify({
        app: 'where-did-i-put-it',
        schemaVersion: 999,
        createdAt: new Date().toISOString(),
        itemCount: 0,
        imageCount: 0,
      }),
    );
    zip.file('items.json', JSON.stringify({ items: [] }));
    zip.file('settings.json', JSON.stringify({ settings: null }));
    zip.file('images/index.json', JSON.stringify({ images: [] }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'backup.zip', { type: 'application/zip' });
    await expect(parseBackup(file)).rejects.toBeInstanceOf(BackupValidationError);
  });

  it('rejects backup missing manifest', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('items.json', JSON.stringify({ items: [] }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'backup.zip', { type: 'application/zip' });
    await expect(parseBackup(file)).rejects.toBeInstanceOf(BackupValidationError);
  });
});
