import { isPathId, type PathId } from './rules';
import type { PlannedPull } from './types';
import { isObj } from './util';

/*
 * Catálogo de personajes y conos de luz 5★ para sugerir nombres en la planificación.
 * La lista sale de nanoka.cc, de su última versión (la beta, `hsr.latest` en su manifest), que ya incluye lo que
 * sale en las próximas actualizaciones; trae los nombres en inglés, coreano, chino y japonés, no en español.
 * El nombre en español sale de yatta.moe, por id. Lo que yatta aún no tiene (lo que está en beta) se queda en
 * inglés hasta que lo publique.
 */
/** Si el manifest de nanoka no responde, la última versión conocida (las direcciones, en urls.ts). */
export const FALLBACK_VERSION = '4.6.54';

export interface CatalogEntry {
  id: string;
  name: string;
  /** Su vía (el `baseType` de nanoka); sin ella si nanoka trae una que aún no está en PATHS. */
  path?: PathId;
}

export interface Catalog {
  /** Momento de la última sincronización correcta (ms desde 1970). */
  syncedAt: number;
  /** Versión de nanoka de la que salió (los detalles de la galería tiran de la misma). Sin ella, es del formato antiguo. */
  version?: string;
  character: CatalogEntry[];
  lightCone: CatalogEntry[];
}

/** La última versión de HSR en el manifest de nanoka ({ hsr: { latest: "4.6.54" } }). */
export function parseManifestVersion(raw: unknown): string {
  const latest = isObj(raw) && isObj(raw.hsr) ? raw.hsr.latest : undefined;
  if (typeof latest !== 'string' || !/^\d+(\.\d+)+$/.test(latest)) throw new Error('Formato inesperado');
  return latest;
}

/** Los nombres en español de yatta, por id ({ data: { items: { "1005": { name: "Kafka" } } } }). */
export function parseYattaNames(raw: unknown): Map<string, string> {
  if (!isObj(raw) || !isObj(raw.data) || !isObj(raw.data.items)) throw new Error('Formato inesperado');
  const names = new Map<string, string>();
  for (const [id, item] of Object.entries(raw.data.items)) {
    if (isObj(item) && typeof item.name === 'string' && item.name.trim()) names.set(id, cleanName(item.name));
  }
  return names;
}

/** Sincronización automática semanal: los martes a las 10:00, hora local (getDay: 0 = domingo). */
export const WEEKLY_SYNC = { weekday: 2, hour: 10 } as const;

/** El último martes a las 10:00 que ya ha llegado (hoy mismo si es martes y ya son las 10). */
export function lastWeeklySync(now: Date): Date {
  const d = new Date(now);
  d.setHours(WEEKLY_SYNC.hour, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() - WEEKLY_SYNC.weekday + 7) % 7));
  if (d > now) d.setDate(d.getDate() - 7);
  return d;
}

/**
 * El próximo martes a las 10:00. Se suman 7 días de calendario y no 7 × 24 h: en la semana del cambio de hora,
 * las horas fijas daban las 9:00 o las 11:00.
 */
export function nextWeeklySync(now: Date): Date {
  const d = lastWeeklySync(now);
  d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Toca sincronizar si no hay catálogo, si es de un formato antiguo (sin versión: nombres solo en inglés; sin
 * vías en los personajes) o si el último es anterior al último martes a las 10:00.
 */
export const syncDue = (catalog: Pick<Catalog, 'syncedAt' | 'version' | 'character'> | null, now: Date) =>
  !catalog ||
  !catalog.version ||
  !catalog.character.some((e) => e.path) ||
  catalog.syncedAt < lastWeeklySync(now).getTime();

/** El rango viene como "CombatPowerAvatarRarityType5" o "CombatPowerLightconeRarity5". */
const isFiveStar = (rank: unknown) => typeof rank === 'string' && rank.endsWith('5');

/** Quita el marcado del juego ("LV.<unbreak>999</unbreak>") y los espacios de sobra. */
export const cleanName = (name: string) => name.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/**
 * Convierte el JSON de nanoka en la lista de 5★, sin repetidos, con el nombre en español si yatta lo tiene
 * (`spanish`, por id) y si no en inglés.
 * Se descartan los Trazacaminos (su nombre en inglés es "{NICKNAME}"), que no salen en banners.
 * Orden: lo más nuevo primero (por fecha de salida si la hay; si no, por id). Lo que aún no tiene fecha
 * es lo que todavía no ha salido, así que va delante.
 */
export function parseCatalogEntries(raw: unknown, spanish: Map<string, string> = new Map()): CatalogEntry[] {
  if (!isObj(raw)) throw new Error('Formato inesperado');
  const items: (CatalogEntry & { release: number })[] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!isObj(value) || !isFiveStar(value.rank) || typeof value.en !== 'string') continue;
    const en = cleanName(value.en);
    if (!en || en.includes('{')) continue;
    const name = spanish.get(id) ?? en;
    const release = typeof value.release === 'number' ? value.release : Infinity;
    items.push({ id, name, release, ...(isPathId(value.baseType) && { path: value.baseType }) });
  }
  items.sort((a, b) => b.release - a.release || Number(b.id) - Number(a.id));
  const seen = new Set<string>();
  return items
    .filter((x) => !seen.has(x.name) && seen.add(x.name))
    .map(({ release: _, ...entry }) => entry);
}

/** Valida un catálogo guardado; null si no sirve. */
export function normalizeCatalog(raw: unknown): Catalog | null {
  if (!isObj(raw) || typeof raw.syncedAt !== 'number') return null;
  const entries = (v: unknown) =>
    Array.isArray(v)
      ? v
          .filter((e) => isObj(e) && typeof e.id === 'string' && typeof e.name === 'string')
          .map((e) => ({ id: e.id as string, name: e.name as string, ...(isPathId(e.path) && { path: e.path }) }))
      : [];
  return {
    syncedAt: raw.syncedAt,
    ...(typeof raw.version === 'string' && { version: raw.version }),
    character: entries(raw.character),
    lightCone: entries(raw.lightCone),
  };
}

/**
 * Para buscar: minúsculas, sin tildes y con los signos que no son letras ni cifras como un espacio (los de en
 * medio de «Dan Heng - Imbibitor Lunae» o «Aeon ★ Aha»), sin espacios de sobra. Así se encuentran escribiendo
 * solo las palabras.
 */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * La entrada de ese nombre: el mismo, sin contar mayúsculas ni espacios de los bordes (null si no hay). Es «el
 * mismo nombre» en toda la app: el plan, el desplegable y la galería. Para buscar, en cambio, fold.
 */
export function findByName(entries: CatalogEntry[], name: string): CatalogEntry | null {
  const k = name.trim().toLowerCase();
  return k ? (entries.find((e) => e.name.toLowerCase() === k) ?? null) : null;
}

/**
 * La entrada de una fila del plan: por su id del catálogo, que no cambia aunque cambie el nombre (lo beta va en
 * inglés hasta que yatta lo traduce), y si no lo tiene, por su nombre.
 */
export function entryOf(row: { name: string; entryId?: string }, entries: CatalogEntry[]): CatalogEntry | null {
  const byId = row.entryId ? entries.find((e) => e.id === row.entryId) : undefined;
  return byId ?? findByName(entries, row.name);
}

/**
 * Las filas del plan con el id y el nombre actuales de su entrada del catálogo (las elegidas sin catálogo, o
 * guardadas antes de tener id, lo ganan; las de nombre beta toman el traducido). Las mismas, sin copiar, si no
 * cambia nada.
 */
export function withCatalogIds(plan: PlannedPull[], catalog: Catalog): PlannedPull[] {
  let changed = false;
  const next = plan.map((row) => {
    const entry = entryOf(row, catalog[row.kind]);
    if (!entry || (row.entryId === entry.id && row.name === entry.name)) return row;
    changed = true;
    return { ...row, entryId: entry.id, name: entry.name };
  });
  return changed ? next : plan;
}

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
