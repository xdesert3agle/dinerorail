import { useEffect, useState } from 'react';
import { isValidISO } from '../engine/dates';
import { defaultEventDate, defaultState } from '../engine/defaults';
import { SHARD_PACKS } from '../engine/packs';
import { clampPity, DEFAULT_HARD_PITY } from '../engine/pulls';
import type {
  AppState,
  Patch,
  PatchEvent,
  PlannedPull,
  PullKind,
  Reward,
  Schedule,
  ShardPackPurchase,
  Skin,
  Source,
  SourceCategory,
  ThemeMode,
} from '../engine/types';

const STORAGE_KEY = 'hsr-jades:v1';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const date = (v: unknown, fallback: string) => (isValidISO(v) ? v : fallback);

const CATEGORIES: SourceCategory[] = ['diario', 'semanal', 'endgame', 'parche', 'mensual', 'otro'];
const SKINS: Skin[] = ['kafka', 'aha', 'grafito', 'sparxie'];
/** Temas que siguen en el código pero no salen en el selector: quien los tenga guardados pasa al de por defecto. */
export const HIDDEN_SKINS: Skin[] = ['kafka', 'grafito'];
/** Temas que han cambiado de nombre: el antiguo apunta al actual. */
const RENAMED_SKINS: Record<string, Skin> = { retro: 'sparxie' };
const THEMES: ThemeMode[] = ['system', 'light', 'dark'];

function normalizeSkin(v: unknown, fallback: Skin): Skin {
  if (typeof v !== 'string') return fallback;
  const skin = RENAMED_SKINS[v] ?? v;
  return SKINS.includes(skin as Skin) && !HIDDEN_SKINS.includes(skin as Skin) ? (skin as Skin) : fallback;
}

/** Solo se guardan los paquetes conocidos, con cantidades enteras no negativas. */
function normalizeShardPacks(v: unknown): Record<string, ShardPackPurchase> {
  const o = isObj(v) ? v : {};
  const out: Record<string, ShardPackPurchase> = {};
  for (const pack of SHARD_PACKS) {
    const p = o[pack.id];
    if (!isObj(p)) continue;
    out[pack.id] = {
      count: Math.max(0, Math.floor(num(p.count))),
      firstBonus: typeof p.firstBonus === 'boolean' ? p.firstBonus : true,
    };
  }
  return out;
}

function normalizeReward(v: unknown): Reward {
  const o = isObj(v) ? v : {};
  return { jades: num(o.jades), specialPasses: num(o.specialPasses) };
}

function normalizeSchedule(v: unknown): Schedule | null {
  if (!isObj(v)) return null;
  switch (v.type) {
    case 'daily':
      return { type: 'daily' };
    case 'weekly':
      return { type: 'weekly', weekday: Math.min(6, Math.max(0, num(v.weekday))) };
    case 'monthly':
      return { type: 'monthly', day: Math.min(31, Math.max(1, num(v.day, 1))) };
    case 'cycle':
      return isValidISO(v.anchor) ? { type: 'cycle', anchor: v.anchor, periodDays: Math.max(1, num(v.periodDays, 42)) } : null;
    case 'perPatch':
      return { type: 'perPatch', offsetDays: num(v.offsetDays) };
    default:
      return null;
  }
}

function normalizeSource(v: unknown): Source | null {
  if (!isObj(v) || typeof v.id !== 'string') return null;
  const schedule = normalizeSchedule(v.schedule);
  if (!schedule) return null;
  return {
    id: v.id,
    name: str(v.name, v.id),
    description: typeof v.description === 'string' ? v.description : undefined,
    category: CATEGORIES.includes(v.category as SourceCategory) ? (v.category as SourceCategory) : 'otro',
    enabled: v.enabled === true,
    schedule,
    reward: normalizeReward(v.reward),
    pendingNow: v.pendingNow === true,
    custom: v.custom === true || undefined,
  };
}

function normalizeEvent(v: unknown, patchStart: string): PatchEvent | null {
  if (!isObj(v)) return null;
  return {
    id: str(v.id, `event-${Math.random().toString(36).slice(2)}`),
    name: str(v.name),
    date: date(v.date, patchStart),
    jades: num(v.jades),
    specialPasses: num(v.specialPasses),
  };
}

function normalizePatch(v: unknown, defaults: Patch[]): Patch | null {
  if (!isObj(v) || !isValidISO(v.start)) return null;
  const base = { id: str(v.id, `patch-${v.start}`), version: str(v.version, '?'), start: v.start };

  if (Array.isArray(v.events)) {
    return { ...base, events: v.events.map((e) => normalizeEvent(e, base.start)).filter((e): e is PatchEvent => e !== null) };
  }

  // Migración: antes cada parche tenía un único total de eventos (eventJades/eventSpecialPasses).
  const jades = num(v.eventJades);
  const specialPasses = num(v.eventSpecialPasses);
  // Si era el valor por defecto antiguo de la 4.6, se sustituye por el nuevo desglose.
  const def = defaults.find((p) => p.version === base.version && p.start === base.start);
  if (def && jades === 2060 && specialPasses === 0) return { ...base, events: def.events };
  const events: PatchEvent[] =
    jades || specialPasses
      ? [{ id: `${base.id}-legacy`, name: 'Eventos (sin desglosar)', date: defaultEventDate(base.start), jades, specialPasses }]
      : [];
  return { ...base, events };
}

const PULL_KINDS: PullKind[] = ['character', 'lightCone'];

function normalizePlannedPull(v: unknown): PlannedPull | null {
  if (!isObj(v) || !PULL_KINDS.includes(v.kind as PullKind)) return null;
  return {
    id: str(v.id, `pull-${Math.random().toString(36).slice(2)}`),
    name: str(v.name),
    kind: v.kind as PullKind,
    winsFiftyFifty: v.winsFiftyFifty === true,
  };
}

/** Valida un estado leído de localStorage o de un JSON importado, rellenando lo que falte con los valores por defecto. */
export function normalizeState(raw: unknown): AppState {
  const d = defaultState();
  if (!isObj(raw) || raw.version !== 1) throw new Error('El archivo no es una copia de seguridad válida (versión desconocida).');
  const inv = isObj(raw.inventory) ? raw.inventory : {};
  const pity = isObj(raw.pity) ? raw.pity : {};
  const settings = isObj(raw.settings) ? raw.settings : {};

  const sources = Array.isArray(raw.sources)
    ? raw.sources.map(normalizeSource).filter((s): s is Source => s !== null)
    : d.sources;
  // Las fuentes predefinidas que se añadan en versiones futuras aparecen aunque el estado guardado sea antiguo.
  for (const def of d.sources) if (!sources.some((s) => s.id === def.id)) sources.push(def);
  // Migración: los datos guardados antes de quitar los Pases normales tienen la Tienda de Ascuas dando
  // Pases normales. Se sustituye por la nueva versión por defecto (Pases Especiales, desactivada).
  const oldEmbers = Array.isArray(raw.sources) ? raw.sources.find((s) => isObj(s) && s.id === 'embers-shop') : undefined;
  if (isObj(oldEmbers) && isObj(oldEmbers.reward) && 'standardPasses' in oldEmbers.reward) {
    const def = d.sources.find((s) => s.id === 'embers-shop')!;
    const i = sources.findIndex((s) => s.id === 'embers-shop');
    sources[i] = { ...sources[i], reward: def.reward, description: def.description, enabled: def.enabled };
  }
  for (const [i, src] of sources.entries()) {
    const def = d.sources.find((s) => s.id === src.id);
    if (!def || src.custom) continue;
    // El nombre y la descripción de las fuentes predefinidas no se editan: se toman siempre de la versión actual.
    let next: Source = { ...src, name: def.name, description: def.description };
    // Migración: la fecha de referencia antigua de Memoria del Caos (28/09/2026) era errónea; la real es 02/11/2026.
    if (src.id === 'memory-of-chaos' && src.schedule.type === 'cycle' && src.schedule.anchor === '2026-09-28') {
      next = { ...next, schedule: def.schedule };
    }
    sources[i] = next;
  }

  // Tiradas por 5★ configuradas; si faltan o no son válidas, las de por defecto (80 y 70).
  const savedHardPity = isObj(settings.hardPity) ? settings.hardPity : {};
  const hardPityOf = (kind: PullKind) => {
    const v = Math.floor(num(savedHardPity[kind]));
    return v >= 1 ? v : DEFAULT_HARD_PITY[kind];
  };
  const hardPity = { character: hardPityOf('character'), lightCone: hardPityOf('lightCone') };

  return {
    version: 1,
    inventory: {
      jades: num(inv.jades),
      specialPasses: num(inv.specialPasses),
      shards: num(inv.shards),
      starlight: Math.max(0, Math.floor(num(inv.starlight))),
    },
    pity: {
      character: clampPity('character', num(pity.character), hardPity),
      lightCone: clampPity('lightCone', num(pity.lightCone), hardPity),
    },
    guaranteed: {
      character: isObj(raw.guaranteed) && raw.guaranteed.character === true,
      lightCone: isObj(raw.guaranteed) && raw.guaranteed.lightCone === true,
    },
    plannedPulls: Array.isArray(raw.plannedPulls)
      ? raw.plannedPulls.map(normalizePlannedPull).filter((p): p is PlannedPull => p !== null)
      : d.plannedPulls,
    targetDate: date(raw.targetDate, d.targetDate),
    sources,
    patches: Array.isArray(raw.patches)
      ? raw.patches.map((p) => normalizePatch(p, d.patches)).filter((p): p is Patch => p !== null)
      : d.patches,
    shardPacks: normalizeShardPacks(raw.shardPacks),
    settings: {
      skin: normalizeSkin(settings.skin, d.settings.skin),
      theme: THEMES.includes(settings.theme as ThemeMode) ? (settings.theme as ThemeMode) : d.settings.theme,
      includeShards: typeof settings.includeShards === 'boolean' ? settings.includeShards : d.settings.includeShards,
      countStarlight:
        typeof settings.countStarlight === 'boolean' ? settings.countStarlight : d.settings.countStarlight,
      packsInYen: typeof settings.packsInYen === 'boolean' ? settings.packsInYen : d.settings.packsInYen,
      hardPity,
    },
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {
    // Sin acceso a localStorage o datos corruptos: se empieza con los valores por defecto.
  }
  return defaultState();
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Navegación privada o almacenamiento bloqueado: la app sigue funcionando sin guardar.
    }
  }, [state]);
  return [state, setState] as const;
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hsr-jades-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file: File): Promise<AppState> {
  return normalizeState(JSON.parse(await file.text()));
}
