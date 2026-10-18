import { cleanName, type CatalogEntry } from './catalog';
import { MAX_EIDOLON } from './rules';
import type { OwnedCharacter } from './types';
import { isObj } from './util';

/** Eidolón válido: entero entre 0 y 6. */
export const clampEidolon = (value: number) => Math.min(MAX_EIDOLON, Math.max(0, Math.floor(value)));

/** Los Trazacaminos (ids 8001…) no salen en banners: no cuentan como personajes de la cuenta. */
const isTrailblazer = (id: string) => Number(id) >= 8000;

/** Orden de la lista: alfabético por nombre. */
export const byName = (a: OwnedCharacter, b: OwnedCharacter) => a.name.localeCompare(b.name, 'es');

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

/** Copias que ya se tienen de cada personaje (Eidolón + 1), por id. */
export function ownedCopies(characters: OwnedCharacter[]): Map<string, number> {
  return new Map(characters.map((c) => [c.id, c.eidolon + 1]));
}
