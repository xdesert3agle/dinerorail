import type { ISODate } from './types';

/** Fecha destacada: un día al que apetece apuntar la fecha objetivo (la salida de un personaje, un parche…). */
export interface KeyDate {
  date: ISODate;
  /** Qué pasa ese día, sin el parche: «Aha». */
  label: string;
  /** Versión del juego, como «4.7». */
  patch?: string;
  /** Mitad del parche: los banners cambian a mitad de versión (1 = primera parte, 2 = segunda). */
  phase?: 1 | 2;
}

/** Solo fechas confirmadas; las estimadas (como las segundas fases) no se añaden hasta que se anuncien. */
export const KEY_DATES: KeyDate[] = [{ date: '2026-11-11', label: 'Aha', patch: '4.7', phase: 1 }];

/** Las que aún no han pasado (hoy incluido), de la más cercana a la más lejana. */
export function upcomingKeyDates(today: ISODate, dates: KeyDate[] = KEY_DATES): KeyDate[] {
  return dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** «4.7 · 1.ª parte» (ordinal abreviado según la RAE, con punto), «4.7» o nada, según lo que se sepa del parche. */
export function patchText(d: KeyDate): string {
  if (!d.patch) return '';
  return d.phase ? `${d.patch} · ${d.phase}.ª parte` : d.patch;
}
