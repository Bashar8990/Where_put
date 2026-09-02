import type { ItemCategory, StoredItem } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { normalizeArabicText, tokenizeNormalized } from '../../utils/normalizeArabicText';
import { listAllItems } from '../items/itemService';

export interface SearchFilters {
  favoritesOnly?: boolean;
  category?: ItemCategory | null;
  withoutImage?: boolean;
  recentlyUpdated?: boolean;
}

export interface SearchResult {
  item: StoredItem;
  score: number;
}

/** Score a single item against normalized query tokens. Higher = better.
 * Uses the precomputed `searchText` for fast initial filtering, then
 * re-normalizes individual fields only for ranking precision. */
function scoreItem(item: StoredItem, queryNorm: string, queryTokens: string[]): number {
  if (!queryNorm) return 0;

  // Fast path: use precomputed searchText for initial containment check.
  // searchText already includes name + location + notes + category label + category key.
  const st = item.searchText ?? '';
  if (!st.includes(queryNorm)) {
    // If the full query isn't in the precomputed text, check token-level matches.
    if (queryTokens.length <= 1) return 0;
    const anyToken = queryTokens.some((tok) => tok && st.includes(tok));
    if (!anyToken) return 0;
  }

  // Ranking: normalize individual fields for precise scoring.
  const nameNorm = normalizeArabicText(item.name);
  const locNorm = normalizeArabicText(item.location);
  const notesNorm = normalizeArabicText(item.notes);
  const catNorm = item.category ? normalizeArabicText(CATEGORY_LABELS[item.category]) : '';

  let score = 0;

  // Full query exact match in name (highest)
  if (nameNorm === queryNorm) score += 1000;
  // Full query at start of name
  else if (nameNorm.startsWith(queryNorm)) score += 700;
  // Full query contained in name
  else if (nameNorm.includes(queryNorm)) score += 500;

  // Full query in location
  if (locNorm.includes(queryNorm)) score += 200;
  // Full query in notes
  if (notesNorm.includes(queryNorm)) score += 120;
  // Full query in category label
  if (catNorm && catNorm.includes(queryNorm)) score += 80;
  // Full query in category key (e.g. "documents") — enabled via searchText
  if (item.category && item.category.includes(queryNorm)) score += 60;

  // Per-token matching (for multi-word queries)
  if (queryTokens.length > 1) {
    let tokenHits = 0;
    for (const tok of queryTokens) {
      if (!tok) continue;
      if (nameNorm.includes(tok)) tokenHits += 3;
      else if (locNorm.includes(tok)) tokenHits += 2;
      else if (notesNorm.includes(tok)) tokenHits += 1;
      else if (catNorm.includes(tok)) tokenHits += 1;
      else if (item.category && item.category.includes(tok)) tokenHits += 1;
    }
    score += tokenHits * 40;
  }

  return score;
}

/** Recency boost: more recently updated items get a small bonus. */
function recencyBoost(updatedAt: string): number {
  const ageDays = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 1) return 30;
  if (ageDays < 7) return 20;
  if (ageDays < 30) return 10;
  return 0;
}

export async function searchItems(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  const items = await listAllItems();
  const queryNorm = normalizeArabicText(query);
  const queryTokens = tokenizeNormalized(queryNorm);

  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const results: SearchResult[] = [];
  for (const item of items) {
    // Apply filters
    if (filters.favoritesOnly && !item.isFavorite) continue;
    if (filters.category && item.category !== filters.category) continue;
    if (filters.withoutImage && item.imageId) continue;
    if (filters.recentlyUpdated && new Date(item.updatedAt).getTime() < recentCutoff) continue;

    if (!queryNorm) {
      // No query: include all (sorted later by updatedAt) with score 0.
      results.push({ item, score: 0 });
      continue;
    }

    const score = scoreItem(item, queryNorm, queryTokens);
    if (score > 0) {
      results.push({ item, score: score + recencyBoost(item.updatedAt) });
    }
  }

  // Sort: by score desc, then updatedAt desc.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime();
  });

  return results;
}

/** Get the most recently updated items (limit). */
export async function recentItems(limit = 8): Promise<StoredItem[]> {
  const items = await listAllItems();
  return items
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/** Get favorite items, sorted by updatedAt desc. */
export async function favoriteItems(): Promise<StoredItem[]> {
  const items = await listAllItems();
  return items
    .filter((i) => i.isFavorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Items in a given location string. */
export async function itemsAtLocation(location: string): Promise<StoredItem[]> {
  const items = await listAllItems();
  const norm = normalizeArabicText(location);
  return items
    .filter((i) => normalizeArabicText(i.location) === norm)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Items in a category. */
export async function itemsInCategory(category: ItemCategory): Promise<StoredItem[]> {
  const items = await listAllItems();
  return items
    .filter((i) => i.category === category)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Category counts. */
export async function categoryCounts(): Promise<Record<ItemCategory, number>> {
  const items = await listAllItems();
  const counts = {
    documents: 0,
    keys: 0,
    electronics: 0,
    car: 0,
    home: 0,
    travel: 0,
    valuable: 0,
    storage: 0,
    other: 0,
  } as Record<ItemCategory, number>;
  for (const item of items) {
    if (item.category) counts[item.category]++;
  }
  return counts;
}
