import { JADES_PER_PULL } from './defaults';
import { fromDayNum, toDayNum } from './dates';
import { packsTotal } from './packs';
import { STARLIGHT_PER_PASS } from './pulls';
import { occurrences } from './sources';
import type { AppState, ISODate, IncomeEvent, Patch, Reward } from './types';

export const PATCH_EVENTS_ID = 'patch-events';
export const SHARD_PACKS_ID = 'shard-packs';

export interface SourceTotal {
  sourceId: string;
  name: string;
  /** Número de cobros en el periodo. */
  count: number;
  reward: Reward;
  singles: number;
}

export interface TimelinePoint {
  date: ISODate;
  /** Singles acumuladas (inventario incluido). */
  singles: number;
  jades: number;
}

export interface Result {
  valid: boolean;
  today: ISODate;
  targetDate: ISODate;
  days: number;
  income: Reward;
  incomeSingles: number;
  /** Inventario + ingresos. Las Esquirlas ya van sumadas en `jades` si están incluidas. */
  final: Reward;
  /** Esquirlas Oníricas sumadas a `final.jades` (0 si no se cuentan). */
  shards: number;
  /** Pases Especiales que salen de la Cosmiluz que ya se tiene (sumados a `final.specialPasses`). */
  starlightPasses: number;
  /** Cosmiluz que sobra tras cambiarla (menos de 20): se junta con la que se saque al tirar. */
  starlightLeftover: number;
  /** Singles exactas (con decimales). */
  singles: number;
  wholeSingles: number;
  leftoverJades: number;
  bySource: SourceTotal[];
  timeline: TimelinePoint[];
  patches: Patch[];
}

const zero = (): Reward => ({ jades: 0, specialPasses: 0 });

function add(into: Reward, r: Reward): void {
  into.jades += r.jades;
  into.specialPasses += r.specialPasses;
}

/** Singles que vale una recompensa. */
export function toSingles(r: Reward): number {
  return r.jades / JADES_PER_PULL + r.specialPasses;
}

const MAX_TIMELINE_POINTS = 400;

/** Genera todos los cobros con fecha entre hoy y la fecha objetivo. */
export function buildEvents(state: AppState, today: ISODate): { events: IncomeEvent[]; patches: Patch[] } {
  const todayNum = toDayNum(today);
  const from = todayNum + 1;
  const to = toDayNum(state.targetDate);
  // Solo cuentan los parches de la tabla: no se extrapolan parches futuros.
  const patches = [...state.patches].sort((a, b) => a.start.localeCompare(b.start));
  const patchStarts = patches.map((p) => toDayNum(p.start));
  const events: IncomeEvent[] = [];

  for (const source of state.sources) {
    if (!source.enabled) continue;
    if (source.pendingNow && source.schedule.type !== 'perPatch' && to >= todayNum) {
      events.push({ date: today, sourceId: source.id, reward: source.reward });
    }
    for (const day of occurrences(source.schedule, from, to, patchStarts)) {
      events.push({ date: fromDayNum(day), sourceId: source.id, reward: source.reward });
    }
  }

  // Eventos de cada parche, cada uno en su fecha de cobro.
  for (const patch of patches) {
    for (const ev of patch.events) {
      const day = toDayNum(ev.date);
      if (day >= from && day <= to && (ev.jades || ev.specialPasses)) {
        events.push({ date: ev.date, sourceId: PATCH_EVENTS_ID, reward: { jades: ev.jades, specialPasses: ev.specialPasses } });
      }
    }
  }

  // Paquetes de Esquirlas: se cuentan como comprados hoy y se cambian 1:1 por Jades.
  const packs = packsTotal(state.shardPacks).shards;
  if (packs > 0 && to >= todayNum) {
    events.push({ date: today, sourceId: SHARD_PACKS_ID, reward: { jades: packs, specialPasses: 0 } });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return { events, patches: patches.filter((p) => toDayNum(p.start) <= to) };
}

export function calculate(state: AppState, today: ISODate): Result {
  const todayNum = toDayNum(today);
  const to = toDayNum(state.targetDate);
  const valid = to >= todayNum;
  const { events, patches } = valid ? buildEvents(state, today) : { events: [], patches: [] };

  const inv = state.inventory;
  const shards = state.settings.includeShards ? inv.shards : 0;
  // La Cosmiluz que ya se tiene se cambia por Pases en la tienda (20 = 1); lo que sobra se guarda
  // para juntarlo con la que se saque al tirar.
  const starlightPasses = Math.floor(inv.starlight / STARLIGHT_PER_PASS);
  const start: Reward = { jades: inv.jades + shards, specialPasses: inv.specialPasses + starlightPasses };

  const income = zero();
  const totals = new Map<string, SourceTotal>();
  const names = new Map(state.sources.map((s) => [s.id, s.name]));
  names.set(PATCH_EVENTS_ID, 'Eventos del parche');
  names.set(SHARD_PACKS_ID, 'Paquetes de Esquirlas Oníricas');
  const perDay = new Map<ISODate, Reward>();

  for (const e of events) {
    add(income, e.reward);
    let t = totals.get(e.sourceId);
    if (!t) {
      t = { sourceId: e.sourceId, name: names.get(e.sourceId) ?? e.sourceId, count: 0, reward: zero(), singles: 0 };
      totals.set(e.sourceId, t);
    }
    t.count++;
    add(t.reward, e.reward);
    const day = perDay.get(e.date) ?? zero();
    add(day, e.reward);
    perDay.set(e.date, day);
  }
  for (const t of totals.values()) t.singles = toSingles(t.reward);

  const final = { ...start };
  add(final, income);

  // Serie acumulada día a día, con muestreo si el periodo es muy largo (siempre incluye el último día).
  const timeline: TimelinePoint[] = [];
  if (valid) {
    const step = Math.max(1, Math.ceil((to - todayNum + 1) / MAX_TIMELINE_POINTS));
    const running = { ...start };
    for (let d = todayNum; d <= to; d++) {
      const date = fromDayNum(d);
      const day = perDay.get(date);
      if (day) add(running, day);
      if ((d - todayNum) % step === 0 || d === to) {
        timeline.push({ date, singles: toSingles(running), jades: running.jades });
      }
    }
  }

  const jades = Math.max(0, final.jades);
  return {
    valid,
    today,
    targetDate: state.targetDate,
    days: Math.max(0, to - todayNum),
    income,
    incomeSingles: toSingles(income),
    final,
    shards,
    starlightPasses,
    starlightLeftover: inv.starlight - starlightPasses * STARLIGHT_PER_PASS,
    singles: toSingles(final),
    wholeSingles: Math.floor(jades / JADES_PER_PULL) + final.specialPasses,
    leftoverJades: jades % JADES_PER_PULL,
    bySource: [...totals.values()].sort((a, b) => b.singles - a.singles),
    timeline,
    patches,
  };
}
