import { useMemo } from 'react';
import type { Result } from '../engine/calculate';
import type { RowCopy } from '../engine/dupes';
import { guaranteedNeeded, planOdds, shownChances, simulatePlan, type PlanOdds } from '../engine/odds';
import { effectivePity } from '../engine/pulls';
import type { AppState } from '../engine/types';
import { fmtChance } from './format';

export interface PlanOddsView {
  odds: PlanOdds;
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

  // De cada fila, la simulación solo usa su tipo y su copia (de la que sale la Cosmiluz del 5★ buscado). Con eso
  // como clave, no se repite cuando cambia otra cosa del plan (el nombre, el 50/50) ni cuando plan o copies son
  // solo arrays nuevos con lo mismo: son 10.000 vueltas, a 2-35 ms según las filas, y más en un móvil.
  const rowsKey = plan.map((p, i) => `${p.kind}:${copies[i]?.eidolon ?? '-'}`).join('|');
  const sim = useMemo(
    () => simulatePlan(plan, pity, { countStarlight, guaranteed, initialStarlight, copies }),
    // plan y copies entran por rowsKey.
    [rowsKey, pity.character, pity.lightCone, guaranteed.character, guaranteed.lightCone, countStarlight, initialStarlight],
  );

  if (plan.length === 0) return null;
  const odds = planOdds(sim, budget);
  // Solo se dice 100 % si llega con la peor suerte posible (guaranteedNeeded).
  const sure = guaranteedNeeded(plan, pity, { countStarlight, guaranteed, initialStarlight, copies });
  const pct = shownChances(odds.chances, sure, budget).map(fmtChance);
  return { odds, pct };
}
