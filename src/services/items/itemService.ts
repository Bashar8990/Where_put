import { getDb } from '../../db/database';
import type { ItemCategory, LocationHistoryEntry, StoredItem } from '../../types';
import { buildSearchText } from '../../utils/buildSearchText';
import { normalizeArabicText } from '../../utils/normalizeArabicText';
import { uuid } from '../../utils/uuid';
import { deleteImageIfUnused } from '../images/imageService';

export interface NewItemInput {
  name: string;
  location: string;
  notes?: string;
  category?: ItemCategory | null;
  isFavorite?: boolean;
  imageId?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  location?: string;
  notes?: string;
  category?: ItemCategory | null;
  isFavorite?: boolean;
  imageId?: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createItem(input: NewItemInput): Promise<StoredItem> {
  const db = getDb();
  const name = input.name.trim();
  const location = input.location.trim();
  if (!name) throw new Error('اسم الغرض مطلوب.');
  if (!location) throw new Error('المكان مطلوب.');

  const ts = nowIso();
  const item: StoredItem = {
    id: uuid(),
    name,
    location,
    notes: (input.notes ?? '').trim(),
    category: input.category ?? null,
    isFavorite: input.isFavorite ?? false,
    imageId: input.imageId ?? null,
    createdAt: ts,
    updatedAt: ts,
    locationHistory: [],
    searchText: '',
    deletedAt: null,
  };
  item.searchText = buildSearchText(item);
  await db.items.put(item);
  return item;
}

export async function getItem(id: string): Promise<StoredItem | undefined> {
  const item = await getDb().items.get(id);
  if (item && item.deletedAt) return undefined;
  return item;
}

/** Get all live (non-deleted) items. */
export async function listAllItems(): Promise<StoredItem[]> {
  const all = await getDb().items.toArray();
  return all.filter((i) => !i.deletedAt);
}

export async function updateItem(id: string, patch: UpdateItemInput): Promise<StoredItem> {
  const db = getDb();
  return db.transaction('rw', db.items, async () => {
    const existing = await db.items.get(id);
    if (!existing || existing.deletedAt) throw new Error('الغرض غير موجود.');

    const next: StoredItem = { ...existing };

    if (patch.name !== undefined) next.name = patch.name.trim();
    if (patch.notes !== undefined) next.notes = patch.notes.trim();
    if (patch.category !== undefined) next.category = patch.category;
    if (patch.isFavorite !== undefined) next.isFavorite = patch.isFavorite;

    // Handle location change → push old location to history.
    if (patch.location !== undefined) {
      const newLocation = patch.location.trim();
      if (newLocation && newLocation !== existing.location) {
        const entry: LocationHistoryEntry = {
          id: uuid(),
          location: existing.location,
          note: null,
          createdAt: existing.updatedAt,
        };
        next.locationHistory = [entry, ...existing.locationHistory];
        next.location = newLocation;
      }
    }

    // Handle image change → clean up old image if no longer referenced.
    if (patch.imageId !== undefined && patch.imageId !== existing.imageId) {
      const oldImageId = existing.imageId;
      next.imageId = patch.imageId;
      if (oldImageId) {
        // Defer cleanup until after put succeeds.
        await db.items.put({ ...next, updatedAt: nowIso() });
        next.updatedAt = (await db.items.get(id))!.updatedAt;
        await deleteImageIfUnused(oldImageId);
        next.searchText = buildSearchText(next);
        await db.items.put(next);
        return next;
      }
    }

    next.updatedAt = nowIso();
    next.searchText = buildSearchText(next);
    await db.items.put(next);
    return next;
  });
}

/** Move an item to a new location quickly, pushing the old one to history. */
export async function moveItem(id: string, newLocation: string): Promise<StoredItem> {
  const location = newLocation.trim();
  if (!location) throw new Error('المكان الجديد مطلوب.');
  return updateItem(id, { location });
}

export async function toggleFavorite(id: string): Promise<StoredItem> {
  const existing = await getItem(id);
  if (!existing) throw new Error('الغرض غير موجود.');
  return updateItem(id, { isFavorite: !existing.isFavorite });
}

/** Soft-delete: mark deletedAt, keep recoverable for undo. */
export async function softDeleteItem(id: string): Promise<void> {
  const db = getDb();
  await db.items.update(id, { deletedAt: nowIso() });
}

/** Undo a soft-delete (clear deletedAt). */
export async function restoreItem(id: string): Promise<void> {
  const db = getDb();
  await db.items.update(id, { deletedAt: null });
}

/** Permanently delete an item and its image (if unused elsewhere). */
export async function permanentlyDeleteItem(id: string): Promise<void> {
  const db = getDb();
  const item = await db.items.get(id);
  if (!item) return;
  await db.items.delete(id);
  if (item.imageId) await deleteImageIfUnused(item.imageId);
}

/** Permanently purge all soft-deleted items. */
export async function purgeDeletedItems(): Promise<void> {
  const db = getDb();
  const all = await db.items.toArray();
  const toPurge = all.filter((i) => i.deletedAt);
  for (const item of toPurge) {
    await permanentlyDeleteItem(item.id);
  }
}

export async function countItems(): Promise<number> {
  const all = await getDb().items.toArray();
  return all.filter((i) => !i.deletedAt).length;
}

/** Distinct locations with counts, sorted by usage desc then name. */
export async function listLocations(): Promise<{ location: string; count: number }[]> {
  const items = await listAllItems();
  const map = new Map<string, number>();
  for (const item of items) {
    const loc = item.location.trim();
    if (!loc) continue;
    map.set(loc, (map.get(loc) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location, 'ar'));
}

/** Suggest locations matching a query, ranked by usage + recency + text match. */
export async function suggestLocations(query: string): Promise<string[]> {
  const items = await listAllItems();
  const q = query.trim();
  if (!q) {
    // Return most-used locations.
    const locs = await listLocations();
    return locs.slice(0, 6).map((l) => l.location);
  }
  // Build usage + lastUsed maps.
  const usage = new Map<string, number>();
  const lastUsed = new Map<string, number>();
  const seen = new Set<string>();
  for (const item of items) {
    const loc = item.location.trim();
    if (!loc) continue;
    usage.set(loc, (usage.get(loc) ?? 0) + 1);
    const t = new Date(item.updatedAt).getTime();
    if (!lastUsed.has(loc) || t > (lastUsed.get(loc) ?? 0)) lastUsed.set(loc, t);
  }
  // Normalize query for matching.
  const normQ = normalizeArabicText(q);
  const candidates = Array.from(usage.keys()).filter((loc) => {
    seen.add(loc);
    return normalizeArabicText(loc).includes(normQ);
  });
  candidates.sort((a, b) => {
    const startsA = normalizeArabicText(a).startsWith(normQ) ? 1 : 0;
    const startsB = normalizeArabicText(b).startsWith(normQ) ? 1 : 0;
    if (startsA !== startsB) return startsB - startsA;
    const u = (usage.get(b) ?? 0) - (usage.get(a) ?? 0);
    if (u !== 0) return u;
    return (lastUsed.get(b) ?? 0) - (lastUsed.get(a) ?? 0);
  });
  return candidates.slice(0, 6);
}
