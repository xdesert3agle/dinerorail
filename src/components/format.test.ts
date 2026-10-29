import { describe, expect, it } from 'vitest';
import { describeSchedule, floorSingles, fmtChance, fmtCountdown, fmtEuros, fmtSingles, pendingLabel } from './format';

// Intl y los textos con % llevan espacios de no separación: se comparan sin distinguirlos.
const plain = (s: string | null) => s?.replace(/\u00a0|\u202f/g, ' ') ?? null;

describe('formatos', () => {
  it('tiradas: con punto de miles siempre y dos decimales; las enteras, sin redondear hacia arriba', () => {
    expect(fmtSingles(1234.5)).toBe('1.234,50');
    expect(floorSingles(81.999)).toBe(81);
    // 0,1 + 0,2 no da 0,3 exacto: el margen evita perder una tirada entera por la coma flotante.
    expect(floorSingles((0.1 + 0.2) * 10)).toBe(3);
  });

  it('cuenta atrás y euros', () => {
    expect([fmtCountdown(0), fmtCountdown(1), fmtCountdown(1200)]).toEqual(['hoy', 'mañana', 'en 1.200 días']);
    expect(plain(fmtEuros(1999.9))).toBe('1.999,90 €');
  });

  it('el % de cada objetivo: 100 y 0 solo si son seguros; si no, >99 y <1', () => {
    const chance = (p: number, certain = false, impossible = false) => plain(fmtChance({ p, certain, impossible }));
    expect([chance(1, true), chance(0, false, true)]).toEqual(['100 %', '0 %']);
    expect([chance(0.999), chance(0.004), chance(0.426)]).toEqual(['>99 %', '<1 %', '43 %']);
  });

  it('las fuentes: cada calendario en palabras, y «pendiente» solo donde se puede cobrar ya', () => {
    expect(describeSchedule({ type: 'weekly', weekday: 0 })).toBe('Cada lunes');
    expect(describeSchedule({ type: 'monthly', day: 1 })).toBe('El día 1 de cada mes');
    expect(describeSchedule({ type: 'perPatch', offsetDays: -2 })).toBe('2 días antes de cada versión');
    expect(describeSchedule({ type: 'perPatch', offsetDays: 0 })).toBe('Al inicio de cada versión');
    expect(pendingLabel({ type: 'daily' })).toBe('Pendiente de cobrar hoy');
    expect(pendingLabel({ type: 'perPatch', offsetDays: 0 })).toBeNull();
  });
});
