import { ownedCopies } from './account';
import type { Catalog, CatalogEntry } from './catalog';
import { MAX_EIDOLON } from './rules';
import type { OwnedCharacter, PlannedPull } from './types';

/** Dupes que se muestran a la izquierda, como mucho. */
export const MAX_DUPES = 6;

/** Arte de cada Eidolón (dupe) de un personaje: 1…6. */
export const dupeImageUrl = (characterId: string, dupe: number) =>
  `https://static.nanoka.cc/assets/hsr/rank/_dependencies/textures/${characterId}/${characterId}_Rank_${dupe}.webp`;

/** Retrato redondo de un personaje (128×128, centrado en la cara): para la miniatura de cada fila del plan. */
export const characterPortraitUrl = (characterId: string) =>
  `https://static.nanoka.cc/assets/hsr/avatarroundicon/${characterId}.webp`;

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

/** Copia de un personaje en una fila del plan. */
export interface RowCopy {
  characterId: string;
  /** Copias de ese personaje que hay antes (cuenta + filas anteriores): 0 es la primera, 1 su E1… */
  eidolon: number;
}

const key = (name: string) => name.trim().toLowerCase();

/**
 * Personaje del catálogo de un nombre. Vale con que el nombre empiece por el del personaje; si encajan
 * varios, el más largo: "Silver Wolf LV.999" es Silver Wolf LV.999, no Silver Wolf.
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
 * Qué copia es cada fila del plan (null si no es un personaje del catálogo). El dupe no se guarda en el
 * nombre: sale de aquí, del orden del plan y de las copias de la cuenta, que van antes. Con Kafka en E1
 * en la cuenta, la primera Kafka del plan es su E2 y la siguiente su E3. Así, al quitar, reordenar o
 * cambiar la cuenta, los dupes se recalculan solos.
 */
export function planCopies(
  plan: PlannedPull[],
  entries: CatalogEntry[] | null,
  owned: OwnedCharacter[] = [],
): (RowCopy | null)[] {
  if (!entries) return plan.map(() => null);
  const copies = ownedCopies(owned);
  return plan.map((p) => {
    if (p.kind !== 'character') return null;
    const entry = resolve(p.name, entries);
    if (!entry) return null;
    const eidolon = copies.get(entry.id) ?? 0;
    copies.set(entry.id, eidolon + 1);
    return { characterId: entry.id, eidolon };
  });
}

/** Eidolón que da una copia (1…6), o null si es la primera o pasa de E6 (ya no es un dupe). */
export const dupeOf = (copy: RowCopy | null): number | null =>
  copy && copy.eidolon >= 1 && copy.eidolon <= MAX_EIDOLON ? copy.eidolon : null;

/** Dupes del plan en orden (de cualquier personaje, a partir de su segunda copia), como mucho 6. */
export function planDupes(copies: (RowCopy | null)[]): Dupe[] {
  const dupes: Dupe[] = [];
  for (const copy of copies) {
    const eidolon = dupeOf(copy);
    if (copy && eidolon !== null) dupes.push({ characterId: copy.characterId, eidolon });
    if (dupes.length === MAX_DUPES) break;
  }
  return dupes;
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
