import {
  BANNERS,
  fiveStarChance,
  FOUR_STAR_PITY,
  FOUR_STAR_RATE,
  STARLIGHT_PER_4_STAR,
  STARLIGHT_PER_5_STAR,
  STARLIGHT_PER_AVERAGE_4_STAR,
  STARLIGHT_PER_PASS,
  targetStarlight,
} from './rules';
import type { RowCopy } from './dupes';
import type { Pity, PlannedPull, PullKind } from './types';

/*
 * Simulación con las probabilidades reales de los banners limitados (BANNERS, en rules.ts).
 * Los 4★ se cuentan por su media: 13 % por tirada con la Cosmiluz media de cada banner.
 */

/** Generador pseudoaleatorio con semilla: los resultados no cambian de un render a otro. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlanSimulation {
  runs: number;
  /**
   * Para cada objetivo, las singles que hacían falta en cada simulación para llegar hasta él
   * (incluidos los anteriores), ya descontada la Cosmiluz que se va cambiando. Ordenado de menor a mayor.
   */
  needed: Float64Array[];
}

/**
 * Probabilidad acumulada de tener el 5★ en las n primeras tiradas tras el último (cdf[n], cdf[0] = 0).
 * Se calcula una sola vez por banner.
 */
const CDF: Record<PullKind, Float64Array> = (() => {
  const build = (kind: PullKind) => {
    const hard = BANNERS[kind].hardPity;
    const cdf = new Float64Array(hard + 1);
    let survive = 1;
    for (let n = 1; n <= hard; n++) {
      survive *= 1 - fiveStarChance(kind, n);
      cdf[n] = 1 - survive;
    }
    cdf[hard] = 1;
    return cdf;
  };
  return { character: build('character'), lightCone: build('lightCone') };
})();

/**
 * Tiradas hasta el siguiente 5★ partiendo de `pity` tiradas ya hechas, sorteadas de una vez con la
 * distribución real (condicionada a no haberlo sacado aún): un solo número aleatorio por 5★.
 */
function sampleFiveStar(kind: PullKind, pity: number, u: number): number {
  const cdf = CDF[kind];
  const from = cdf[pity];
  const target = from + u * (1 - from);
  // Búsqueda binaria de la primera tirada con cdf ≥ target (cdf[hard] = 1 siempre lo cumple).
  let lo = pity + 1;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cdf[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo - pity;
}

/** Cosmiluz media de los 4★ por tirada en cada banner: 13 % de 4★ por la Cosmiluz media de uno. */
const STARLIGHT_PER_PULL_FROM_4_STARS: Record<PullKind, number> = {
  character: FOUR_STAR_RATE * STARLIGHT_PER_AVERAGE_4_STAR.character,
  lightCone: FOUR_STAR_RATE * STARLIGHT_PER_AVERAGE_4_STAR.lightCone,
};

export interface OddsOptions {
  /** Descontar la Cosmiluz que devuelven las tiradas. */
  countStarlight?: boolean;
  /** Banners en los que se perdió el último 50/50: su próximo 5★ es el destacado seguro. */
  guaranteed?: Record<PullKind, boolean>;
  /** Cosmiluz que ya se tiene sin cambiar (menos de 20): se junta con la que se saque. */
  initialStarlight?: number;
  /** Qué copia es cada fila (planCopies): decide la Cosmiluz de su 5★. Sin ella, cada personaje es nuevo. */
  copies?: readonly (RowCopy | null)[];
}

const NOT_GUARANTEED: Record<PullKind, boolean> = { character: false, lightCone: false };

/** Simulaciones de cada previsión: bastantes para un % estable, pocas para repetirla en cada tecla. */
export const RUNS = 10000;

/**
 * Simula el plan `runs` veces con presupuesto ilimitado y apunta cuántas singles hicieron falta
 * para cada objetivo. Con eso, la probabilidad de conseguir los i primeros con B singles es la
 * fracción de simulaciones en las que bastaba con B.
 *
 * En vez de tirada a tirada, sortea directamente cuántas tiradas tarda cada 5★ (y si es el
 * destacado), y cuenta los 4★ por su media: así cada simulación son unos pocos sorteos.
 *
 * Singles necesarias = el máximo de (tiradas hechas − singles que ya devolvía la Cosmiluz
 * obtenida antes), que se alcanza justo antes de cada 5★.
 */
export function simulatePlan(
  plan: readonly Pick<PlannedPull, 'kind'>[],
  pity: Pity,
  {
    countStarlight = true,
    guaranteed: startGuaranteed = NOT_GUARANTEED,
    initialStarlight = 0,
    copies = [],
  }: OddsOptions = {},
  runs = RUNS,
  seed = 20261003,
): PlanSimulation {
  const rand = mulberry32(seed);
  const needed = plan.map(() => new Float64Array(runs));
  const refund = (starlight: number) => (countStarlight ? Math.floor(starlight / STARLIGHT_PER_PASS) : 0);

  for (let r = 0; r < runs; r++) {
    const pity5: Record<PullKind, number> = {
      character: Math.min(pity.character, BANNERS.character.hardPity - 1),
      lightCone: Math.min(pity.lightCone, BANNERS.lightCone.hardPity - 1),
    };
    const guaranteed: Record<PullKind, boolean> = { ...startGuaranteed };
    let pulls = 0;
    let starlight = initialStarlight;
    let need = 0;

    for (let i = 0; i < plan.length; i++) {
      const kind = plan[i].kind;
      const perPull = STARLIGHT_PER_PULL_FROM_4_STARS[kind];
      const own = targetStarlight(kind, copies[i]?.eidolon ?? null);
      for (;;) {
        const n = sampleFiveStar(kind, pity5[kind], rand());
        pity5[kind] = 0;
        pulls += n;
        // La tirada del 5★ se paga con lo que devolvía la Cosmiluz de antes de ella (4★ por su media).
        const before = pulls - refund(starlight + perPull * (n - 1));
        if (before > need) need = before;
        const featured = guaranteed[kind] || rand() < BANNERS[kind].featuredChance;
        guaranteed[kind] = !featured;
        // El 5★ perdido (de la reserva estándar) se supone repetido; el buscado da según su copia.
        starlight += perPull * n + (featured ? own : STARLIGHT_PER_5_STAR);
        if (featured) break;
      }
      needed[i][r] = need;
    }
  }

  for (const arr of needed) arr.sort();
  return { runs, needed };
}

/** Fracción de valores de un array ordenado que son ≤ x. */
function fractionAtMost(sorted: Float64Array, x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return sorted.length === 0 ? 0 : lo / sorted.length;
}

const percentile = (sorted: Float64Array, q: number) =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

/**
 * Singles que garantizan conseguir los i primeros objetivos pase lo que pase (el peor caso absoluto):
 * cada 5★ en el pity duro, perdiendo todos los 50/50, y como Cosmiluz solo la mínima segura: la de cada 5★
 * (40 el perdido; el buscado, según su copia) y solo el 4★ garantizado cada 10 tiradas, del tipo que menos da:
 * - Banner de conos: siempre cono (8).
 * - Banner de personaje: si sale un cono (no destacado), el siguiente 4★ es un personaje destacado
 *   seguro, así que lo peor es alternar cono (8) y personaje (20).
 * Con menos singles, nunca es un 100 %.
 */
export function guaranteedNeeded(
  plan: PlannedPull[],
  pity: Pity,
  { countStarlight = true, guaranteed = NOT_GUARANTEED, initialStarlight = 0, copies = [] }: OddsOptions = {},
): number[] {
  const seen = new Set<PullKind>();
  let pulls = 0;
  let starlight = initialStarlight;
  // El 4★ garantizado cuenta por banner, como en el juego: las tiradas de un banner no adelantan el del otro.
  const bannerPulls: Record<PullKind, number> = { character: 0, lightCone: 0 };
  const fourStars: Record<PullKind, number> = { character: 0, lightCone: 0 };
  let characterFeaturedNext = false;
  let need = 0;

  // Apunta la Cosmiluz de los 4★ garantizados del banner `kind` hasta su tirada `upTo` (incluida).
  const creditFourStars = (upTo: number, kind: PullKind) => {
    for (; fourStars[kind] < Math.floor(upTo / FOUR_STAR_PITY); fourStars[kind]++) {
      if (kind === 'lightCone') {
        starlight += STARLIGHT_PER_4_STAR.lightCone;
      } else {
        starlight += characterFeaturedNext ? STARLIGHT_PER_4_STAR.character : STARLIGHT_PER_4_STAR.lightCone;
        characterFeaturedNext = !characterFeaturedNext;
      }
    }
  };
  const refund = () => (countStarlight ? Math.floor(starlight / STARLIGHT_PER_PASS) : 0);

  return plan.map((p, i) => {
    const hard = BANNERS[p.kind].hardPity;
    const isFirst = !seen.has(p.kind);
    const first = hard - (isFirst ? Math.min(hard - 1, pity[p.kind]) : 0);
    seen.add(p.kind);
    // Dos 5★ por objetivo (el perdido y el bueno), cada uno pagado con la Cosmiluz de antes de él;
    // solo uno si es el primero de un banner con el garantizado.
    const segments = isFirst && guaranteed[p.kind] ? [first] : [first, hard];
    segments.forEach((segment, j) => {
      pulls += segment;
      bannerPulls[p.kind] += segment;
      creditFourStars(bannerPulls[p.kind] - 1, p.kind);
      need = Math.max(need, pulls - refund());
      // El último 5★ es el buscado; el de antes, el perdido.
      starlight += j === segments.length - 1 ? targetStarlight(p.kind, copies[i]?.eidolon ?? null) : STARLIGHT_PER_5_STAR;
    });
    return need;
  });
}

export interface PlanOdds {
  /** Probabilidad de conseguir cada objetivo junto con todos los anteriores. */
  chances: number[];
  /** Probabilidad de conseguir todo el plan. */
  all: number;
  /** Objetivos que se esperan conseguir de media. */
  expectedTargets: number;
  /** Singles para completar todo el plan: con suerte media y en el 90 % de los casos. */
  medianNeeded: number;
  p90Needed: number;
}

export function planOdds(sim: PlanSimulation, budget: number): PlanOdds {
  const chances = sim.needed.map((arr) => fractionAtMost(arr, budget));
  const last = sim.needed.at(-1);
  return {
    chances,
    all: chances.at(-1) ?? 0,
    expectedTargets: chances.reduce((sum, c) => sum + c, 0),
    medianNeeded: last ? percentile(last, 0.5) : 0,
    p90Needed: last ? percentile(last, 0.9) : 0,
  };
}

/** La probabilidad de un objetivo para enseñarla: la simulada, salvo en los dos casos en que se sabe seguro. */
export interface ShownChance {
  p: number;
  /** Llega aunque todo salga en el pity duro (guaranteedNeeded): el único caso en que se dice 100 %. */
  certain: boolean;
  /** Ni siquiera hay una tirada por objetivo: el único caso en que se dice 0 %. */
  impossible: boolean;
}

export const shownChances = (chances: number[], sure: number[], budget: number): ShownChance[] =>
  chances.map((p, i) => ({ p, certain: budget >= sure[i], impossible: budget < i + 1 }));
