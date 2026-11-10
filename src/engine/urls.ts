import type { PullKind } from './types';

/*
 * Todas las direcciones externas de la app, en un sitio:
 * - nanoka.cc: el catálogo de 5★ (con lo que está en beta), las imágenes y los detalles en inglés.
 * - yatta.moe: los nombres y los detalles en español, siempre con vh (ver yattaUrl).
 * - StarRailRes (GitHub, sirve CORS): iconos de vías y de conos de luz.
 */
const NANOKA = 'https://static.nanoka.cc';
const NANOKA_ASSETS = `${NANOKA}/assets/hsr`;
const YATTA = 'https://sr.yatta.moe/api/v2/es';
const STAR_RAIL_RES = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon';

/** La versión actual de los datos de nanoka (hsr.latest). */
export const MANIFEST_URL = `${NANOKA}/manifest.json`;
export const nanokaUrl = (version: string) => `${NANOKA}/hsr/${version}`;
/** Lista de personajes o conos de nanoka, en una versión. */
export const catalogUrl = (version: string, kind: PullKind) =>
  `${nanokaUrl(version)}/${kind === 'character' ? 'character' : 'lightcone'}.json`;
/**
 * Una dirección de la API de yatta, con el minuto de la petición (`now`, en ms) en el parámetro vh.
 * yatta pasa por la caché de Cloudflare, que guarda cada dirección 16 días, también un 404. Sin vh, lo que publica
 * tardaba en llegar: el 2026-11-10, con Aha ya en español en yatta, la lista llegaba en una copia del día 7 sin
 * ella, y sus detalles, en un 404 de hacía 6 días. Su web pone en vh la versión de sus datos, que no se publica
 * aparte; el minuto siempre trae lo último y comparte la copia con las peticiones del mismo minuto.
 */
export const yattaUrl = (path: string, now: number) => `${YATTA}/${path}?vh=${Math.floor(now / 60_000)}`;

/** Nombres en español de yatta, por id. */
export const yattaNamesUrl = (kind: PullKind, now: number) =>
  yattaUrl(kind === 'character' ? 'avatar' : 'equipment', now);

/** Arte de cada Eidolón (dupe) de un personaje: 1…6. */
export const dupeImageUrl = (characterId: string, dupe: number) =>
  `${NANOKA_ASSETS}/rank/_dependencies/textures/${characterId}/${characterId}_Rank_${dupe}.webp`;

/** Retrato redondo de un personaje (128×128, centrado en la cara): la miniatura del plan y de Cuenta. */
export const characterPortraitUrl = (characterId: string) => `${NANOKA_ASSETS}/avatarroundicon/${characterId}.webp`;

/** Icono mediano de un cono de luz. */
export const lightConeImageUrl = (lightConeId: string) => `${NANOKA_ASSETS}/lightconemediumicon/${lightConeId}.webp`;

/**
 * Icono de un cono de luz en StarRailRes. Puede no tener aún el contenido beta: el plan recurre entonces a
 * lightConeImageUrl.
 */
export const lightConeIconUrl = (lightConeId: string) => `${STAR_RAIL_RES}/light_cone/${lightConeId}.png`;

/** Icono de una vía (blanco sobre transparente: se usa como máscara con el color del texto). */
export const pathIconUrl = (icon: string) => `${STAR_RAIL_RES}/path/${icon}.png`;
