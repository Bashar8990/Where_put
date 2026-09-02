import { describe, expect, it } from 'vitest';
import {
  createItem,
  getItem,
  listAllItems,
  moveItem,
  softDeleteItem,
  restoreItem,
  toggleFavorite,
  updateItem,
} from './itemService';

describe('itemService', () => {
  describe('createItem', () => {
    it('creates an item with required fields', async () => {
      const item = await createItem({ name: 'جواز السفر', location: 'درج المكتب' });
      expect(item.id).toBeTruthy();
      expect(item.name).toBe('جواز السفر');
      expect(item.location).toBe('درج المكتب');
      expect(item.notes).toBe('');
      expect(item.category).toBeNull();
      expect(item.isFavorite).toBe(false);
      expect(item.imageId).toBeNull();
      expect(item.locationHistory).toEqual([]);
      expect(item.searchText).toContain('جواز');
      expect(item.searchText).toContain('مكتب');
    });

    it('rejects empty name', async () => {
      await expect(createItem({ name: '', location: 'x' })).rejects.toThrow();
    });

    it('rejects empty location', async () => {
      await expect(createItem({ name: 'x', location: '' })).rejects.toThrow();
    });

    it('stores optional fields', async () => {
      const item = await createItem({
        name: 'مفتاح السيارة',
        location: 'الخزنة',
        notes: 'احتياطي',
        category: 'keys',
        isFavorite: true,
      });
      expect(item.notes).toBe('احتياطي');
      expect(item.category).toBe('keys');
      expect(item.isFavorite).toBe(true);
    });
  });

  describe('updateItem & location history', () => {
    it('pushes old location to history when location changes', async () => {
      const item = await createItem({ name: 'جواز', location: 'درج المكتب' });
      const moved = await moveItem(item.id, 'حقيبة السفر');
      expect(moved.location).toBe('حقيبة السفر');
      expect(moved.locationHistory).toHaveLength(1);
      expect(moved.locationHistory[0].location).toBe('درج المكتب');
    });

    it('does not add history when location unchanged', async () => {
      const item = await createItem({ name: 'جواز', location: 'درج المكتب' });
      const updated = await updateItem(item.id, { notes: 'ملاحظة جديدة' });
      expect(updated.locationHistory).toEqual([]);
      expect(updated.notes).toBe('ملاحظة جديدة');
    });

    it('preserves history across multiple moves', async () => {
      const item = await createItem({ name: 'USB', location: 'المكتب' });
      await moveItem(item.id, 'الخزنة');
      await moveItem(item.id, 'الحقيبة');
      const final = await getItem(item.id);
      expect(final?.location).toBe('الحقيبة');
      expect(final?.locationHistory).toHaveLength(2);
      expect(final?.locationHistory[0].location).toBe('الخزنة');
      expect(final?.locationHistory[1].location).toBe('المكتب');
    });
  });

  describe('favorites', () => {
    it('toggles favorite', async () => {
      const item = await createItem({ name: 'x', location: 'y' });
      expect(item.isFavorite).toBe(false);
      const fav = await toggleFavorite(item.id);
      expect(fav.isFavorite).toBe(true);
      const unfav = await toggleFavorite(item.id);
      expect(unfav.isFavorite).toBe(false);
    });
  });

  describe('soft delete & restore', () => {
    it('hides deleted items from listAllItems', async () => {
      const item = await createItem({ name: 'x', location: 'y' });
      await softDeleteItem(item.id);
      const all = await listAllItems();
      expect(all.find((i) => i.id === item.id)).toBeUndefined();
    });

    it('restore brings it back', async () => {
      const item = await createItem({ name: 'x', location: 'y' });
      await softDeleteItem(item.id);
      await restoreItem(item.id);
      const all = await listAllItems();
      expect(all.find((i) => i.id === item.id)).toBeDefined();
    });
  });
});
