import { describe, expect, it } from 'vitest';
import type { TimelinePoint } from './calculate';
import { planPulls, PULLS_PER_4_STAR, STARLIGHT_PER_AVERAGE_4_STAR } from './pulls';
import type { PlannedPull } from './types';

const pull = (id: string, kind: PlannedPull['kind'], winsFiftyFifty = false): PlannedPull => ({
  id,
  name: id,
  kind,
  winsFiftyFifty,
});

describe('planPulls', () => {
  it('el primer personaje descuenta el pity: 50 de pity y 50/50 perdido → 80 − 50 + 80 = 110', () => {
    const [aha] = planPulls([pull('aha', 'character')], { character: 50, lightCone: 0 }, 200, []);
    expect(aha.cost).toBe(110);
    expect(aha.costDetail).toBe('80 − 50 + 80');
    expect(aha.usesPity).toBe(true);
  });

  it('los siguientes personajes empiezan de cero: 160 si pierde, 80 si gana', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'character'), pull('c', 'character', true)],
      { character: 50, lightCone: 0 },
      1000,
      [],
    );
    expect(rows.map((r) => r.cost)).toEqual([110, 160, 80]);
    expect(rows.map((r) => r.usesPity)).toEqual([true, false, false]);
  });

  it('los conos tienen su propio pity de 70 (140 si pierde)', () => {
    const rows = planPulls(
      [pull('aha', 'character'), pull('cono', 'lightCone'), pull('cono2', 'lightCone', true)],
      { character: 50, lightCone: 20 },
      1000,
      [],
    );
    expect(rows.map((r) => r.cost)).toEqual([110, 70 - 20 + 70, 70]);
    expect(rows[1].usesPity).toBe(true);
  });

  it('ganar el 50/50 con pity: solo lo que falta para el pity', () => {
    const [row] = planPulls([pull('a', 'character', true)], { character: 30, lightCone: 0 }, 100, []);
    expect(row.cost).toBe(50);
    expect(row.costDetail).toBe('80 − 30');
  });

  it('acumula, resta de las singles disponibles y marca lo que no llega', () => {
    const rows = planPulls([pull('a', 'character'), pull('b', 'lightCone')], { character: 0, lightCone: 0 }, 200, []);
    // Fila 1 (personaje): 160 tiradas → 20,8 4★ × 17,52 (364,4) + 2 5★ (80) = 444,4 de Cosmiluz → 22 singles.
    // Fila 2 (cono): 140 tiradas → 18,2 4★ × 9,06 (164,8) + 80 = 244,8 → 689,2 en total, 34 singles.
    expect(rows.map((r) => Math.round(r.starlight))).toEqual([444, 245]);
    expect(rows.map((r) => r.netCost)).toEqual([138, 128]);
    expect(rows.map((r) => r.cumulative)).toEqual([138, 266]);
    expect(rows.map((r) => r.remaining)).toEqual([62, -66]);
    expect(rows.map((r) => r.affordable)).toEqual([true, false]);
  });

  it('un 4★ cada ~7,69 tiradas (13 %)', () => {
    expect(PULLS_PER_4_STAR).toBeCloseTo(7.69, 2);
  });

  it('Cosmiluz media de un 4★: ~17,5 en el banner de personaje y ~9,06 en el de conos', () => {
    // Personaje: 2/3 destacados (20) + 1/3 de la reserva sin ellos (19 personajes y 31 conos: 12,56).
    expect(STARLIGHT_PER_AVERAGE_4_STAR.character).toBeCloseTo(13.333 + 12.56 / 3, 2);
    // Conos: 4/5 destacados (8) + 1/5 de la reserva sin ellos (22 personajes y 28 conos: 13,28).
    expect(STARLIGHT_PER_AVERAGE_4_STAR.lightCone).toBeCloseTo(6.4 + 13.28 / 5, 2);
  });

  it('la Cosmiluz del 5★ buscado no paga su propia fila', () => {
    // 80 tiradas ganando el 50/50: 10,4 4★ × 17,52 = 182,2 (9 singles) antes del 5★; con sus 40, 222,2 (11 singles).
    const [row] = planPulls([pull('a', 'character', true)], { character: 0, lightCone: 0 }, 71, []);
    expect(row.netCost).toBe(80 - 11);
    expect(row.affordable).toBe(true);
    const [short] = planPulls([pull('a', 'character', true)], { character: 0, lightCone: 0 }, 70, []);
    expect(short.affordable).toBe(false);
  });

  it('sin contar la Cosmiluz, el coste neto es el de las tiradas', () => {
    const rows = planPulls([pull('a', 'character'), pull('b', 'lightCone')], { character: 0, lightCone: 0 }, 200, [], {
      countStarlight: false,
    });
    expect(rows.map((r) => r.netCost)).toEqual([160, 140]);
    expect(rows.map((r) => r.cumulative)).toEqual([160, 300]);
    expect(rows.map((r) => r.affordable)).toEqual([true, false]);
  });

  it('la Cosmiluz sobrante de una fila se aprovecha en la siguiente', () => {
    // 25 + 160 tiradas: 96,9 y 444,4 de Cosmiluz. Por separado serían 4 + 22 singles;
    // juntas, 541,4 → 27, sin perder los restos de cada fila.
    const rows = planPulls(
      [pull('a', 'character', true), pull('b', 'character')],
      { character: 55, lightCone: 0 },
      1000,
      [],
    );
    expect(rows.map((r) => r.cost)).toEqual([25, 160]);
    expect(rows.map((r) => Math.round(r.starlight))).toEqual([97, 444]);
    expect(rows.at(-1)?.cumulative).toBe(25 + 160 - 27);
  });

  it('fecha en la que se alcanzan las singles acumuladas', () => {
    const timeline: TimelinePoint[] = [
      { date: '2026-10-03', singles: 100, jades: 0 },
      { date: '2026-10-10', singles: 159.9, jades: 0 },
      { date: '2026-10-17', singles: 161, jades: 0 },
    ];
    const rows = planPulls([pull('a', 'character', true), pull('b', 'character')], { character: 0, lightCone: 0 }, 161, timeline);
    expect(rows[0].reachDate).toBe('2026-10-03');
    expect(rows[1].reachDate).toBeNull();
  });

  it('las tiradas por 5★ se pueden configurar (p. ej. 90 y 80)', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'lightCone', true)],
      { character: 50, lightCone: 0 },
      1000,
      [],
      { countStarlight: false, hardPity: { character: 90, lightCone: 80 } },
    );
    expect(rows.map((r) => r.cost)).toEqual([90 - 50 + 90, 80]);
    expect(rows[0].costDetail).toBe('90 − 50 + 90');
  });

  it('con el garantizado, la primera fila de ese banner se gana seguro; las siguientes, no', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'character'), pull('c', 'lightCone')],
      { character: 50, lightCone: 0 },
      1000,
      [],
      { countStarlight: false, guaranteed: { character: true, lightCone: false } },
    );
    expect(rows.map((r) => r.cost)).toEqual([80 - 50, 160, 140]);
    expect(rows.map((r) => r.guaranteed)).toEqual([true, false, false]);
    expect(rows[0].costDetail).toBe('80 − 50');
  });

  it('la Cosmiluz que sobra en el inventario se junta con la de las tiradas', () => {
    // 80 tiradas ganando: 222,2 de Cosmiluz → 11 singles. Con 19 más de antes: 241,2 → 12.
    const plan = [pull('a', 'character', true)];
    const without = planPulls(plan, { character: 0, lightCone: 0 }, 1000, []);
    const withLeftover = planPulls(plan, { character: 0, lightCone: 0 }, 1000, [], { initialStarlight: 19 });
    expect(without[0].netCost).toBe(80 - 11);
    expect(withLeftover[0].netCost).toBe(80 - 12);
  });

  it('el pity se limita al rango válido', () => {
    const [row] = planPulls([pull('a', 'character', true)], { character: 200, lightCone: 0 }, 0, []);
    expect(row.cost).toBe(1);
  });
});
