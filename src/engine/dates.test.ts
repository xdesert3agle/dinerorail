import { describe, expect, it } from 'vitest';
import { addDays, isValidISO, toDayNum, weekdayOf } from './dates';

describe('fechas', () => {
  it('weekdayOf: 0 es lunes (no el domingo de JS): 2026-10-05 es lunes y 2026-10-03 sábado', () => {
    expect(weekdayOf(toDayNum('2026-10-05'))).toBe(0);
    expect(weekdayOf(toDayNum('2026-10-03'))).toBe(5);
  });

  it('isValidISO: solo fechas que existen, con el formato exacto', () => {
    expect(isValidISO('2026-02-28')).toBe(true);
    expect(isValidISO('2028-02-29')).toBe(true);
    expect(isValidISO('2026-02-30')).toBe(false);
    expect(isValidISO('2026-2-3')).toBe(false);
    expect(isValidISO(20260203)).toBe(false);
  });

  it('addDays cruza meses y años, y el cambio de hora no la mueve (días UTC)', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});
