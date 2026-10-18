import type { PullKind } from './types';

/*
 * Reglas del juego: cuánto vale cada cosa y las probabilidades de los banners.
 * Todo lo que depende de cómo funciona el gacha sale de aquí.
 */

/** Jades que cuesta una tirada (1 single). */
export const JADES_PER_PULL = 160;

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

/*
 * Cosmiluz Inextinguible que se recupera al tirar. En la tienda, 20 de Cosmiluz = 1 Pase Especial.
 * - 5★ (personaje repetido o cono): 40. Un personaje 5★ más allá de E6 da 100, pero se supone que no.
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
export const FOUR_STAR_RATE = 0.13;
/** Probabilidad de que el 4★ sea el destacado, en cada banner (sin contar el garantizado). */
export const FOUR_STAR_FEATURED_CHANCE: Record<PullKind, number> = { character: 0.5, lightCone: 0.75 };
/** Reserva total de 4★ y cuántos están destacados en cada banner (y no salen como no destacados). */
export const FOUR_STAR_POOL = { characters: 22, lightCones: 31 } as const;
export const FEATURED_4_STARS = 3;

/** Tiradas que hacen falta de media para cada 4★ (≈ 7,69). */
export const PULLS_PER_4_STAR = 1 / FOUR_STAR_RATE;

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
