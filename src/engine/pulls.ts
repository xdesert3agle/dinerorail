import {
  DEFAULT_HARD_PITY,
  PULLS_PER_4_STAR,
  STARLIGHT_PER_5_STAR,
  STARLIGHT_PER_AVERAGE_4_STAR,
  STARLIGHT_PER_PASS,
} from './rules';
import type { Pity, PlannedPull, PullKind } from './types';

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

    return {
      id: pull.id,
      cost,
      costDetail: parts.join(' '),
      starlight: rowStarlight,
      netCost,
      cumulative,
      remaining: availableSingles - cumulative,
      affordable: needed <= availableSingles,
      usesPity,
      guaranteed: isGuaranteed,
    };
  });
}
