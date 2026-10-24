import { describe, expect, it } from 'vitest';
import { byVersion, KEY_DATES, patchText, upcomingKeyDates } from './keyDates';

describe('byVersion', () => {
  it('junta las dos partes de cada versión y deja sola la que solo tiene una', () => {
    const v = byVersion(upcomingKeyDates('2027-01-01'));
    expect(v.slice(0, 3).map((x) => [x.patch, x.first?.label, x.second?.label])).toEqual([
      ['5.0', 'Firefly SP', 'Misha SP'],
      ['5.1', 'Polka Kakamond', undefined],
      ['5.2', 'Kafka SP', 'Obsidian'],
    ]);
  });

  it('si la 1.ª parte ya pasó, la versión sigue con su 2.ª', () => {
    const [v] = byVersion(upcomingKeyDates('2027-02-10'));
    expect([v.patch, v.first, v.second?.label]).toEqual(['5.0', undefined, 'Misha SP']);
  });
});

describe('KEY_DATES', () => {
  const of = (patch: string, phase: 1 | 2) => KEY_DATES.find((d) => d.patch === patch && d.phase === phase);

  it('las versiones sin fecha empiezan 6 semanas después de la anterior, desde la 5.2', () => {
    expect(['5.3', '5.4', '5.5', '5.6', '5.7'].map((p) => of(p, 1)?.date)).toEqual([
      '2027-06-09',
      '2027-07-21',
      '2027-09-01',
      '2027-10-13',
      '2027-11-24',
    ]);
  });

  it('el segundo personaje va en la 2.ª parte, 3 semanas después del inicio, y es estimada', () => {
    expect(of('5.0', 2)).toEqual({ date: '2027-02-24', label: 'Misha SP', patch: '5.0', phase: 2, estimated: true });
    expect(of('5.2', 2)?.date).toBe('2027-05-19');
    expect(of('5.3', 2)?.date).toBe('2027-06-30');
    expect(of('5.2', 1)).toEqual({ date: '2027-04-28', label: 'Kafka SP', patch: '5.2', phase: 1 });
    // La 4.8 trae dos personajes a la vez (colaboración con ZZZ): una sola fecha, en la 1.ª parte.
    expect(KEY_DATES.filter((d) => d.patch === '4.8')).toEqual([
      { date: '2026-12-23', label: 'Astra y Ellen (ZZZ)', patch: '4.8', phase: 1 },
    ]);
  });

  it('va en orden de fecha', () => {
    const dates = KEY_DATES.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

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
