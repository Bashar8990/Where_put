import { beforeEach, describe, expect, it } from 'vitest';
import { createItem, moveItem } from '../items/itemService';
import { searchItems, recentItems, favoriteItems, itemsAtLocation } from './searchService';

async function seed() {
  await createItem({ name: 'جواز السفر', location: 'درج المكتب - الرف الثاني', notes: 'داخل الملف الأزرق', category: 'documents' });
  await createItem({ name: 'مفتاح السيارة الاحتياطي', location: 'الخزنة', category: 'keys' });
  await createItem({ name: 'ضمان السيارة', location: 'المخزن', notes: 'تأمين', category: 'car' });
  await createItem({ name: 'USB العمل', location: 'حقيبة السفر', category: 'electronics' });
  await createItem({ name: 'عقد الإيجار', location: 'الخزنة', notes: 'عقد المنزل', category: 'documents', isFavorite: true });
}

describe('searchService', () => {
  beforeEach(async () => {
    await seed();
  });

  it('finds by name', async () => {
    const res = await searchItems('جواز');
    expect(res.length).toBe(1);
    expect(res[0].item.name).toBe('جواز السفر');
  });

  it('finds by location', async () => {
    const res = await searchItems('المكتب');
    expect(res.some((r) => r.item.name === 'جواز السفر')).toBe(true);
  });

  it('finds by notes', async () => {
    const res = await searchItems('الملف');
    expect(res.some((r) => r.item.name === 'جواز السفر')).toBe(true);
  });

  it('finds by category label', async () => {
    const res = await searchItems('مستندات');
    expect(res.some((r) => r.item.name === 'جواز السفر')).toBe(true);
    expect(res.some((r) => r.item.name === 'عقد الإيجار')).toBe(true);
  });

  it('finds multiple items matching سيارة', async () => {
    const res = await searchItems('سيارة');
    const names = res.map((r) => r.item.name);
    expect(names).toContain('مفتاح السيارة الاحتياطي');
    expect(names).toContain('ضمان السيارة');
  });

  it('ranks exact name match highest', async () => {
    await createItem({ name: 'جواز', location: 'مكان آخر' });
    const res = await searchItems('جواز');
    expect(res[0].item.name).toBe('جواز');
  });

  it('ranks starts-with above contains', async () => {
    const res = await searchItems('جواز');
    // "جواز السفر" starts with "جواز" → should be first (after exact if any)
    expect(res[0].item.name).toBe('جواز السفر');
  });

  it('normalizes Arabic (Alef forms)', async () => {
    // Item is "عقد الإيجار" (with إ). Searching with plain ا should match.
    const res = await searchItems('ايجار');
    expect(res.some((r) => r.item.name === 'عقد الإيجار')).toBe(true);
  });

  it('returns empty for no matches', async () => {
    const res = await searchItems('كلمةغيرموجودة');
    expect(res.length).toBe(0);
  });

  it('filters favorites only', async () => {
    const res = await searchItems('', { favoritesOnly: true });
    expect(res.every((r) => r.item.isFavorite)).toBe(true);
    expect(res.some((r) => r.item.name === 'عقد الإيجار')).toBe(true);
  });

  it('filters by category', async () => {
    const res = await searchItems('', { category: 'keys' });
    expect(res.every((r) => r.item.category === 'keys')).toBe(true);
  });

  it('filters without image', async () => {
    const res = await searchItems('', { withoutImage: true });
    expect(res.every((r) => r.item.imageId === null)).toBe(true);
  });

  it('recentItems returns most recently updated', async () => {
    const rec = await recentItems(3);
    expect(rec.length).toBeLessThanOrEqual(3);
  });

  it('favoriteItems returns only favorites', async () => {
    const favs = await favoriteItems();
    expect(favs.every((f) => f.isFavorite)).toBe(true);
  });

  it('itemsAtLocation matches by normalized location', async () => {
    const items = await itemsAtLocation('الخزنة');
    expect(items.length).toBe(2);
  });

  it('updating an item boosts its recency', async () => {
    const all = await searchItems('');
    // Move the first item to bump updatedAt
    if (all[0]) {
      await moveItem(all[0].item.id, 'مكان جديد');
      const rec = await recentItems(1);
      expect(rec[0]?.id).toBe(all[0].item.id);
    }
  });
});
