import type { PullKind } from './types';

/*
 * Reglas del juego: cuánto vale cada cosa y las probabilidades de los banners.
 * Todo lo que depende de cómo funciona el gacha sale de aquí.
 */

/** Jades que cuesta una tirada (1 single). */
export const JADES_PER_PULL = 160;

/** Unos Jades en tiradas enteras y los que sobran (no llegan a otra). */
export const splitJades = (jades: number) => ({
  singles: Math.floor(jades / JADES_PER_PULL),
  spare: jades % JADES_PER_PULL,
});

/** Eidolón máximo de un personaje: E6 (la 7.ª copia). */
export const MAX_EIDOLON = 6;

/** Superposición máxima de un cono de luz: S5 (la 5.ª copia). */
export const MAX_SUPERIMPOSITION = 5;

/**
 * Vías, en el orden del juego: el código interno (el `baseType` de nanoka), su nombre en español y el nombre de
 * su icono en StarRailRes (icon/path/<icon>.png).
 */
export const PATHS = [
  { id: 'Warrior', name: 'Destrucción', icon: 'Destruction' },
  { id: 'Rogue', name: 'Cacería', icon: 'Hunt' },
  { id: 'Mage', name: 'Erudición', icon: 'Erudition' },
  { id: 'Shaman', name: 'Armonía', icon: 'Harmony' },
  { id: 'Warlock', name: 'Nihilidad', icon: 'Nihility' },
  { id: 'Knight', name: 'Conservación', icon: 'Preservation' },
  { id: 'Priest', name: 'Abundancia', icon: 'Abundance' },
  { id: 'Memory', name: 'Reminiscencia', icon: 'Remembrance' },
  { id: 'Elation', name: 'Exultación', icon: 'Elation' },
] as const;
export type PathId = (typeof PATHS)[number]['id'];
export const isPathId = (v: unknown): v is PathId => PATHS.some((p) => p.id === v);

/** Tiradas que se cuentan por cada 5★ en el peor caso de la planificación, si no se configura otra cosa. */
export const DEFAULT_HARD_PITY: Record<PullKind, number> = { character: 80, lightCone: 70 };

/*
 * Probabilidades reales de los banners limitados (las publicadas por el juego, con el pity suave
 * que se ha medido en la comunidad):
 * - Personaje: 0,6 % por tirada; desde la 74 sube un 6 % por tirada; garantizado en la 90. 50/50.
 * - Cono: 0,8 % por tirada; desde la 66 sube un 7 % por tirada; garantizado en la 80. 75/25.
 */
export interface BannerModel {
  base: number;
  softPityFrom: number;
  softPityStep: number;
  hardPity: number;
  featuredChance: number;
}

export const BANNERS: Record<PullKind, BannerModel> = {
  character: { base: 0.006, softPityFrom: 74, softPityStep: 0.06, hardPity: 90, featuredChance: 0.5 },
  lightCone: { base: 0.008, softPityFrom: 66, softPityStep: 0.07, hardPity: 80, featuredChance: 0.75 },
};

/** Probabilidad de 5★ en la tirada número `n` desde el último 5★ (empezando en 1). */
export function fiveStarChance(kind: PullKind, n: number): number {
  const b = BANNERS[kind];
  if (n >= b.hardPity) return 1;
  if (n < b.softPityFrom) return b.base;
  return Math.min(1, b.base + b.softPityStep * (n - b.softPityFrom + 1));
}

/**
 * Probabilidad consolidada de 5★ por tirada, contando el pity (la oficial: 1,6 % personaje, 1,87 % cono):
 * 1 entre las tiradas medias hasta un 5★, que son la suma de la probabilidad de seguir sin él.
 */
export function fiveStarRate(kind: PullKind): number {
  let survive = 1;
  let mean = 0;
  for (let n = 1; n <= BANNERS[kind].hardPity; n++) {
    mean += survive;
    survive *= 1 - fiveStarChance(kind, n);
  }
  return 1 / mean;
}

/*
 * Cosmiluz Inextinguible que se recupera al tirar. En la tienda, 20 de Cosmiluz = 1 Pase Especial.
 * - Cono 5★: 40, también el primero. Personaje 5★: nada si es nuevo, 40 si es repetido (de E1 a E6) y 100
 *   pasado E6 (targetStarlight). El del 50/50 perdido (uno de la reserva estándar) se supone repetido: 40.
 * - 4★: 13 % por tirada, la probabilidad consolidada oficial (5,1 % base con el garantizado cada 10).
 *   Personaje 4★ (siempre en E6): 20. Cono 4★: 8.
 * - Qué 4★ sale: uno de los 3 destacados (personajes en su banner, conos en el de conos) con un
 *   50 % / 75 %, y si no sale, el siguiente lo es seguro. Si no es destacado, es cualquiera de la
 *   reserva (22 personajes y 31 conos) menos los 3 destacados de ese banner.
 */
export const STARLIGHT_PER_5_STAR = 40;
export const STARLIGHT_PER_5_STAR_E6 = 100;
export const STARLIGHT_PER_4_STAR = { character: 20, lightCone: 8 } as const;
export const STARLIGHT_PER_PASS = 20;

/**
 * Cosmiluz que da el 5★ buscado de una fila, según las copias suyas que hay antes (`copiesBefore`: las de la
 * cuenta y las de las filas anteriores, de planCopies). Si no se sabe (null: sin catálogo o fuera de él), el
 * personaje se cuenta como nuevo, que es lo seguro.
 */
export function targetStarlight(kind: PullKind, copiesBefore: number | null): number {
  if (kind === 'lightCone') return STARLIGHT_PER_5_STAR;
  if (!copiesBefore) return 0;
  return copiesBefore <= MAX_EIDOLON ? STARLIGHT_PER_5_STAR : STARLIGHT_PER_5_STAR_E6;
}

export const FOUR_STAR_RATE = 0.13;
/** Probabilidad base de 4★ por tirada, sin contar el garantizado cada 10 (la publicada por el juego). */
export const FOUR_STAR_BASE_RATE = 0.051;
/** Probabilidad de que el 4★ sea el destacado, en cada banner (sin contar el garantizado). */
export const FOUR_STAR_FEATURED_CHANCE: Record<PullKind, number> = { character: 0.5, lightCone: 0.75 };
/** Reserva total de 4★ y cuántos están destacados en cada banner (y no salen como no destacados). */
export const FOUR_STAR_POOL = { characters: 22, lightCones: 31 } as const;
export const FEATURED_4_STARS = 3;

/** Tiradas que hacen falta de media para cada 4★ (≈ 7,69). */
export const PULLS_PER_4_STAR = 1 / FOUR_STAR_RATE;
/** Un 4★ seguro cada 10 tiradas, como mínimo (el peor caso de la previsión). */
export const FOUR_STAR_PITY = 10;

/** Lo que dura una versión (6 semanas): para proponer el inicio de una nueva y estimar las que no se conocen. */
export const PATCH_LENGTH_DAYS = 42;

/**
 * Lo que dura un ciclo de los modos de reto (Salón Olvidado, Pura Ficción, Espejismo Apocalíptico): el de las
 * fuentes «Cada N días» si no se dice otro.
 */
export const DEFAULT_CYCLE_DAYS = 42;

/**
 * Cosmiluz media de un 4★ en cada banner. Con el garantizado, la parte de destacados es 1 / (2 − p):
 * 2/3 en el de personaje y 4/5 en el de conos. El resto sale de la reserva sin los 3 destacados:
 * 19 personajes y 31 conos en el de personaje; 22 personajes y 28 conos en el de conos.
 * Personaje ≈ 17,5; cono ≈ 9,06.
 */
export const STARLIGHT_PER_AVERAGE_4_STAR: Record<PullKind, number> = (() => {
  const average = (kind: PullKind) => {
    const characters = FOUR_STAR_POOL.characters - (kind === 'character' ? FEATURED_4_STARS : 0);
    const lightCones = FOUR_STAR_POOL.lightCones - (kind === 'lightCone' ? FEATURED_4_STARS : 0);
    const fromPool =
      (characters * STARLIGHT_PER_4_STAR.character + lightCones * STARLIGHT_PER_4_STAR.lightCone) /
      (characters + lightCones);
    const featuredShare = 1 / (2 - FOUR_STAR_FEATURED_CHANCE[kind]);
    return featuredShare * STARLIGHT_PER_4_STAR[kind] + (1 - featuredShare) * fromPool;
  };
  return { character: average('character'), lightCone: average('lightCone') };
})();
