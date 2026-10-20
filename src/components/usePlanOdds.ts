import { useMemo } from 'react';
import type { Result } from '../engine/calculate';
import { guaranteedNeeded, planOdds, simulatePlan, type PlanOdds } from '../engine/odds';
import type { AppState } from '../engine/types';

/** Intentos de la simulación. */
export const RUNS = 10000;

export interface PlanOddsView {
  odds: PlanOdds;
  /** Singles que garantizan los i primeros objetivos pase lo que pase (el peor caso absoluto). */
  sure: number[];
  /** Probabilidad de cada objetivo (junto con los anteriores), ya escrita. */
  pct: string[];
}

/**
 * Porcentaje legible, sin decimales. Solo dice 100 % si llega aunque todo salga en el pity duro,
 * y 0 % si ni siquiera hay una single por objetivo; si no, como mucho ">99 %" y como poco "<1 %".
 */
function fmtPct(p: number, certain: boolean, impossible: boolean): string {
  // Espacio de no separación antes del %: no se queda solo en otra línea.
  if (certain) return '100 %';
  if (impossible) return '0 %';
  if (p > 0.99) return '>99 %';
  if (p < 0.01) return '<1 %';
  return `${Math.round(p * 100)} %`;
}

/**
 * La simulación del plan, una sola vez para la planificación (el % de cada fila) y la previsión
 * (las estadísticas). Null si no hay nada planificado.
 */
export function usePlanOdds(state: AppState, result: Result): PlanOddsView | null {
  const plan = state.plannedPulls;
  const { pity, guaranteed } = state;
  const { countStarlight } = state.settings;
  const budget = result.wholeSingles;
  const initialStarlight = result.starlightLeftover;

  // Solo importan el tipo y el orden de cada objetivo: cambiar un nombre no repite la simulación.
  const kinds = plan.map((p) => p.kind).join(',');
  const sim = useMemo(
    () => simulatePlan(plan, pity, { countStarlight, guaranteed, initialStarlight }, RUNS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kinds, pity.character, pity.lightCone, guaranteed.character, guaranteed.lightCone, countStarlight, initialStarlight],
  );

  if (plan.length === 0) return null;
  const odds = planOdds(sim, budget);
  const sure = guaranteedNeeded(plan, pity, { countStarlight, guaranteed, initialStarlight });
  const pct = plan.map((_, i) => fmtPct(odds.chances[i], budget >= sure[i], budget < i + 1));
  return { odds, sure, pct };
}
