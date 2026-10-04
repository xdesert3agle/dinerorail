import { dayOfMonth, toDayNum, weekdayOf } from './dates';
import type { Schedule } from './types';

/**
 * Días (como número de día) en los que se cobra una fuente dentro de [from, to], ambos incluidos.
 * `patchStarts` solo se usa para las fuentes por parche.
 */
export function occurrences(schedule: Schedule, from: number, to: number, patchStarts: number[]): number[] {
  const days: number[] = [];
  if (to < from) return days;

  switch (schedule.type) {
    case 'daily':
      for (let d = from; d <= to; d++) days.push(d);
      break;
    case 'weekly': {
      const first = from + ((schedule.weekday - weekdayOf(from) + 7) % 7);
      for (let d = first; d <= to; d += 7) days.push(d);
      break;
    }
    case 'monthly':
      // Si el mes no tiene ese día (p. ej. 31), ese mes no se cobra.
      for (let d = from; d <= to; d++) if (dayOfMonth(d) === schedule.day) days.push(d);
      break;
    case 'cycle': {
      const anchor = toDayNum(schedule.anchor);
      const period = Math.max(1, Math.round(schedule.periodDays));
      const first = anchor + Math.ceil((from - anchor) / period) * period;
      for (let d = first; d <= to; d += period) days.push(d);
      break;
    }
    case 'perPatch':
      for (const start of patchStarts) {
        const d = start + schedule.offsetDays;
        if (d >= from && d <= to) days.push(d);
      }
      break;
  }
  return days;
}

/** "4.6" → "4.7". Si no se puede interpretar, añade un sufijo. */
export function nextVersion(version: string): string {
  const match = /^(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return `${version}+1`;
  return `${match[1]}.${Number(match[2]) + 1}`;
}
