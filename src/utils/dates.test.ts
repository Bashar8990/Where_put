import { describe, expect, it } from 'vitest';
import { formatFullDate, formatRelativeDate } from './dates';

describe('formatRelativeDate', () => {
  it('returns اليوم for today', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('اليوم');
  });

  it('returns أمس for yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatRelativeDate(d.toISOString())).toBe('أمس');
  });

  it('returns منذ X أيام within a week', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(formatRelativeDate(d.toISOString())).toBe('منذ 3 أيام');
  });
});

describe('formatFullDate', () => {
  it('formats a date in Arabic', () => {
    const text = formatFullDate('2026-09-02T10:00:00Z');
    expect(text).toContain('2026');
    expect(text.length).toBeGreaterThan(0);
  });
});
