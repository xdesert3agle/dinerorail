import { describe, expect, it } from 'vitest';
import { patchText, upcomingKeyDates } from './keyDates';

describe('patchText', () => {
  it('dice la versión y la parte, solo la versión, o nada', () => {
    expect(patchText({ date: '2026-11-11', label: 'A', patch: '4.7', phase: 1 })).toBe('4.7 · 1.ª parte');
    expect(patchText({ date: '2026-12-02', label: 'B', patch: '4.7', phase: 2 })).toBe('4.7 · 2.ª parte');
    expect(patchText({ date: '2026-12-02', label: 'C', patch: '4.8' })).toBe('4.8');
    expect(patchText({ date: '2026-12-02', label: 'D' })).toBe('');
  });
});

describe('upcomingKeyDates', () => {
  const dates = [
    { date: '2026-12-02', label: 'B' },
    { date: '2026-10-01', label: 'Pasada' },
    { date: '2026-11-11', label: 'A' },
  ];

  it('quita las pasadas y ordena de la más cercana a la más lejana', () => {
    expect(upcomingKeyDates('2026-10-23', dates).map((d) => d.label)).toEqual(['A', 'B']);
  });

  it('la de hoy sigue apareciendo', () => {
    expect(upcomingKeyDates('2026-11-11', dates).map((d) => d.label)).toEqual(['A', 'B']);
  });
});
