import { describe, expect, it } from 'vitest';
import { STARLIGHT_PER_AVERAGE_4_STAR, targetStarlight, wholeSinglesOf } from './rules';

describe('reglas', () => {
  it('Cosmiluz media de un 4★: ~17,5 en el banner de personaje y ~9,06 en el de conos', () => {
    // Personaje: 2/3 destacados (20) + 1/3 de la reserva sin ellos (19 personajes y 31 conos: 12,56).
    expect(STARLIGHT_PER_AVERAGE_4_STAR.character).toBeCloseTo(13.333 + 12.56 / 3, 2);
    // Conos: 4/5 destacados (8) + 1/5 de la reserva sin ellos (22 personajes y 28 conos: 13,28).
    expect(STARLIGHT_PER_AVERAGE_4_STAR.lightCone).toBeCloseTo(6.4 + 13.28 / 5, 2);
  });

  it('targetStarlight: personaje nuevo 0, de E1 a E6 40, tras E6 100; cono, 40 también el primero', () => {
    expect([0, 1, 6, 7].map((n) => targetStarlight('character', n))).toEqual([0, 40, 40, 100]);
    expect(targetStarlight('character', null)).toBe(0);
    expect(targetStarlight('lightCone', null)).toBe(40);
  });

  it('wholeSinglesOf: solo las tiradas enteras', () => {
    expect(wholeSinglesOf(1000)).toBe(6);
    expect(wholeSinglesOf(159)).toBe(0);
    expect(wholeSinglesOf(160)).toBe(1);
  });
});
