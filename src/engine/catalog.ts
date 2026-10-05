import type { PullKind } from './types';

/*
 * Catálogo de personajes y conos de luz 5★ para sugerir nombres en la planificación.
 * Sale de los datos de nanoka.cc de una versión beta (".51"), que ya incluye lo que sale en las
 * próximas actualizaciones. Solo trae los nombres en inglés.
 */
const DATA_URL = 'https://static.nanoka.cc/hsr/4.6.51';
export const CATALOG_URLS: Record<PullKind, string> = {
  character: `${DATA_URL}/character.json`,
  lightCone: `${DATA_URL}/lightcone.json`,
};

export interface CatalogEntry {
  id: string;
  name: string;
}

export interface Catalog {
  /** Momento de la última sincronización correcta (ms desde 1970). */
  syncedAt: number;
  character: CatalogEntry[];
  lightCone: CatalogEntry[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** El rango viene como "CombatPowerAvatarRarityType5" o "CombatPowerLightconeRarity5". */
const isFiveStar = (rank: unknown) => typeof rank === 'string' && rank.endsWith('5');

/** Quita el marcado del juego ("LV.<unbreak>999</unbreak>") y los espacios de sobra. */
const cleanName = (name: string) => name.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/**
 * Convierte el JSON de un endpoint en la lista de 5★, sin repetidos.
 * Se descartan los Trazacaminos (su nombre es "{NICKNAME}"), que no salen en banners.
 * Orden: lo más nuevo primero (por fecha de salida si la hay; si no, por id). Lo que aún no tiene fecha
 * es lo que todavía no ha salido, así que va delante.
 */
export function parseCatalogEntries(raw: unknown): CatalogEntry[] {
  if (!isObj(raw)) throw new Error('Formato inesperado');
  const items: (CatalogEntry & { release: number })[] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!isObj(value) || !isFiveStar(value.rank) || typeof value.en !== 'string') continue;
    const name = cleanName(value.en);
    if (!name || name.includes('{')) continue;
    const release = typeof value.release === 'number' ? value.release : Infinity;
    items.push({ id, name, release });
  }
  items.sort((a, b) => b.release - a.release || Number(b.id) - Number(a.id));
  const seen = new Set<string>();
  return items
    .filter((x) => !seen.has(x.name) && seen.add(x.name))
    .map(({ id, name }) => ({ id, name }));
}

/** Valida un catálogo guardado; null si no sirve. */
export function normalizeCatalog(raw: unknown): Catalog | null {
  if (!isObj(raw) || typeof raw.syncedAt !== 'number') return null;
  const entries = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((e): e is CatalogEntry => isObj(e) && typeof e.id === 'string' && typeof e.name === 'string')
      : [];
  return { syncedAt: raw.syncedAt, character: entries(raw.character), lightCone: entries(raw.lightCone) };
}

/** Minúsculas y sin tildes, para buscar sin que importen. */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/**
 * Sugerencias para lo escrito: primero los nombres que empiezan así, luego los que tienen una palabra
 * que empieza así y por último los que lo contienen en cualquier sitio. Dentro de cada grupo, el orden
 * del catálogo (lo más nuevo primero).
 */
export function searchCatalog(entries: CatalogEntry[], query: string, limit = 8): CatalogEntry[] {
  const q = fold(query.trim());
  if (!q) return [];
  const scored: { entry: CatalogEntry; score: number }[] = [];
  for (const entry of entries) {
    const name = fold(entry.name);
    const at = name.indexOf(q);
    if (at < 0) continue;
    const score = at === 0 ? 0 : /[^\p{L}\p{N}]/u.test(name[at - 1]) ? 1 : 2;
    scored.push({ entry, score });
  }
  // sort es estable: se mantiene el orden del catálogo dentro de cada grupo.
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
