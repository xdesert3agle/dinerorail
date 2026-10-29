import { describe, expect, it } from 'vitest';
import { effectivePity, planBalance, planPulls, type PlanOptions } from './pulls';
import type { PlannedPull } from './types';

const pull = (id: string, kind: PlannedPull['kind'], winsFiftyFifty = false): PlannedPull => ({
  id,
  name: id,
  kind,
  winsFiftyFifty,
});

// Personajes ya repetidos (de E1 a E6): su 5★ da 40 de Cosmiluz, como suponen las cuentas de estos tests.
const repeated = { copies: Array.from({ length: 5 }, () => ({ characterId: 'x', eidolon: 1 })) };

describe('planPulls', () => {
  it('el primer personaje descuenta el pity: 50 de pity y 50/50 perdido → 80 − 50 + 80 = 110', () => {
    const [aha] = planPulls([pull('aha', 'character')], { character: 50, lightCone: 0 }, 200);
    expect(aha.cost).toBe(110);
    expect([aha.hardPity, aha.pityDiscount, aha.losesFiftyFifty]).toEqual([80, 50, true]);
    expect(aha.usesPity).toBe(true);
  });

  it('los siguientes personajes empiezan de cero: 160 si pierde, 80 si gana', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'character'), pull('c', 'character', true)],
      { character: 50, lightCone: 0 },
      1000,
    );
    expect(rows.map((r) => r.cost)).toEqual([110, 160, 80]);
    expect(rows.map((r) => r.usesPity)).toEqual([true, false, false]);
    expect(rows.map((r) => r.pityDiscount)).toEqual([50, 0, 0]);
  });

  it('los conos tienen su propio pity de 70 (140 si pierde)', () => {
    const rows = planPulls(
      [pull('aha', 'character'), pull('cono', 'lightCone'), pull('cono2', 'lightCone', true)],
      { character: 50, lightCone: 20 },
      1000,
    );
    expect(rows.map((r) => r.cost)).toEqual([110, 70 - 20 + 70, 70]);
    expect(rows[1].usesPity).toBe(true);
  });

  it('ganar el 50/50 con pity: solo lo que falta para el pity', () => {
    const [row] = planPulls([pull('a', 'character', true)], { character: 30, lightCone: 0 }, 100);
    expect(row.cost).toBe(50);
    expect([row.hardPity, row.pityDiscount, row.losesFiftyFifty]).toEqual([80, 30, false]);
  });

  it('acumula, resta de las singles disponibles y marca lo que no llega', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'lightCone')],
      { character: 0, lightCone: 0 },
      200,
      repeated,
    );
    // Fila 1 (personaje): 160 tiradas → 20,8 4★ × 17,52 (364,4) + 2 5★ (80) = 444,4 de Cosmiluz → 22 singles.
    // Fila 2 (cono): 140 tiradas → 18,2 4★ × 9,06 (164,8) + 80 = 244,8 → 689,2 en total, 34 singles.
    expect(rows.map((r) => Math.round(r.starlight))).toEqual([444, 245]);
    expect(rows.map((r) => r.netCost)).toEqual([138, 128]);
    expect(rows.map((r) => r.cumulative)).toEqual([138, 266]);
    expect(rows.map((r) => r.remaining)).toEqual([62, -66]);
    expect(rows.map((r) => r.affordable)).toEqual([true, false]);
  });

  it('la Cosmiluz del 5★ buscado no paga su propia fila', () => {
    // 80 tiradas ganando el 50/50: 10,4 4★ × 17,52 = 182,2 (9 singles) antes del 5★; con sus 40, 222,2 (11 singles).
    const [row] = planPulls([pull('a', 'character', true)], { character: 0, lightCone: 0 }, 71, repeated);
    expect(row.netCost).toBe(80 - 11);
    expect(row.affordable).toBe(true);
    const [short] = planPulls([pull('a', 'character', true)], { character: 0, lightCone: 0 }, 70, repeated);
    expect(short.affordable).toBe(false);
  });

  it('sin contar la Cosmiluz, el coste neto es el de las tiradas', () => {
    const rows = planPulls([pull('a', 'character'), pull('b', 'lightCone')], { character: 0, lightCone: 0 }, 200, {
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
      repeated,
    );
    expect(rows.map((r) => r.cost)).toEqual([25, 160]);
    expect(rows.map((r) => Math.round(r.starlight))).toEqual([97, 444]);
    expect(rows.at(-1)?.cumulative).toBe(25 + 160 - 27);
  });

  it('las tiradas por 5★ se pueden configurar (p. ej. 90 y 80)', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'lightCone', true)],
      { character: 50, lightCone: 0 },
      1000,
      { countStarlight: false, hardPity: { character: 90, lightCone: 80 } },
    );
    expect(rows.map((r) => r.cost)).toEqual([90 - 50 + 90, 80]);
    expect([rows[0].hardPity, rows[0].pityDiscount, rows[0].losesFiftyFifty]).toEqual([90, 50, true]);
  });

  it('con el garantizado, la primera fila de ese banner se gana seguro; las siguientes, no', () => {
    const rows = planPulls(
      [pull('a', 'character'), pull('b', 'character'), pull('c', 'lightCone')],
      { character: 50, lightCone: 0 },
      1000,
      { countStarlight: false, guaranteed: { character: true, lightCone: false } },
    );
    expect(rows.map((r) => r.cost)).toEqual([80 - 50, 160, 140]);
    expect(rows.map((r) => r.guaranteed)).toEqual([true, false, false]);
    expect([rows[0].hardPity, rows[0].pityDiscount, rows[0].losesFiftyFifty]).toEqual([80, 50, false]);
  });

  it('la Cosmiluz que sobra en el inventario se junta con la de las tiradas', () => {
    // 80 tiradas ganando: 222,2 de Cosmiluz → 11 singles. Con 19 más de antes: 241,2 → 12.
    const plan = [pull('a', 'character', true)];
    const without = planPulls(plan, { character: 0, lightCone: 0 }, 1000, repeated);
    const withLeftover = planPulls(plan, { character: 0, lightCone: 0 }, 1000, { ...repeated, initialStarlight: 19 });
    expect(without[0].netCost).toBe(80 - 11);
    expect(withLeftover[0].netCost).toBe(80 - 12);
  });

  it('la Cosmiluz del 5★ buscado depende de su copia: nuevo 0, repetido 40, tras E6 100; un cono, siempre 40', () => {
    // Personaje: 80 tiradas ganando el 50/50, 182,2 de los 4★ más la del 5★. Cono: 70 tiradas, 82,5 más 40.
    const plan = [pull('a', 'character', true), pull('b', 'lightCone', true)];
    const pity = { character: 0, lightCone: 0 };
    const starlightOf = (copies?: PlanOptions['copies']) =>
      planPulls(plan, pity, 1000, { copies }).map((r) => Math.round(r.starlight));
    const copy = (eidolon: number) => [{ characterId: 'a', eidolon }, null];
    expect(starlightOf(copy(0))).toEqual([182, 122]);
    expect(starlightOf(copy(1))).toEqual([222, 122]);
    expect(starlightOf(copy(6))).toEqual([222, 122]);
    expect(starlightOf(copy(7))).toEqual([282, 122]);
    // Sin saber qué copia es (sin catálogo o fuera de él), el personaje cuenta como nuevo: lo seguro.
    expect(starlightOf([null, null])).toEqual([182, 122]);
    expect(starlightOf()).toEqual([182, 122]);
  });

  it('el pity se limita al rango válido', () => {
    const [row] = planPulls([pull('a', 'character', true)], { character: 200, lightCone: 0 }, 0);
    expect(row.cost).toBe(1);
  });
});

describe('planBalance', () => {
  it('coste de las filas, lo que devuelve la Cosmiluz y lo que sobra o falta', () => {
    const plan = [pull('a', 'character'), pull('b', 'lightCone')];
    const rows = planPulls(plan, { character: 0, lightCone: 0 }, 200, repeated);
    // 160 + 140 de coste; la Cosmiluz devuelve 34 (ver el test de la acumulación): netas 266.
    expect(planBalance(rows, 200)).toEqual({ gross: 300, refunded: 34, left: -66 });
    expect(planBalance([], 50)).toEqual({ gross: 0, refunded: 0, left: 50 });
  });
});

describe('effectivePity', () => {
  it('el guardado, entero y entre 0 y el máximo configurado − 1', () => {
    expect(effectivePity({ character: 85, lightCone: -2 })).toEqual({ character: 79, lightCone: 0 });
    expect(effectivePity({ character: 85.6, lightCone: 30 }, { character: 90, lightCone: 80 })).toEqual({ character: 85, lightCone: 30 });
  });
});
