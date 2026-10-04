import { addDays, todayISO } from './dates';
import { DEFAULT_HARD_PITY } from './pulls';
import type { AppState, Reward, Source } from './types';

export const JADES_PER_PULL = 160;
/** Duración habitual de un parche: se usa para proponer la fecha de inicio de un parche nuevo. */
export const PATCH_LENGTH_DAYS = 42;

const reward = (jades: number, specialPasses = 0): Reward => ({ jades, specialPasses });

/*
 * Cantidades por defecto. Todas son editables desde la app.
 * Fuentes consultadas (octubre de 2026):
 * - Endgames: 800 Jades por ciclo + 100 por el modo Starward (desde la 4.3) → 900.
 *   https://game8.co/games/Honkai-Star-Rail/archives/477238
 * - Fechas de reinicio: calendario oficial del parche 4.6 (lunes a las 04:00, hora del servidor; ciclos de 42 días):
 *   Espejismo Apocalíptico 05/10–16/11, Pura Ficción 19/10–30/11, Memoria del Caos 02/11–14/12.
 * - Eventos de la 4.6: ~2060 Jades. https://www.sportskeeda.com/esports/honkai-star-rail-hsr-4-6-stellar-jade-count-total-pulls-estimation-leak
 * - Honor Anónimo: Gloria Anónima da 680 Jades + 4 Pases Especiales. https://honkai-star-rail.fandom.com/wiki/Nameless_Honor
 * - Tienda de Ascuas: 5 Pases Especiales al mes. https://game8.co/games/Honkai-Star-Rail/archives/409234
 * Los Pases normales (banner permanente) no se tienen en cuenta.
 */
export function defaultSources(today = todayISO()): Source[] {
  return [
    {
      id: 'daily-training',
      name: 'Entrenamiento diario',
      category: 'diario',
      enabled: true,
      schedule: { type: 'daily' },
      reward: reward(60),
      pendingNow: false,
    },
    {
      id: 'express-pass',
      name: 'Pase de Suministros del Expreso',
      description: 'La bendición: 90 Jades cada día al iniciar sesión.',
      category: 'diario',
      enabled: true,
      schedule: { type: 'daily' },
      reward: reward(90),
      pendingNow: false,
    },
    {
      id: 'weekly',
      name: 'Recompensa semanal',
      description: 'Se puede hacer cualquier día; se considera cobrada el lunes.',
      category: 'semanal',
      enabled: true,
      schedule: { type: 'weekly', weekday: 0 },
      reward: reward(225),
      pendingNow: false,
    },
    {
      id: 'memory-of-chaos',
      name: 'Salón Olvidado',
      description: '800 + 100 del modo Starward. Ciclos de 6 semanas.',
      category: 'endgame',
      enabled: true,
      schedule: { type: 'cycle', anchor: '2026-11-02', periodDays: 42 },
      reward: reward(900),
      pendingNow: false,
    },
    {
      id: 'apocalyptic-shadow',
      name: 'Espejismo Apocalíptico',
      description: '800 + 100 del modo Starward. Ciclos de 6 semanas.',
      category: 'endgame',
      enabled: true,
      schedule: { type: 'cycle', anchor: '2026-10-05', periodDays: 42 },
      reward: reward(900),
      pendingNow: false,
    },
    {
      id: 'pure-fiction',
      name: 'Pura Ficción',
      description: '800 + 100 del modo Starward. Ciclos de 6 semanas.',
      category: 'endgame',
      enabled: true,
      schedule: { type: 'cycle', anchor: '2026-10-19', periodDays: 42 },
      reward: reward(900),
      pendingNow: false,
    },
    {
      id: 'maintenance',
      name: 'Compensación mantenimiento',
      category: 'parche',
      enabled: true,
      schedule: { type: 'perPatch', offsetDays: 0 },
      reward: reward(600),
      pendingNow: false,
    },
    {
      id: 'livestream-codes',
      name: 'Códigos del directo',
      description: 'El directo es ~12 días antes del parche.',
      category: 'parche',
      enabled: true,
      schedule: { type: 'perPatch', offsetDays: -12 },
      reward: reward(300),
      pendingNow: false,
    },
    {
      id: 'story-exploration',
      name: 'Misiones nuevas y exploración',
      description: 'Historia, mapas nuevos, cofres y logros. Varía mucho según el parche.',
      category: 'parche',
      enabled: false,
      schedule: { type: 'perPatch', offsetDays: 0 },
      reward: reward(700),
      pendingNow: false,
    },
    {
      id: 'character-trials',
      name: 'Pruebas de personajes',
      description: '20 Jades por prueba, unas 8 por parche.',
      category: 'parche',
      enabled: false,
      schedule: { type: 'perPatch', offsetDays: 0 },
      reward: reward(160),
      pendingNow: false,
    },
    {
      id: 'nameless-glory',
      name: 'Honor Anónimo',
      description: 'Pase de batalla de pago: 680 Jades + 4 Pases Especiales por parche.',
      category: 'parche',
      enabled: false,
      schedule: { type: 'perPatch', offsetDays: 0 },
      reward: reward(680, 4),
      pendingNow: false,
    },
    {
      id: 'gift-of-odyssey',
      name: 'Regalo de Odisea',
      description: 'Evento de inicio de sesión de 7 días. No sale en todos los parches.',
      category: 'parche',
      enabled: false,
      schedule: { type: 'perPatch', offsetDays: 0 },
      reward: reward(0, 10),
      pendingNow: false,
    },
    {
      id: 'embers-shop',
      name: 'Tienda de Ascuas',
      description: 'Hasta 5 Pases Especiales al mes a cambio de Ascuas, si tienes suficientes.',
      category: 'mensual',
      enabled: false,
      schedule: { type: 'monthly', day: 1 },
      reward: reward(0, 5),
      pendingNow: false,
    },
    {
      id: 'hoyolab-checkin',
      name: 'Check-in de HoYoLAB',
      description: 'Aproximado: el calendario cambia cada mes.',
      category: 'mensual',
      enabled: false,
      schedule: { type: 'monthly', day: 1 },
      reward: reward(60),
      pendingNow: false,
    },
    {
      id: 'express-pass-renewal',
      name: 'Renovación del Pase de Suministros',
      description: 'Las 300 Esquirlas Oníricas que da cada compra (cuentan como Jades).',
      category: 'otro',
      enabled: false,
      schedule: { type: 'cycle', anchor: addDays(today, 30), periodDays: 30 },
      reward: reward(300),
      pendingNow: false,
    },
  ];
}

/** Fecha por defecto para un evento nuevo: el inicio del parche, o mañana si el parche ya ha empezado. */
export function defaultEventDate(patchStart: string, today = todayISO()): string {
  const tomorrow = addDays(today, 1);
  return patchStart > tomorrow ? patchStart : tomorrow;
}

export function defaultState(today = todayISO()): AppState {
  const date = defaultEventDate('2026-09-28', today);
  const ev = (id: string, name: string, jades: number) => ({ id: `4.6-${id}`, name, date, jades, specialPasses: 0 });
  return {
    version: 1,
    inventory: { jades: 0, specialPasses: 0, shards: 0, starlight: 0 },
    pity: { character: 0, lightCone: 0 },
    guaranteed: { character: false, lightCone: false },
    plannedPulls: [],
    shardPacks: {},
    targetDate: addDays(today, 42),
    sources: defaultSources(today),
    patches: [
      {
        id: 'patch-4.6',
        version: '4.6',
        start: '2026-09-28',
        events: [
          ev('love-ghosts-robots', 'Love, Ghosts, and Robots', 1000),
          ev('peace-festival', 'Interstellar Peace Festival: One Take', 500),
          ev('wishpower', 'Wishpower Up! Down with the Voracity!', 500),
          ev('twitch-discord', 'Twitch Drops y Discord', 60),
        ],
      },
    ],
    settings: {
      skin: 'aha',
      theme: 'system',
      includeShards: true,
      countStarlight: true,
      packsInYen: false,
      hardPity: { ...DEFAULT_HARD_PITY },
    },
  };
}
