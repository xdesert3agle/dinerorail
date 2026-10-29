import { describe, expect, it } from 'vitest';
import { toDayNum } from './dates';
import { canBePending, nextVersion, occurrences } from './sources';

describe('occurrences', () => {
  const from = toDayNum('2026-10-01');
  const to = toDayNum('2026-10-31');

  it('weekly: los lunes de octubre de 2026', () => {
    expect(occurrences({ type: 'weekly', weekday: 0 }, from, to, []).length).toBe(4);
  });

  it('cycle: cuenta el ciclo que empieza justo el último día', () => {
    // 20/09 + 42 = 01/11: fuera del periodo.
    const days = occurrences({ type: 'cycle', anchor: '2026-09-20', periodDays: 42 }, from, to, []);
    expect(days).toEqual([]);
    const onEdge = occurrences({ type: 'cycle', anchor: '2026-10-31', periodDays: 42 }, from, to, []);
    expect(onEdge).toEqual([to]);
  });

  it('cycle: ancla en el futuro lejano también genera ciclos hacia atrás', () => {
    const days = occurrences({ type: 'cycle', anchor: '2027-01-01', periodDays: 42 }, from, to, []);
    expect(days).toEqual([toDayNum('2026-10-09')]);
  });

  it('monthly: día 1', () => {
    expect(occurrences({ type: 'monthly', day: 1 }, from, toDayNum('2026-12-15'), []).length).toBe(3);
  });

  it('monthly: el día 31 solo cae en los meses que lo tienen', () => {
    const days = occurrences({ type: 'monthly', day: 31 }, from, toDayNum('2026-12-31'), []);
    expect(days).toEqual(['2026-10-31', '2026-12-31'].map(toDayNum));
  });

  it('por versión, en orden aunque las versiones no lo estén y con el desfase (negativo, antes del inicio)', () => {
    const starts = ['2027-01-20', '2026-12-09'].map(toDayNum);
    const days = occurrences({ type: 'perPatch', offsetDays: -10 }, from, toDayNum('2027-03-01'), starts);
    expect(days).toEqual(['2026-11-29', '2027-01-10'].map(toDayNum));
  });
});

describe('versiones y cobros pendientes', () => {
  it('nextVersion: la siguiente; si no se entiende, un sufijo', () => {
    expect(nextVersion('4.6')).toBe('4.7');
    expect(nextVersion('4.9')).toBe('4.10');
    expect(nextVersion('beta')).not.toBe('beta');
  });

  it('canBePending: todas menos las de por versión', () => {
    expect(canBePending({ type: 'daily' })).toBe(true);
    expect(canBePending({ type: 'perPatch', offsetDays: 0 })).toBe(false);
  });
});
