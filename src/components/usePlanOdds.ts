import { useMemo } from 'react';
import type { Result } from '../engine/calculate';
import type { RowCopy } from '../engine/dupes';
import { guaranteedNeeded, planOdds, shownChances, simulatePlan, type PlanOdds } from '../engine/odds';
import { effectivePity } from '../engine/pulls';
import type { AppState } from '../engine/types';
import { fmtChance } from './format';

export interface PlanOddsView {
  odds: PlanOdds;
  /** Singles que garantizan los i primeros objetivos pase lo que pase (el peor caso absoluto). */
  sure: number[];
  /** Probabilidad de cada objetivo (junto con los anteriores), ya escrita. */
  pct: string[];
}

/**
 * La simulación del plan, una sola vez para la planificación (el % de cada fila) y la previsión
 * (las estadísticas). Null si no hay nada planificado. `copies` (planCopies) decide la Cosmiluz de cada 5★ buscado.
 */
export function usePlanOdds(state: AppState, result: Result, copies: readonly (RowCopy | null)[]): PlanOddsView | null {
  const plan = state.plannedPulls;
  const { guaranteed } = state;
  const { countStarlight, hardPity } = state.settings;
  const pity = effectivePity(state.pity, hardPity);
  const budget = result.wholeSingles;
  const initialStarlight = result.starlightLeftover;

  const sim = useMemo(
    () => simulatePlan(plan, pity, { countStarlight, guaranteed, initialStarlight, copies }),
    [plan, pity.character, pity.lightCone, guaranteed.character, guaranteed.lightCone, countStarlight, initialStarlight, copies],
  );

  if (plan.length === 0) return null;
  const odds = planOdds(sim, budget);
  const sure = guaranteedNeeded(plan, pity, { countStarlight, guaranteed, initialStarlight, copies });
  const pct = shownChances(odds.chances, sure, budget).map(fmtChance);
  return { odds, sure, pct };
}
