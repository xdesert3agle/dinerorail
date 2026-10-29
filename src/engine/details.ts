import { cleanName } from './catalog';
import { nanokaUrl, YATTA } from './urls';
import type { PullKind } from './types';
import { isObj } from './util';

/*
 * Qué hace cada Eidolón de un personaje y el efecto de un cono de luz, para el popover de la galería de
 * dupes. Sale de la API de yatta.moe, en español. Lo que aún está en beta no está ahí (yatta lo saca
 * de nanoka.cc), así que entonces se coge de nanoka.cc (la misma versión que el catálogo), en inglés. De cada JSON se guarda solo
 * el texto y sus parámetros, que es poco comparado con el JSON entero.
 */

/** Fuentes de los datos: primero yatta.moe (en español) y, si no lo tiene, nanoka.cc (en inglés). */
export type DetailsSource = 'yatta' | 'nanoka';

/** Idioma de los textos de cada fuente: decide el separador decimal de los valores. */
export type Lang = 'es' | 'en';
export const SOURCE_LANG: Record<DetailsSource, Lang> = { yatta: 'es', nanoka: 'en' };

/*
 * Versión de lo guardado: subirla si cambia lo que se guarda o de dónde sale (YATTA), y lo guardado deja de
 * valer. Solo se guarda lo de yatta (lo de nanoka va en memoria), así que no depende de la versión de nanoka.
 */
export const DETAILS_VERSION = 'yatta-v2-es-1';

/** Un efecto tal como viene del juego: el texto lleva huecos ("#1[i]%") que se llenan con params. */
export interface Effect {
  name: string;
  desc: string;
  params: number[];
}

interface Common {
  name: string;
  lang: Lang;
}

export interface CharacterDetails extends Common {
  /** E1…E6, en orden. */
  eidolons: Effect[];
}

export interface LightConeDetails extends Common {
  /** Nombre y texto del efecto; los parámetros cambian con la superposición. */
  effect: Omit<Effect, 'params'>;
  /** Parámetros en S1…S5, en orden. */
  levels: number[][];
}

export type Details = CharacterDetails | LightConeDetails;

/** URL de los detalles en una fuente; nanoka, en la versión del catálogo (`version`). */
export function detailsUrl(source: DetailsSource, kind: PullKind, id: string, version: string) {
  if (source === 'yatta') return `${YATTA}/${kind === 'character' ? 'avatar' : 'equipment'}/${id}`;
  return `${nanokaUrl(version)}/en/${kind === 'character' ? 'character' : 'lightcone'}/${id}.json`;
}

const isNumbers = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => typeof n === 'number');
const text = (v: unknown) => (typeof v === 'string' ? v : '');
const RANKS = [1, 2, 3, 4, 5, 6];
const LEVELS = [1, 2, 3, 4, 5];

/** Lee los detalles del JSON de una fuente; lanza un error si no tiene la forma esperada. */
export function parseDetails(source: DetailsSource, kind: PullKind, raw: unknown): Details {
  const lang = SOURCE_LANG[source];
  if (source === 'yatta') {
    if (!isObj(raw) || !isObj(raw.data)) throw new Error('Formato inesperado');
    return kind === 'character' ? yattaCharacter(raw.data, lang) : yattaLightCone(raw.data, lang);
  }
  return kind === 'character' ? nanokaCharacter(raw, lang) : nanokaLightCone(raw, lang);
}

/** yatta: los Eidolones van por id, cada uno con su número (rank); sin parámetros, params es null. */
function yattaCharacter(data: Record<string, unknown>, lang: Lang): CharacterDetails {
  if (typeof data.name !== 'string' || !isObj(data.eidolons)) throw new Error('Formato inesperado');
  const all = Object.values(data.eidolons).filter(isObj);
  const eidolons = RANKS.map((n): Effect => {
    const e = all.find((x) => x.rank === n);
    if (!e) throw new Error(`Falta el Eidolón ${n}`);
    return { name: cleanName(text(e.name)), desc: text(e.description), params: isNumbers(e.params) ? e.params : [] };
  });
  return { name: cleanName(data.name), lang, eidolons };
}

/** yatta: los parámetros del cono van por parámetro ("1": [S1…S5]), no por superposición. */
function yattaLightCone(data: Record<string, unknown>, lang: Lang): LightConeDetails {
  if (typeof data.name !== 'string' || !isObj(data.skill)) throw new Error('Formato inesperado');
  const skill = data.skill;
  const byParam = isObj(skill.params) ? skill.params : {};
  const count = Object.keys(byParam).length;
  const levels = LEVELS.map((s) =>
    Array.from({ length: count }, (_, i) => {
      const values = byParam[String(i + 1)];
      return isNumbers(values) ? (values[s - 1] ?? 0) : 0;
    }),
  );
  return {
    name: cleanName(data.name),
    lang,
    effect: { name: cleanName(text(skill.name)), desc: text(skill.description) },
    levels,
  };
}

/** nanoka: los Eidolones van en ranks, del 1 al 6. */
function nanokaCharacter(raw: unknown, lang: Lang): CharacterDetails {
  if (!isObj(raw) || typeof raw.name !== 'string' || !isObj(raw.ranks)) throw new Error('Formato inesperado');
  const ranks = raw.ranks;
  const eidolons = RANKS.map((n): Effect => {
    const r = ranks[String(n)];
    if (!isObj(r)) throw new Error(`Falta el Eidolón ${n}`);
    return { name: cleanName(text(r.name)), desc: text(r.desc), params: isNumbers(r.param_list) ? r.param_list : [] };
  });
  return { name: cleanName(raw.name), lang, eidolons };
}

/** nanoka: el efecto va en refinements, con los parámetros de cada superposición. */
function nanokaLightCone(raw: unknown, lang: Lang): LightConeDetails {
  if (!isObj(raw) || typeof raw.name !== 'string' || !isObj(raw.refinements)) throw new Error('Formato inesperado');
  const ref = raw.refinements;
  const level = isObj(ref.level) ? ref.level : {};
  const levels = LEVELS.map((n) => {
    const l = level[String(n)];
    return isObj(l) && isNumbers(l.param_list) ? l.param_list : [];
  });
  return { name: cleanName(raw.name), lang, effect: { name: cleanName(text(ref.name)), desc: text(ref.desc) }, levels };
}

/** Valida unos detalles guardados; null si no sirven. */
export function normalizeDetails(kind: PullKind, raw: unknown): Details | null {
  if (!isObj(raw) || typeof raw.name !== 'string' || (raw.lang !== 'es' && raw.lang !== 'en')) return null;
  const { name, lang } = raw;
  const isEffect = (e: unknown): e is Effect =>
    isObj(e) && typeof e.name === 'string' && typeof e.desc === 'string' && isNumbers(e.params);
  if (kind === 'character') {
    return Array.isArray(raw.eidolons) && raw.eidolons.length === 6 && raw.eidolons.every(isEffect)
      ? { name, lang, eidolons: raw.eidolons }
      : null;
  }
  const effect = raw.effect;
  return isObj(effect) &&
    typeof effect.name === 'string' &&
    typeof effect.desc === 'string' &&
    Array.isArray(raw.levels) &&
    raw.levels.length === 5 &&
    raw.levels.every(isNumbers)
    ? { name, lang, effect: { name: effect.name, desc: effect.desc }, levels: raw.levels }
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
 * porcentaje. En español, los decimales van con coma. Se quita el marcado (<u>, <i>, <unbreak>,
 * <color=…>) y "\n" (escrito así, con la barra) es un salto de línea.
 */
export function formatDesc(desc: string, params: number[], lang: Lang = 'en'): Segment[][] {
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
        // [i] redondea; el error de coma flotante (30.000000000000004, 5.5999998) no llega a verse.
        let shown = param === undefined ? '?' : m[3] ? n.toFixed(Number(m[3])) : String(Math.round(n));
        if (lang === 'es') shown = shown.replace('.', ',');
        segments.push({ text: shown + (percent ? '%' : ''), value: true });
        last = at + m[0].length;
      }
      if (last < line.length) segments.push({ text: line.slice(last) });
      return segments;
    })
    .filter((line) => line.length > 0);
}
