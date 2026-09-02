import { getDb } from '../../db/database';
import type { StoredImage } from '../../types';
import { uuid } from '../../utils/uuid';

export async function saveImage(
  data: {
    blob: Blob;
    mimeType: string;
    width: number | null;
    height: number | null;
    originalSize: number;
    compressedSize: number;
  },
): Promise<StoredImage> {
  const db = getDb();
  const image: StoredImage = {
    id: uuid(),
    blob: data.blob,
    mimeType: data.mimeType,
    width: data.width,
    height: data.height,
    originalSize: data.originalSize,
    compressedSize: data.compressedSize,
    createdAt: new Date().toISOString(),
  };
  await db.images.put(image);
  return image;
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  return getDb().images.get(id);
}

/** Delete an image only if it is not referenced by any (non-deleted) item. */
export async function deleteImageIfUnused(imageId: string): Promise<void> {
  const db = getDb();
  const items = await db.items.toArray();
  const used = items.some((i) => i.imageId === imageId && !i.deletedAt);
  if (!used) {
    await db.images.delete(imageId);
  }
}

export async function deleteImage(imageId: string): Promise<void> {
  await getDb().images.delete(imageId);
}

/** Count images and total compressed size. */
export async function getImageStats(): Promise<{ count: number; totalBytes: number }> {
  const db = getDb();
  const all = await db.images.toArray();
  return {
    count: all.length,
    totalBytes: all.reduce((sum, i) => sum + i.compressedSize, 0),
  };
}

/** Get an object URL for an image id, or null if missing. Caller must revoke. */
export async function getImageObjectUrl(imageId: string | null): Promise<string | null> {
  if (!imageId) return null;
  const img = await getImage(imageId);
  if (!img) return null;
  return URL.createObjectURL(img.blob);
}
