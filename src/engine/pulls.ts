import type { TimelinePoint } from './calculate';
import type { ISODate, Pity, PlannedPull, PullKind } from './types';

/** Tiradas hasta el 5★ garantizado por pity, si no se configura otra cosa. */
export const DEFAULT_HARD_PITY: Record<PullKind, number> = { character: 80, lightCone: 70 };

/*
 * Cosmiluz Inextinguible que se recupera al tirar. En la tienda, 20 de Cosmiluz = 1 Pase Especial.
 * - 5★ (personaje repetido o cono): 40. Un personaje 5★ más allá de E6 da 100, pero se supone que no.
 * - 4★: 13 % por tirada, la probabilidad consolidada oficial (5,1 % base con el garantizado cada 10).
 *   Personaje 4★ (siempre en E6): 20. Cono 4★: 8.
 * - Qué 4★ sale: uno de los 3 destacados (personajes en su banner, conos en el de conos) con un
 *   50 % / 75 %, y si no sale, el siguiente lo es seguro. Si no es destacado, es cualquiera de la
 *   reserva (22 personajes y 31 conos) menos los 3 destacados de ese banner.
 */
export const STARLIGHT_PER_5_STAR = 40;
export const STARLIGHT_PER_5_STAR_E6 = 100;
export const STARLIGHT_PER_4_STAR = { character: 20, lightCone: 8 } as const;
export const STARLIGHT_PER_PASS = 20;
export const FOUR_STAR_RATE = 0.13;
/** Probabilidad de que el 4★ sea el destacado, en cada banner (sin contar el garantizado). */
export const FOUR_STAR_FEATURED_CHANCE: Record<PullKind, number> = { character: 0.5, lightCone: 0.75 };
/** Reserva total de 4★ y cuántos están destacados en cada banner (y no salen como no destacados). */
export const FOUR_STAR_POOL = { characters: 22, lightCones: 31 } as const;
export const FEATURED_4_STARS = 3;

/** Tiradas que hacen falta de media para cada 4★ (≈ 7,69). */
export const PULLS_PER_4_STAR = 1 / FOUR_STAR_RATE;

/**
 * Cosmiluz media de un 4★ en cada banner. Con el garantizado, la parte de destacados es 1 / (2 − p):
 * 2/3 en el de personaje y 4/5 en el de conos. El resto sale de la reserva sin los 3 destacados:
 * 19 personajes y 31 conos en el de personaje; 22 personajes y 28 conos en el de conos.
 * Personaje ≈ 17,5; cono ≈ 9,06.
 */
export const STARLIGHT_PER_AVERAGE_4_STAR: Record<PullKind, number> = (() => {
  const average = (kind: PullKind) => {
    const characters = FOUR_STAR_POOL.characters - (kind === 'character' ? FEATURED_4_STARS : 0);
    const lightCones = FOUR_STAR_POOL.lightCones - (kind === 'lightCone' ? FEATURED_4_STARS : 0);
    const fromPool =
      (characters * STARLIGHT_PER_4_STAR.character + lightCones * STARLIGHT_PER_4_STAR.lightCone) /
      (characters + lightCones);
    const featuredShare = 1 / (2 - FOUR_STAR_FEATURED_CHANCE[kind]);
    return featuredShare * STARLIGHT_PER_4_STAR[kind] + (1 - featuredShare) * fromPool;
  };
  return { character: average('character'), lightCone: average('lightCone') };
})();

export interface PlannedPullResult {
  id: string;
  /** Tiradas que hacen falta en el peor caso. */
  cost: number;
  /** Desglose legible de las tiradas, p. ej. "80 − 50 + 80". */
  costDetail: string;
  /** Cosmiluz Inextinguible que se obtiene en esta fila (media esperada, con decimales). */
  starlight: number;
  /** Singles que cuesta de verdad la fila, descontando lo que devuelve la Cosmiluz. */
  netCost: number;
  /** Singles netas acumuladas hasta esta fila (incluida). */
  cumulative: number;
  /** Singles que quedan tras esta fila (negativo = faltan). */
  remaining: number;
  affordable: boolean;
  /** Primer día en el que se tienen las singles necesarias, o null si no llega antes de la fecha objetivo. */
  reachDate: ISODate | null;
  /** Es la primera fila de su tipo y descuenta el pity actual. */
  usesPity: boolean;
  /** Es la primera fila de su tipo y se tiene el garantizado: se gana seguro, sin el 50/50. */
  guaranteed: boolean;
}

export const clampPity = (kind: PullKind, value: number, hardPity = DEFAULT_HARD_PITY) =>
  Math.min(hardPity[kind] - 1, Math.max(0, Math.floor(value)));

export interface PlanOptions {
  /** Descontar la Cosmiluz que devuelven las tiradas. */
  countStarlight?: boolean;
  /** Tiradas por 5★ en cada banner (peor caso). */
  hardPity?: Record<PullKind, number>;
  /** Banners en los que se perdió el último 50/50: su próximo 5★ es el destacado seguro. */
  guaranteed?: Record<PullKind, boolean>;
  /** Cosmiluz que ya se tiene sin cambiar (menos de 20): se junta con la que se saque. */
  initialStarlight?: number;
}

/**
 * Calcula el coste de cada tirada planificada en el peor caso (siempre al pity duro).
 * La primera de cada tipo descuenta el pity actual, y si se tiene el garantizado no puede perder
 * el 50/50; las siguientes empiezan de cero.
 *
 * La Cosmiluz se va cambiando por Pases según se obtiene, así que abarata la propia fila y las
 * siguientes. Solo el 5★ que se busca llega al final de la fila: su Cosmiluz sirve para las
 * siguientes filas, no para pagar esa misma.
 */
export function planPulls(
  plan: PlannedPull[],
  pity: Pity,
  availableSingles: number,
  timeline: TimelinePoint[],
  {
    countStarlight = true,
    hardPity = DEFAULT_HARD_PITY,
    guaranteed = { character: false, lightCone: false },
    initialStarlight = 0,
  }: PlanOptions = {},
): PlannedPullResult[] {
  const seen = new Set<PullKind>();
  let pulls = 0;
  let starlight = initialStarlight;
  let cumulative = 0;

  return plan.map((pull) => {
    const base = hardPity[pull.kind];
    const usesPity = !seen.has(pull.kind);
    seen.add(pull.kind);
    const progress = usesPity ? clampPity(pull.kind, pity[pull.kind], hardPity) : 0;
    const isGuaranteed = usesPity && guaranteed[pull.kind];
    const wins = isGuaranteed || pull.winsFiftyFifty;
    const cost = base - progress + (wins ? 0 : base);

    const parts = [String(base)];
    if (progress > 0) parts.push(`− ${progress}`);
    if (!wins) parts.push(`+ ${base}`);

    // 4★ esperados en la fila (media, con decimales); la Cosmiluz se redondea solo al cambiarla por singles.
    const fourStars = cost / PULLS_PER_4_STAR;
    const duringRow = fourStars * STARLIGHT_PER_AVERAGE_4_STAR[pull.kind] + (wins ? 0 : STARLIGHT_PER_5_STAR);
    const rowStarlight = duringRow + STARLIGHT_PER_5_STAR;
    pulls += cost;

    // Singles que devuelve una cantidad de Cosmiluz (0 si no se cuenta).
    const refund = (amount: number) => (countStarlight ? Math.floor(amount / STARLIGHT_PER_PASS) : 0);
    // Para llegar al 5★ solo cuenta la Cosmiluz obtenida antes de él.
    const needed = pulls - refund(starlight + duringRow);
    starlight += rowStarlight;
    const netCumulative = pulls - refund(starlight);
    const netCost = netCumulative - cumulative;
    cumulative = netCumulative;

    const reached = timeline.find((p) => Math.floor(p.singles + 1e-9) >= needed);
    return {
      id: pull.id,
      cost,
      costDetail: parts.join(' '),
      starlight: rowStarlight,
      netCost,
      cumulative,
      remaining: availableSingles - cumulative,
      affordable: needed <= availableSingles,
      reachDate: reached ? reached.date : null,
      usesPity,
      guaranteed: isGuaranteed,
    };
  });
}
