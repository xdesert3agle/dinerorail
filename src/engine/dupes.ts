import type { Catalog, CatalogEntry } from './catalog';
import type { PlannedPull } from './types';

/** Un 5★ llega como mucho a E6. */
export const MAX_DUPES = 6;

/** Arte de cada Eidolón (dupe) de un personaje: 1…6. */
export const dupeImageUrl = (characterId: string, dupe: number) =>
  `https://static.nanoka.cc/assets/hsr/rank/_dependencies/textures/${characterId}/${characterId}_Rank_${dupe}.webp`;

/** Conos de luz que se muestran a la derecha, como mucho. */
export const MAX_LIGHT_CONES = 6;

/** Icono mediano de un cono de luz. */
export const lightConeImageUrl = (lightConeId: string) =>
  `https://static.nanoka.cc/assets/hsr/lightconemediumicon/${lightConeId}.webp`;

export interface Dupe {
  characterId: string;
  /** Eidolón que da esta copia: 1…6. */
  eidolon: number;
}

const key = (name: string) => name.trim().toLowerCase();

/**
 * Personaje del catálogo por el que empieza un nombre ("Kafka E1" → Kafka). Si encajan varios, el más
 * largo: "Silver Wolf LV.999 E1" es Silver Wolf LV.999, no Silver Wolf.
 */
export function resolve(name: string, entries: CatalogEntry[]): CatalogEntry | null {
  const k = key(name);
  if (!k) return null;
  let best: CatalogEntry | null = null;
  for (const e of entries) {
    if (k.startsWith(key(e.name)) && (!best || e.name.length > best.name.length)) best = e;
  }
  return best;
}

/**
 * Dupes de todos los personajes del plan, en orden: la segunda copia de un personaje es su E1, la
 * tercera su E2… (hasta E6). Cuenta cada fila cuyo nombre empieza por el del personaje, así se pueden
 * anotar ("Kafka E1", "Kafka E2"…). Solo los personajes del catálogo (hace falta su id para las
 * imágenes), y como mucho 6 en total.
 */
export function planDupes(plan: PlannedPull[], catalog: Catalog | null): Dupe[] {
  if (!catalog) return [];
  const copies = new Map<string, number>();
  const dupes: Dupe[] = [];
  for (const p of plan) {
    if (p.kind !== 'character') continue;
    const entry = resolve(p.name, catalog.character);
    if (!entry) continue;
    const eidolon = copies.get(entry.id) ?? 0;
    copies.set(entry.id, eidolon + 1);
    if (eidolon >= 1 && eidolon <= MAX_DUPES) dupes.push({ characterId: entry.id, eidolon });
    if (dupes.length === MAX_DUPES) break;
  }
  return dupes;
}

/** Nombre de la copia número `earlier` (0 = la primera) de un personaje: "Kafka", "Kafka | E1"… Más allá de E6, sin dupe. */
const dupeName = (entry: CatalogEntry, earlier: number) =>
  earlier >= 1 && earlier <= MAX_DUPES ? `${entry.name} | E${earlier}` : entry.name;

/**
 * Nombre para una fila de personaje al elegirlo: si ya sale antes en el plan, se le añade el dupe que
 * le toca ("Kafka | E1" para la segunda copia). Más allá de E6 se deja el nombre tal cual.
 */
export function nameWithDupe(plan: PlannedPull[], pullId: string, entry: CatalogEntry, entries: CatalogEntry[]): string {
  const index = plan.findIndex((p) => p.id === pullId);
  const earlier = plan
    .slice(0, Math.max(0, index))
    .filter((p) => p.kind === 'character' && resolve(p.name, entries)?.id === entry.id).length;
  return dupeName(entry, earlier);
}

/**
 * Vuelve a numerar los dupes según su orden en el plan (al borrar una fila, "Kafka | E3" pasa a ser
 * "Kafka | E2"). Solo toca los nombres que son el del personaje con o sin dupe ("Kafka", "Kafka | E3",
 * "kafka e3"); lo que lleve otro texto se deja como está, aunque cuente como copia.
 */
export function renumberDupes(plan: PlannedPull[], entries: CatalogEntry[]): PlannedPull[] {
  const copies = new Map<string, number>();
  return plan.map((p) => {
    if (p.kind !== 'character') return p;
    const entry = resolve(p.name, entries);
    if (!entry) return p;
    const earlier = copies.get(entry.id) ?? 0;
    copies.set(entry.id, earlier + 1);
    const rest = key(p.name).slice(key(entry.name).length);
    if (!/^(\s*\|?\s*e\d+)?$/.test(rest)) return p;
    const name = dupeName(entry, earlier);
    return name === p.name ? p : { ...p, name };
  });
}

/**
 * Ids de los conos del plan, en orden y con repetidos (cada copia es un icono), hasta 6.
 * Solo los que están en el catálogo (hace falta su id para las imágenes).
 */
export function planLightCones(plan: PlannedPull[], catalog: Catalog | null): string[] {
  if (!catalog) return [];
  const ids: string[] = [];
  for (const p of plan) {
    if (p.kind !== 'lightCone') continue;
    const entry = resolve(p.name, catalog.lightCone);
    if (entry) ids.push(entry.id);
    if (ids.length === MAX_LIGHT_CONES) break;
  }
  return ids;
}
