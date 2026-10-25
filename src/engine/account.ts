import { cleanName, type CatalogEntry } from './catalog';
import { MAX_EIDOLON, PATHS, type PathId } from './rules';
import type { OwnedCharacter } from './types';
import { isObj } from './util';

/** Eidolón válido: entero entre 0 y 6. */
export const clampEidolon = (value: number) => Math.min(MAX_EIDOLON, Math.max(0, Math.floor(value)));

/** Los Trazacaminos (ids 8001…) no salen en banners: no cuentan como personajes de la cuenta. */
const isTrailblazer = (id: string) => Number(id) >= 8000;

/** Orden de la lista: alfabético por nombre. */
export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es');

/**
 * Personajes del perfil exportado del juego (el profile.json de Reliquary Archiver): id, nombre y
 * Eidolón, sin repetidos y sin los Trazacaminos. Los conos de luz y el resto del archivo se ignoran.
 */
export function parseProfile(text: string): OwnedCharacter[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!isObj(raw) || !Array.isArray(raw.characters)) {
    throw new Error('El archivo no es un perfil válido: no tiene la lista de personajes.');
  }
  const byId = new Map<string, OwnedCharacter>();
  for (const c of raw.characters) {
    if (!isObj(c) || typeof c.id !== 'string' || isTrailblazer(c.id)) continue;
    const name = typeof c.name === 'string' ? cleanName(c.name) : '';
    const eidolon = typeof c.eidolon === 'number' && Number.isFinite(c.eidolon) ? clampEidolon(c.eidolon) : 0;
    byId.set(c.id, { id: c.id, name: name || c.id, eidolon });
  }
  return [...byId.values()].sort(byName);
}

/**
 * Solo los 5★: los que están en el catálogo, con el nombre del catálogo. Sin catálogo (aún no se ha
 * descargado) no se puede saber la rareza y se dejan todos.
 */
export function fiveStarOnly(characters: OwnedCharacter[], entries: CatalogEntry[] | null): OwnedCharacter[] {
  if (!entries) return characters;
  const names = new Map(entries.map((e) => [e.id, e.name]));
  return characters
    .filter((c) => names.has(c.id))
    .map((c) => ({ ...c, name: names.get(c.id)! }))
    .sort(byName);
}

/** Fila de la lista de la cuenta: un personaje 5★ y su Eidolón, o null si no se tiene. */
export interface RosterEntry {
  id: string;
  name: string;
  eidolon: number | null;
  path?: PathId;
}

/**
 * Todos los 5★ del catálogo por orden alfabético, cada uno con su Eidolón si se tiene, para marcarlos a mano.
 * Sin catálogo no se sabe cuáles hay: solo los que ya están en la cuenta.
 */
export function roster(characters: OwnedCharacter[], entries: CatalogEntry[] | null): RosterEntry[] {
  if (!entries) return [...characters].sort(byName);
  const owned = new Map(characters.map((c) => [c.id, c.eidolon]));
  return entries
    .map((e) => ({ id: e.id, name: e.name, eidolon: owned.get(e.id) ?? null, ...(e.path && { path: e.path }) }))
    .sort(byName);
}

export interface PathGroup {
  /** La vía; null para los que no tienen una conocida (van al final). */
  path: (typeof PATHS)[number] | null;
  characters: RosterEntry[];
}

/**
 * La lista por vías, en el orden del juego, sin las vacías y manteniendo el orden de dentro. Si nadie tiene
 * vía (sin catálogo, o uno guardado de antes de las vías), null: se muestra la lista sin agrupar.
 */
export function byPath(characters: RosterEntry[]): PathGroup[] | null {
  if (!characters.some((c) => c.path)) return null;
  const groups: PathGroup[] = [...PATHS, null].map((path) => ({
    path,
    characters: characters.filter((c) => (path ? c.path === path.id : !c.path)),
  }));
  return groups.filter((g) => g.characters.length > 0);
}

/** La cuenta con ese personaje en ese Eidolón (null: no se tiene, sale de la lista). Sigue en orden alfabético. */
export function withEidolon(
  characters: OwnedCharacter[],
  { id, name }: Pick<OwnedCharacter, 'id' | 'name'>,
  eidolon: number | null,
): OwnedCharacter[] {
  const rest = characters.filter((c) => c.id !== id);
  return eidolon === null ? rest : [...rest, { id, name, eidolon: clampEidolon(eidolon) }].sort(byName);
}

/** Copias que ya se tienen de cada personaje (Eidolón + 1), por id. */
export function ownedCopies(characters: OwnedCharacter[]): Map<string, number> {
  return new Map(characters.map((c) => [c.id, c.eidolon + 1]));
}
