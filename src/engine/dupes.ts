import { ownedCopies } from './account';
import { entryOf, type Catalog, type CatalogEntry } from './catalog';
import { MAX_EIDOLON, MAX_SUPERIMPOSITION } from './rules';
import type { OwnedCharacter, PlannedPull } from './types';

/** Dupes que se muestran a la izquierda, como mucho. */
export const MAX_DUPES = 6;

/** Conos de luz que se muestran a la derecha, como mucho. */
export const MAX_LIGHT_CONES = 6;

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
    const entry = entryOf(p, entries);
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
    const entry = entryOf(p, catalog.lightCone);
    if (entry) ids.push(entry.id);
    if (ids.length === MAX_LIGHT_CONES) break;
  }
  return ids;
}

/**
 * Superposición de cada cono del plan (planLightCones): cada copia del mismo cono la sube, hasta
 * MAX_SUPERIMPOSITION. La cuenta no guarda los conos que ya se tienen, así que la primera es S1.
 */
export const superimpositions = (ids: string[]): number[] =>
  ids.map((id, i) => Math.min(ids.slice(0, i + 1).filter((x) => x === id).length, MAX_SUPERIMPOSITION));
