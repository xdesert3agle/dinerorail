import { describe, expect, it } from 'vitest';
import { BANNERS, fiveStarChance, guaranteedNeeded, planOdds, simulatePlan } from './odds';
import type { PlannedPull, PullKind } from './types';

const pull = (id: string, kind: PullKind): PlannedPull => ({ id, name: id, kind, winsFiftyFifty: false });

/** Tiradas medias hasta un 5★ según el modelo: suma de la probabilidad de seguir sin él. */
function meanPullsTo5Star(kind: PullKind): number {
  let survive = 1;
  let mean = 0;
  for (let n = 1; n <= BANNERS[kind].hardPity; n++) {
    mean += survive;
    survive *= 1 - fiveStarChance(kind, n);
  }
  return mean;
}

describe('probabilidades', () => {
  it('el modelo reproduce las tasas consolidadas oficiales (1,6 % personaje, 1,87 % cono)', () => {
    expect(1 / meanPullsTo5Star('character')).toBeCloseTo(0.016, 3);
    expect(1 / meanPullsTo5Star('lightCone')).toBeCloseTo(0.0187, 3);
  });

  it('el pity duro garantiza el 5★', () => {
    expect(fiveStarChance('character', 90)).toBe(1);
    expect(fiveStarChance('lightCone', 80)).toBe(1);
    expect(fiveStarChance('character', 10)).toBe(0.006);
  });

  it('con 0 singles no se consigue nada y con muchas se consigue todo', () => {
    const sim = simulatePlan([pull('a', 'character'), pull('b', 'lightCone')], { character: 0, lightCone: 0 }, {}, 2000);
    expect(planOdds(sim, 0)).toMatchObject({ chances: [0, 0], all: 0, expectedTargets: 0 });
    expect(planOdds(sim, 1000)).toMatchObject({ chances: [1, 1], all: 1, expectedTargets: 2 });
  });

  it('cada objetivo es igual o menos probable que el anterior', () => {
    const sim = simulatePlan([pull('a', 'character'), pull('b', 'lightCone'), pull('c', 'character')], { character: 0, lightCone: 0 }, {}, 3000);
    const { chances } = planOdds(sim, 250);
    expect(chances[1]).toBeLessThanOrEqual(chances[0]);
    expect(chances[2]).toBeLessThanOrEqual(chances[1]);
  });

  it('el pity actual ayuda', () => {
    const plan = [pull('a', 'character')];
    const fresh = planOdds(simulatePlan(plan, { character: 0, lightCone: 0 }, {}, 4000), 120);
    const withPity = planOdds(simulatePlan(plan, { character: 60, lightCone: 0 }, {}, 4000), 120);
    expect(withPity.all).toBeGreaterThan(fresh.all);
    // Un personaje sin pity con 120 singles: entre la mitad y tres cuartos de las veces.
    expect(fresh.all).toBeGreaterThan(0.5);
    expect(fresh.all).toBeLessThan(0.8);
  });

  it('la Cosmiluz reduce las singles necesarias', () => {
    const plan = [pull('a', 'character'), pull('b', 'lightCone')];
    const withStarlight = planOdds(simulatePlan(plan, { character: 0, lightCone: 0 }, {}, 3000), 0);
    const without = planOdds(simulatePlan(plan, { character: 0, lightCone: 0 }, { countStarlight: false }, 3000), 0);
    expect(withStarlight.medianNeeded).toBeLessThan(without.medianNeeded);
    expect(withStarlight.p90Needed).toBeGreaterThanOrEqual(withStarlight.medianNeeded);
  });

  it('singles que lo garantizan todo: pity duro y 50/50 perdidos, descontando el pity actual', () => {
    const plan = [pull('a', 'character'), pull('b', 'character'), pull('c', 'lightCone')];
    // Sin Cosmiluz: 90 − 50 + 90, + 180, + 160 − 20.
    expect(guaranteedNeeded(plan, { character: 50, lightCone: 20 }, { countStarlight: false })).toEqual([130, 310, 450]);
    // Con la Cosmiluz mínima: la tirada 130 se paga con 1 5★ (40) y 12 4★ alternando cono y personaje
    // (6 × 8 + 6 × 20 = 168) → 208 → 10 singles.
    const withStarlight = guaranteedNeeded(plan, { character: 50, lightCone: 20 });
    expect(withStarlight[0]).toBe(130 - 10);
    expect(withStarlight.every((v, i) => v < [130, 310, 450][i])).toBe(true);
  });

  it('peor caso en el banner de conos: todos los 4★ son conos (8)', () => {
    // 80 tiradas al 5★ perdido: 7 4★ × 8 = 56 → 2 singles; el bueno, en la 160: 40 + 15 × 8 = 160 → 8.
    expect(guaranteedNeeded([pull('c', 'lightCone')], { character: 0, lightCone: 0 })).toEqual([160 - 8]);
  });

  it('con el garantizado, el primer objetivo de ese banner se consigue antes', () => {
    const plan = [pull('a', 'character'), pull('b', 'character')];
    const pity = { character: 0, lightCone: 0 };
    const guaranteed = { character: true, lightCone: false };
    // Peor caso: el primero solo necesita un 5★ (90) en vez de dos (180).
    expect(guaranteedNeeded(plan, pity, { countStarlight: false, guaranteed })).toEqual([90, 270]);
    const fresh = planOdds(simulatePlan(plan, pity, {}, 4000), 90);
    const withGuarantee = planOdds(simulatePlan(plan, pity, { guaranteed }, 4000), 90);
    expect(withGuarantee.chances[0]).toBeGreaterThan(fresh.chances[0]);
  });

  it('el peor caso absoluto nunca es menor que el 90 % de la simulación', () => {
    const plan = [pull('a', 'character'), pull('b', 'lightCone')];
    const sim = simulatePlan(plan, { character: 0, lightCone: 0 }, {}, 3000);
    expect(guaranteedNeeded(plan, { character: 0, lightCone: 0 }).at(-1)).toBeGreaterThanOrEqual(planOdds(sim, 0).p90Needed);
  });
});
