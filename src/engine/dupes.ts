import type { Catalog, CatalogEntry } from './catalog';
import type { PlannedPull } from './types';

/** Un 5★ llega como mucho a E6. */
export const MAX_DUPES = 6;

/** Arte de cada Eidolón (dupe) de un personaje: 1…6. */
export const dupeImageUrl = (characterId: string, dupe: number) =>
  `https://static.nanoka.cc/assets/hsr/rank/_dependencies/textures/${characterId}/${characterId}_Rank_${dupe}.webp`;

export interface DupeCount {
  characterId: string;
  name: string;
  /** Copias de más en el plan (0 = solo la primera), hasta 6. */
  dupes: number;
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
 * Dupes del primer personaje del plan: cuántas veces más aparece ese mismo personaje. Cuenta cada fila
 * cuyo nombre empieza por el del personaje, así se pueden anotar ("Kafka E1", "Kafka E2"…).
 * Solo cuenta si el personaje está en el catálogo (hace falta su id para las imágenes).
 */
export function countDupes(plan: PlannedPull[], catalog: Catalog | null): DupeCount | null {
  if (!catalog) return null;
  const first = plan.find((p) => p.kind === 'character' && p.name.trim());
  if (!first) return null;
  const entry = resolve(first.name, catalog.character);
  if (!entry) return null;
  const copies = plan.filter((p) => p.kind === 'character' && resolve(p.name, catalog.character)?.id === entry.id).length;
  return { characterId: entry.id, name: entry.name, dupes: Math.min(MAX_DUPES, copies - 1) };
}

/**
 * Nombre para una fila de personaje al elegirlo: si ya sale antes en el plan, se le añade el dupe que
 * le toca ("Kafka | E1" para la segunda copia). Más allá de E6 se deja el nombre tal cual.
 */
export function nameWithDupe(plan: PlannedPull[], pullId: string, entry: CatalogEntry, entries: CatalogEntry[]): string {
  const index = plan.findIndex((p) => p.id === pullId);
  const earlier = plan
    .slice(0, Math.max(0, index))
    .filter((p) => p.kind === 'character' && resolve(p.name, entries)?.id === entry.id).length;
  return earlier >= 1 && earlier <= MAX_DUPES ? `${entry.name} | E${earlier}` : entry.name;
}
