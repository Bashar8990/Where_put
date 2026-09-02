import { CATEGORY_LABELS, type ItemCategory } from '../types';
import { normalizeArabicText } from './normalizeArabicText';

/**
 * Build a normalized search text from an item's searchable fields.
 * Combines: name, location, notes, category label (Arabic + key).
 */
export function buildSearchText(item: {
  name: string;
  location: string;
  notes: string;
  category: ItemCategory | null;
}): string {
  const parts: string[] = [item.name, item.location, item.notes];
  if (item.category) {
    parts.push(CATEGORY_LABELS[item.category]);
    parts.push(item.category);
  }
  return normalizeArabicText(parts.join(' '));
}
