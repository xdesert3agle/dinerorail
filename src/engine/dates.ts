import type { ISODate } from './types';

// Todas las fechas se manejan como "número de día" (días desde 1970-01-01 en UTC)
// para que las zonas horarias y los cambios de hora no afecten a los cálculos.
const MS_PER_DAY = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISO(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false;
  return fromDayNum(toDayNum(value)) === value;
}

export function toDayNum(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromDayNum(day: number): ISODate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNum(toDayNum(iso) + days);
}

/** 0 = lunes … 6 = domingo. El día 0 (1970-01-01) fue jueves. */
export function weekdayOf(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}

export function dayOfMonth(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCDate();
}

/** Fecha local de hoy (la del usuario, no UTC). */
export function todayISO(now = new Date()): ISODate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export function formatDate(iso: ISODate): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
