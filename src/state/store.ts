import { useEffect, useRef, useState } from 'react';
import { byName, clampEidolon } from '../engine/account';
import { isValidISO } from '../engine/dates';
import { DEFAULT_CYCLE_DAYS, defaultState } from '../engine/defaults';
import { SHARD_PACKS } from '../engine/packs';
import { DEFAULT_HARD_PITY } from '../engine/rules';
import type {
  Account,
  AppState,
  OwnedCharacter,
  Patch,
  PatchEvent,
  PlannedPull,
  PullKind,
  Reward,
  Schedule,
  Settings,
  ShardPackPurchase,
  Skin,
  Source,
  SourceCategory,
  ThemeMode,
} from '../engine/types';
import { isObj, newId } from '../engine/util';

const STORAGE_KEY = 'hsr-jades:v1';
/** Copia de lo guardado que no se pudo leer (ver load). */
const UNREADABLE_KEY = 'hsr-jades:v1:unreadable';

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
/** Una cantidad (Jades, Pases, Esquirlas…): entera y no negativa. */
const count = (v: unknown) => Math.max(0, Math.floor(num(v)));
/** Entero, con signo (días de desfase, días de la semana o del mes). */
const int = (v: unknown, fallback = 0) => Math.trunc(num(v, fallback));
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const date = (v: unknown, fallback: string) => (isValidISO(v) ? v : fallback);

const CATEGORIES: SourceCategory[] = ['diario', 'semanal', 'endgame', 'parche', 'mensual', 'otro'];
/** Los temas que hay. Uno que ya no existe pasa al de por defecto. */
export const SKINS: Skin[] = ['aha', 'sparxie'];
const THEMES: ThemeMode[] = ['system', 'light', 'dark'];
const PULL_KINDS: PullKind[] = ['character', 'lightCone'];

/** Uno de los valores de la lista, o el de reserva. */
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  list.find((x) => x === v) ?? fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
/** Una lista guardada, sin los elementos que no se pueden leer; la de reserva si no es una lista. */
const list = <T>(v: unknown, parse: (x: unknown) => T | null, fallback: T[]): T[] =>
  Array.isArray(v) ? v.map(parse).filter((x): x is T => x !== null) : fallback;

/** Solo se guardan los paquetes conocidos, con cantidades enteras no negativas. */
function normalizeShardPacks(v: unknown): Record<string, ShardPackPurchase> {
  const o = isObj(v) ? v : {};
  const out: Record<string, ShardPackPurchase> = {};
  for (const pack of SHARD_PACKS) {
    const p = o[pack.id];
    if (!isObj(p)) continue;
    out[pack.id] = { count: count(p.count), firstBonus: bool(p.firstBonus, true) };
  }
  return out;
}

function normalizeReward(v: unknown): Reward {
  const o = isObj(v) ? v : {};
  return { jades: count(o.jades), specialPasses: count(o.specialPasses) };
}

function normalizeSchedule(v: unknown): Schedule | null {
  if (!isObj(v)) return null;
  switch (v.type) {
    case 'daily':
      return { type: 'daily' };
    case 'weekly':
      return { type: 'weekly', weekday: Math.min(6, Math.max(0, int(v.weekday))) };
    case 'monthly':
      return { type: 'monthly', day: Math.min(31, Math.max(1, int(v.day, 1))) };
    case 'cycle':
      return isValidISO(v.anchor)
        ? { type: 'cycle', anchor: v.anchor, periodDays: Math.max(1, int(v.periodDays, DEFAULT_CYCLE_DAYS)) }
        : null;
    case 'perPatch':
      return { type: 'perPatch', offsetDays: int(v.offsetDays) };
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
    category: oneOf(CATEGORIES, v.category, 'otro'),
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
    id: str(v.id, newId('event')),
    name: str(v.name),
    date: date(v.date, patchStart),
    jades: count(v.jades),
    specialPasses: count(v.specialPasses),
  };
}

function normalizePatch(v: unknown): Patch | null {
  if (!isObj(v) || !isValidISO(v.start)) return null;
  const start = v.start;
  return {
    id: str(v.id, `patch-${start}`),
    version: str(v.version, '?'),
    start,
    events: list(v.events, (e) => normalizeEvent(e, start), []),
  };
}

function normalizePlannedPull(v: unknown): PlannedPull | null {
  if (!isObj(v)) return null;
  const kind = PULL_KINDS.find((k) => k === v.kind);
  if (!kind) return null;
  return {
    id: str(v.id, newId('pull')),
    name: str(v.name),
    ...(typeof v.entryId === 'string' ? { entryId: v.entryId } : {}),
    kind,
    winsFiftyFifty: v.winsFiftyFifty === true,
  };
}

/** Personajes de la cuenta: con id, sin repetidos y con el Eidolón entre 0 y 6. */
function normalizeAccount(v: unknown): Account {
  const o = isObj(v) ? v : {};
  const byId = new Map<string, OwnedCharacter>();
  for (const c of Array.isArray(o.characters) ? o.characters : []) {
    if (!isObj(c) || typeof c.id !== 'string' || byId.has(c.id)) continue;
    byId.set(c.id, { id: c.id, name: str(c.name, c.id), eidolon: clampEidolon(num(c.eidolon)) });
  }
  return {
    characters: [...byId.values()].sort(byName),
    importedAt: typeof o.importedAt === 'number' && Number.isFinite(o.importedAt) ? o.importedAt : null,
  };
}

/**
 * Valida un estado leído de localStorage, rellenando lo que falte con los valores por defecto. No convierte
 * formatos antiguos: lo guardado ya tiene el formato actual (se reescribe cada vez que se abre la app).
 */
export function normalizeState(raw: unknown): AppState {
  const d = defaultState();
  if (!isObj(raw) || raw.version !== 1) throw new Error('Estado guardado no válido (versión desconocida).');
  const inv = isObj(raw.inventory) ? raw.inventory : {};
  const pity = isObj(raw.pity) ? raw.pity : {};
  const settings = isObj(raw.settings) ? raw.settings : {};

  // Fuentes predefinidas: el nombre y la descripción no se editan, salen siempre de la versión actual, y las
  // que se añadan en versiones futuras aparecen aunque lo guardado sea anterior.
  const sources = list(raw.sources, normalizeSource, d.sources).map((src) => {
    const def = src.custom ? undefined : d.sources.find((s) => s.id === src.id);
    return def ? { ...src, name: def.name, description: def.description } : src;
  });
  for (const def of d.sources) if (!sources.some((s) => s.id === def.id)) sources.push(def);

  // Tiradas por 5★ configuradas; si faltan o no son válidas, las de por defecto (80 y 70).
  const savedHardPity = isObj(settings.hardPity) ? settings.hardPity : {};
  const hardPityOf = (kind: PullKind) => {
    const v = Math.floor(num(savedHardPity[kind]));
    return v >= 1 ? v : DEFAULT_HARD_PITY[kind];
  };

  return {
    version: 1,
    inventory: {
      jades: count(inv.jades),
      specialPasses: count(inv.specialPasses),
      shards: count(inv.shards),
      starlight: count(inv.starlight),
    },
    // Tal cual: el que cuenta, limitado al máximo, lo da effectivePity. Si se baja el máximo y se vuelve a
    // subir, el pity escrito sigue ahí.
    pity: { character: count(pity.character), lightCone: count(pity.lightCone) },
    guaranteed: {
      character: isObj(raw.guaranteed) && raw.guaranteed.character === true,
      lightCone: isObj(raw.guaranteed) && raw.guaranteed.lightCone === true,
    },
    plannedPulls: list(raw.plannedPulls, normalizePlannedPull, d.plannedPulls),
    account: normalizeAccount(raw.account),
    targetDate: date(raw.targetDate, d.targetDate),
    sources,
    patches: list(raw.patches, normalizePatch, d.patches),
    shardPacks: normalizeShardPacks(raw.shardPacks),
    settings: {
      skin: oneOf(SKINS, settings.skin, d.settings.skin),
      theme: oneOf(THEMES, settings.theme, d.settings.theme),
      includeShards: bool(settings.includeShards, d.settings.includeShards),
      countStarlight: bool(settings.countStarlight, d.settings.countStarlight),
      packsInYen: bool(settings.packsInYen, d.settings.packsInYen),
      includePacks: bool(settings.includePacks, d.settings.includePacks),
      hardPity: { character: hardPityOf('character'), lightCone: hardPityOf('lightCone') },
    },
  };
}

function load(): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {
    // Sin acceso a localStorage o datos que no se pueden leer (corruptos, de otra versión, una migración que
    // falla): se empieza con los valores por defecto. Lo guardado se copia antes aparte, porque el estado nuevo
    // se escribe encima en cuanto arranca y sin la copia no habría forma de recuperarlo.
    try {
      if (raw) localStorage.setItem(UNREADABLE_KEY, raw);
    } catch {
      // Sin espacio o sin acceso: no hay dónde guardar la copia.
    }
  }
  return defaultState();
}

/**
 * Texto de un aviso. Con un nombre dentro («Evento «Ascuas» eliminado.»), el nombre va aparte: es lo único que
 * el aviso recorta si no cabe en su línea; lo de alrededor se ve entero.
 */
export type Notice = string | { before: string; name: string; after: string };

/** Un aviso que nombra lo quitado: `Evento «nombre» eliminado.`, con el nombre recortable. */
export const namedNotice = (before: string, name: string, after: string): Notice => ({
  before: `${before}«`,
  name,
  after: `»${after}`,
});

/** El texto entero de un aviso, para los lectores de pantalla. */
export const noticeText = (n: Notice) => (typeof n === 'string' ? n : n.before + n.name + n.after);

/**
 * Cambia el estado, como el setState de React. Los borrados pasan además el texto del aviso (`undo`): el
 * aviso (el toast de abajo a la izquierda) lo muestra con un botón para volver al estado de antes.
 */
export type ChangeState = (update: (s: AppState) => AppState, undo?: Notice) => void;

/** Actualización que cambia solo algunos ajustes: `onChange(withSettings({ includeShards }))`. */
export const withSettings =
  (patch: Partial<Settings>) =>
  (s: AppState): AppState => ({ ...s, settings: { ...s.settings, ...patch } });

/**
 * El estado de la app, guardado en localStorage y al día con las demás pestañas abiertas. `onExternalChange`
 * avisa cuando llega un cambio de otra pestaña (App cierra con él el aviso de deshacer, cuya foto ya no vale).
 */
export function useAppState(onExternalChange?: () => void) {
  const [state, setState] = useState<AppState>(load);
  const external = useRef(onExternalChange);
  external.current = onExternalChange;
  useEffect(() => {
    try {
      // Sin reescribir lo mismo: así no se avisa a las otras pestañas de un cambio que no hay.
      const json = JSON.stringify(state);
      if (localStorage.getItem(STORAGE_KEY) !== json) localStorage.setItem(STORAGE_KEY, json);
    } catch {
      // Navegación privada o almacenamiento bloqueado: la app sigue funcionando sin guardar.
    }
  }, [state]);
  // Otra pestaña abierta que guarda: se recoge su estado, para que lo siguiente que se guarde aquí no lo pise.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setState(normalizeState(JSON.parse(e.newValue)));
        external.current?.();
      } catch {
        // Lo que no se puede leer se ignora: esta pestaña sigue con el suyo.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return [state, setState] as const;
}
