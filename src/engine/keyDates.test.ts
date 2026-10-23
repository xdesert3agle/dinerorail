import { describe, expect, it } from 'vitest';
import { upcomingKeyDates } from './keyDates';

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
