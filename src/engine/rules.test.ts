import { describe, expect, it } from 'vitest';
import { splitJades, STARLIGHT_PER_AVERAGE_4_STAR, targetStarlight } from './rules';

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

  it('splitJades: tiradas enteras y lo que sobra', () => {
    expect(splitJades(1000)).toEqual({ singles: 6, spare: 40 });
    expect(splitJades(159)).toEqual({ singles: 0, spare: 159 });
  });
});
