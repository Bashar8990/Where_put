import { describe, expect, it } from 'vitest';
import { buildSearchText } from './buildSearchText';

describe('buildSearchText', () => {
  it('combines name, location, notes, and category label', () => {
    const text = buildSearchText({
      name: 'جواز السفر',
      location: 'درج المكتب',
      notes: 'داخل الملف الأزرق',
      category: 'documents',
    });
    expect(text).toContain('جواز');
    expect(text).toContain('السفر');
    expect(text).toContain('مكتب');
    expect(text).toContain('ملف');
    expect(text).toContain('مستندات');
    expect(text).toContain('documents');
  });

  it('handles null category', () => {
    const text = buildSearchText({
      name: 'مفتاح',
      location: 'الخزنة',
      notes: '',
      category: null,
    });
    expect(text).toContain('مفتاح');
    expect(text).toContain('خزنه'); // ta marbuta normalized
  });
});
