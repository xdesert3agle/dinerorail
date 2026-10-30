import {
  DEFAULT_HARD_PITY,
  FOUR_STAR_RATE,
  STARLIGHT_PER_5_STAR,
  STARLIGHT_PER_AVERAGE_4_STAR,
  STARLIGHT_PER_PASS,
  targetStarlight,
} from './rules';
import type { RowCopy } from './dupes';
import type { Pity, PlannedPull, PullKind } from './types';

export interface PlannedPullResult {
  id: string;
  /** Tiradas que hacen falta en el peor caso. */
  cost: number;
  /** Las piezas del coste: pity duro − pity descontado + pity duro otra vez si se pierde el 50/50. */
  hardPity: number;
  /** Pity actual que se descuenta (0 si no es la primera fila de su tipo). */
  pityDiscount: number;
  /** Se cuenta el 50/50 perdido: el 5★ cuesta el doble. */
  losesFiftyFifty: boolean;
  /** Cosmiluz Inextinguible que se obtiene en esta fila (media esperada, con decimales). */
  starlight: number;
  /** Singles que cuesta de verdad la fila, descontando lo que devuelve la Cosmiluz. */
  netCost: number;
  /** Singles netas acumuladas hasta esta fila (incluida). */
  cumulative: number;
  /**
   * Singles que hacen falta para llegar al 5★ de esta fila (con las anteriores): como `cumulative`, pero sin la
   * Cosmiluz de su propio 5★, que llega después.
   */
  needed: number;
  /**
   * Llega con las singles disponibles (`needed` ≤ disponibles) y llegan todas las anteriores: el plan se tira en
   * orden, así que tras una fila que no llega ninguna llega, aunque la siguiente necesite menos.
   */
  affordable: boolean;
  /** Es la primera fila de su tipo y descuenta el pity actual. */
  usesPity: boolean;
  /** Es la primera fila de su tipo y se tiene el garantizado: se gana seguro, sin el 50/50. */
  guaranteed: boolean;
}

/**
 * La cuenta del plan: lo que cuestan las filas (sin la Cosmiluz), lo que la Cosmiluz devuelve y lo que sobra de
 * las tiradas disponibles (negativo: faltan). `available` es lo mismo que se pasó a planPulls.
 * Si alguna fila no llega, la cuenta es la de terminar el plan: hay que pasar por el `needed` de cada fila (la
 * Cosmiluz de un 5★ llega después de él), así que hacen falta las del mayor. La Cosmiluz reinvertida es la que
 * se obtendría por el camino. Así el pie nunca dice «Sobran» con una fila que no llega.
 */
export interface PlanBalance {
  gross: number;
  refunded: number;
  left: number;
}

export function planBalance(rows: PlannedPullResult[], available: number): PlanBalance {
  const net = rows.every((r) => r.affordable)
    ? (rows.at(-1)?.cumulative ?? 0)
    : Math.max(...rows.map((r) => r.needed));
  const gross = rows.reduce((sum, r) => sum + r.cost, 0);
  return { gross, refunded: gross - net, left: available - net };
}

/**
 * El pity que cuenta: el guardado (tal cual, aunque se haya bajado el máximo), limitado al máximo configurado
 * menos uno: en la tirada del máximo sale seguro. El único sitio que lo limita: lo usan el campo, el plan y la
 * previsión, así que todos ven el mismo valor.
 */
export function effectivePity(pity: Pity, hardPity = DEFAULT_HARD_PITY): Pity {
  const limit = (kind: PullKind) => Math.min(hardPity[kind] - 1, Math.max(0, Math.floor(pity[kind])));
  return { character: limit('character'), lightCone: limit('lightCone') };
}

export interface PlanOptions {
  /** Descontar la Cosmiluz que devuelven las tiradas. */
  countStarlight?: boolean;
  /** Tiradas por 5★ en cada banner (peor caso). */
  hardPity?: Record<PullKind, number>;
  /** Banners en los que se perdió el último 50/50: su próximo 5★ es el destacado seguro. */
  guaranteed?: Record<PullKind, boolean>;
  /** Cosmiluz que ya se tiene sin cambiar (menos de 20): se junta con la que se saque. */
  initialStarlight?: number;
  /** Qué copia es cada fila (planCopies): decide la Cosmiluz de su 5★. Sin ella, cada personaje es nuevo. */
  copies?: readonly (RowCopy | null)[];
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
    copies = [],
  }: PlanOptions = {},
): PlannedPullResult[] {
  const seen = new Set<PullKind>();
  let pulls = 0;
  let starlight = initialStarlight;
  let cumulative = 0;
  let reachable = true;
  const current = effectivePity(pity, hardPity);

  return plan.map((pull, i) => {
    const base = hardPity[pull.kind];
    const usesPity = !seen.has(pull.kind);
    seen.add(pull.kind);
    const progress = usesPity ? current[pull.kind] : 0;
    const isGuaranteed = usesPity && guaranteed[pull.kind];
    const wins = isGuaranteed || pull.winsFiftyFifty;
    const cost = base - progress + (wins ? 0 : base);

    // 4★ esperados en la fila (media, con decimales); la Cosmiluz se redondea solo al cambiarla por singles.
    const fourStars = cost * FOUR_STAR_RATE[pull.kind];
    const duringRow = fourStars * STARLIGHT_PER_AVERAGE_4_STAR[pull.kind] + (wins ? 0 : STARLIGHT_PER_5_STAR);
    const rowStarlight = duringRow + targetStarlight(pull.kind, copies[i]?.eidolon ?? null);
    pulls += cost;

    // Singles que devuelve una cantidad de Cosmiluz (0 si no se cuenta).
    const refund = (amount: number) => (countStarlight ? Math.floor(amount / STARLIGHT_PER_PASS) : 0);
    // Para llegar al 5★ solo cuenta la Cosmiluz obtenida antes de él.
    const needed = pulls - refund(starlight + duringRow);
    starlight += rowStarlight;
    const netCumulative = pulls - refund(starlight);
    const netCost = netCumulative - cumulative;
    cumulative = netCumulative;
    reachable &&= needed <= availableSingles;

    return {
      id: pull.id,
      cost,
      hardPity: base,
      pityDiscount: progress,
      losesFiftyFifty: !wins,
      starlight: rowStarlight,
      netCost,
      cumulative,
      needed,
      affordable: reachable,
      usesPity,
      guaranteed: isGuaranteed,
    };
  });
}
