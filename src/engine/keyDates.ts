import type { ISODate } from './types';

/** Fecha destacada: un día al que apetece apuntar la fecha objetivo (la salida de un personaje, un parche…). */
export interface KeyDate {
  date: ISODate;
  label: string;
}

/** Solo fechas confirmadas; las estimadas (como las segundas fases) no se añaden hasta que se anuncien. */
export const KEY_DATES: KeyDate[] = [{ date: '2026-11-11', label: 'Aha (4.7)' }];

/** Las que aún no han pasado (hoy incluido), de la más cercana a la más lejana. */
export function upcomingKeyDates(today: ISODate, dates: KeyDate[] = KEY_DATES): KeyDate[] {
  return dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}
