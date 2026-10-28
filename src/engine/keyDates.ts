import { addDays } from './dates';
import { PATCH_LENGTH_DAYS } from './rules';
import type { ISODate } from './types';

/** Fecha destacada: un día al que apetece apuntar la fecha objetivo (la salida de un personaje, un parche…). */
export interface KeyDate {
  date: ISODate;
  /** Qué pasa ese día, sin el parche: «Aha», o los personajes de la versión. */
  label: string;
  /** Versión del juego, como «4.7». */
  patch?: string;
  /** Mitad del parche: los banners cambian a mitad de versión (1 = primera parte, 2 = segunda). */
  phase?: 1 | 2;
  /** Fecha calculada (no publicada): se marca como estimada. */
  estimated?: boolean;
}

/** La segunda parte de una versión (cambio de banners) empieza 3 semanas después de su inicio. */
export const PHASE_2_WEEKS = 3;
const LAST_KNOWN = '2027-04-28'; // 5.2
// Las fechas que no se conocen: la última conocida más una versión entera por cada una que falta.
const estimate = (versionsAfter: number) => addDays(LAST_KNOWN, PATCH_LENGTH_DAYS * versionsAfter);
const phase2 = (start: ISODate) => addDays(start, PHASE_2_WEEKS * 7);

/**
 * Una versión: su primer personaje sale en la 1.ª parte (el inicio) y el segundo, si lo hay, en la 2.ª
 * (3 semanas después; siempre estimada, porque solo se conoce el inicio).
 */
function version(patch: string, start: ISODate, names: string[], estimated = false): KeyDate[] {
  const [first, second] = names;
  return [
    { date: start, label: first, patch, phase: 1, ...(estimated && { estimated }) },
    ...(second ? [{ date: phase2(start), label: second, patch, phase: 2 as const, estimated: true }] : []),
  ];
}

/** Las fechas de inicio de 4.7 a 5.2 son las que se conocen; de la 5.3 en adelante, 6 semanas por versión. */
export const KEY_DATES: KeyDate[] = [
  { date: '2026-11-11', label: 'Eón ★ Aha', patch: '4.7', phase: 1 },
  // Colaboración con ZZZ: dos personajes a la vez en la 1.ª parte (una sola fecha).
  ...version('4.8', '2026-12-23', ['Astra y Ellen (ZZZ)']),
  ...version('5.0', '2027-02-03', ['Firefly SP', 'Misha SP']),
  ...version('5.1', '2027-03-17', ['Polka Kakamond']),
  ...version('5.2', LAST_KNOWN, ['Kafka SP', 'Obsidian']),
  ...version('5.3', estimate(1), ['Dan Heng SP3', 'Xuanquan'], true),
  ...version('5.4', estimate(2), ['7 de Marzo SP2'], true),
  ...version('5.5', estimate(3), ['Stephen Lloyd'], true),
  ...version('5.6', estimate(4), ['Castorice SP'], true),
  ...version('5.7', estimate(5), ['Trazacaminos 5★'], true),
];

/** Las que aún no han pasado (hoy incluido), de la más cercana a la más lejana. */
export function upcomingKeyDates(today: ISODate, dates: KeyDate[] = KEY_DATES): KeyDate[] {
  return dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** Una versión con sus fechas: la de la 1.ª parte (o la del inicio, si no tiene partes) y la de la 2.ª. */
export interface KeyVersion {
  patch: string;
  first?: KeyDate;
  second?: KeyDate;
}

/** Agrupa las fechas por versión, en el orden en que llegan (las de una versión van seguidas). */
export function byVersion(dates: KeyDate[]): KeyVersion[] {
  const out: KeyVersion[] = [];
  for (const d of dates) {
    const patch = d.patch ?? '';
    let v = out.at(-1);
    if (!v || v.patch !== patch) out.push((v = { patch }));
    if (d.phase === 2) v.second = d;
    else v.first = d;
  }
  return out;
}

/** «1.ª parte», «2.ª parte» o nada (ordinal abreviado según la RAE, con punto). */
export const phaseText = (d: KeyDate) => (d.phase ? `${d.phase}.ª parte` : '');

/** «4.7 · 1.ª parte» (ordinal abreviado según la RAE, con punto), «4.7» o nada, según lo que se sepa del parche. */
export function patchText(d: KeyDate): string {
  if (!d.patch) return '';
  return d.phase ? `${d.patch} · ${phaseText(d)}` : d.patch;
}
