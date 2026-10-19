import { DATA_URL, cleanName } from './catalog';
import type { PullKind } from './types';
import { isObj } from './util';

/*
 * Qué hace cada Eidolón de un personaje y el efecto de un cono de luz, para el popover de la galería de
 * dupes. Sale del JSON de cada uno en nanoka.cc (solo en inglés); de ahí se guarda solo el texto y sus
 * parámetros, que es poco comparado con el JSON entero.
 */

/** Un efecto tal como viene del juego: el texto lleva huecos ("#1[i]%") que se llenan con params. */
export interface Effect {
  name: string;
  desc: string;
  params: number[];
}

export interface CharacterDetails {
  name: string;
  /** E1…E6, en orden. */
  eidolons: Effect[];
}

export interface LightConeDetails {
  name: string;
  /** Nombre y texto del efecto; los parámetros cambian con la superposición. */
  effect: Omit<Effect, 'params'>;
  /** Parámetros en S1…S5, en orden. */
  levels: number[][];
}

export type Details = CharacterDetails | LightConeDetails;

export const detailsUrl = (kind: PullKind, id: string) =>
  `${DATA_URL}/en/${kind === 'character' ? 'character' : 'lightcone'}/${id}.json`;

const isNumbers = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => typeof n === 'number');
const text = (v: unknown) => (typeof v === 'string' ? v : '');

/** Lee los Eidolones (ranks 1…6) del JSON de un personaje. */
export function parseCharacterDetails(raw: unknown): CharacterDetails {
  if (!isObj(raw) || typeof raw.name !== 'string' || !isObj(raw.ranks)) throw new Error('Formato inesperado');
  const ranks = raw.ranks;
  const eidolons = [1, 2, 3, 4, 5, 6].map((n): Effect => {
    const r = ranks[String(n)];
    if (!isObj(r)) throw new Error(`Falta el Eidolón ${n}`);
    return { name: cleanName(text(r.name)), desc: text(r.desc), params: isNumbers(r.param_list) ? r.param_list : [] };
  });
  return { name: cleanName(raw.name), eidolons };
}

/** Lee el efecto (refinements) y sus parámetros en S1…S5 del JSON de un cono. */
export function parseLightConeDetails(raw: unknown): LightConeDetails {
  if (!isObj(raw) || typeof raw.name !== 'string' || !isObj(raw.refinements)) throw new Error('Formato inesperado');
  const ref = raw.refinements;
  const level = isObj(ref.level) ? ref.level : {};
  const levels = [1, 2, 3, 4, 5].map((n) => {
    const l = level[String(n)];
    return isObj(l) && isNumbers(l.param_list) ? l.param_list : [];
  });
  return { name: cleanName(raw.name), effect: { name: cleanName(text(ref.name)), desc: text(ref.desc) }, levels };
}

/** Valida unos detalles guardados; null si no sirven. */
export function normalizeDetails(kind: PullKind, raw: unknown): Details | null {
  if (!isObj(raw) || typeof raw.name !== 'string') return null;
  const isEffect = (e: unknown): e is Effect =>
    isObj(e) && typeof e.name === 'string' && typeof e.desc === 'string' && isNumbers(e.params);
  if (kind === 'character') {
    return Array.isArray(raw.eidolons) && raw.eidolons.length === 6 && raw.eidolons.every(isEffect)
      ? { name: raw.name, eidolons: raw.eidolons }
      : null;
  }
  const effect = raw.effect;
  return isObj(effect) &&
    typeof effect.name === 'string' &&
    typeof effect.desc === 'string' &&
    Array.isArray(raw.levels) &&
    raw.levels.length === 5 &&
    raw.levels.every(isNumbers)
    ? { name: raw.name, effect: { name: effect.name, desc: effect.desc }, levels: raw.levels }
    : null;
}

/** Trozo de texto; los valores (lo que sale de los parámetros) se resaltan. */
export interface Segment {
  text: string;
  value?: boolean;
}

/**
 * Convierte el texto del juego en líneas de trozos. Los huecos son "#n[i]" (entero) o "#n[fk]" (k
 * decimales), con el parámetro n (desde 1); con "%" detrás, el parámetro es una fracción y se pasa a
 * porcentaje. Se quita el marcado (<u>, <unbreak>, <color=…>) y "\n" (escrito así, con la barra) es un
 * salto de línea.
 */
export function formatDesc(desc: string, params: number[]): Segment[][] {
  return desc
    .replace(/\\n/g, '\n')
    .replace(/<[^>]*>/g, '')
    .split('\n')
    .map((line) => {
      const segments: Segment[] = [];
      let last = 0;
      for (const m of line.matchAll(/#(\d+)\[(i|f(\d+))\](%?)/g)) {
        const at = m.index ?? 0;
        if (at > last) segments.push({ text: line.slice(last, at) });
        const param = params[Number(m[1]) - 1];
        const percent = m[4] === '%';
        const n = (param ?? 0) * (percent ? 100 : 1);
        // [i] redondea; el error de coma flotante (30.000000000000004) no llega a verse.
        const shown = param === undefined ? '?' : m[3] ? n.toFixed(Number(m[3])) : String(Math.round(n));
        segments.push({ text: shown + (percent ? '%' : ''), value: true });
        last = at + m[0].length;
      }
      if (last < line.length) segments.push({ text: line.slice(last) });
      return segments;
    })
    .filter((line) => line.length > 0);
}
