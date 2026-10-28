import { useMemo } from 'react';
import type { Result } from '../engine/calculate';
import { guaranteedNeeded, planOdds, shownChances, simulatePlan, type PlanOdds, type ShownChance } from '../engine/odds';
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
 * Porcentaje legible, sin decimales. 100 % y 0 % solo en los casos seguros (shownChances); si no, como mucho
 * ">99 %" y como poco "<1 %".
 */
function fmtPct({ p, certain, impossible }: ShownChance): string {
  // Espacio de no separación antes del %: no se queda solo en otra línea.
  if (certain) return '100 %';
  if (impossible) return '0 %';
  if (p > 0.99) return '>99 %';
  if (p < 0.01) return '<1 %';
  return `${Math.round(p * 100)} %`;
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

  // Solo importan el tipo y el orden de cada objetivo: cambiar un nombre no repite la simulación. Por eso las
  // dependencias llevan `kinds` (el texto) y no `plan`, aunque la simulación lea `plan`.
  const kinds = plan.map((p) => p.kind).join(',');
  const sim = useMemo(
    () => simulatePlan(plan, pity, { countStarlight, guaranteed, initialStarlight }, RUNS),
    [kinds, pity.character, pity.lightCone, guaranteed.character, guaranteed.lightCone, countStarlight, initialStarlight],
  );

  if (plan.length === 0) return null;
  const odds = planOdds(sim, budget);
  const sure = guaranteedNeeded(plan, pity, { countStarlight, guaranteed, initialStarlight });
  const pct = shownChances(odds.chances, sure, budget).map(fmtPct);
  return { odds, sure, pct };
}
