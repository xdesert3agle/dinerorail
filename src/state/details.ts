import { useEffect, useState } from 'react';
import {
  DETAILS_VERSION,
  detailsUrl,
  normalizeDetails,
  parseDetails,
  type Details,
  type DetailsSource,
} from '../engine/details';
import type { PullKind } from '../engine/types';
import { isObj } from '../engine/util';

/*
 * Caché de los detalles (Eidolones y efectos de conos) para el popover de la galería de dupes. Como el
 * catálogo, va aparte del estado de la app. Se guarda lo útil en localStorage, así que cada uno se
 * descarga una vez por versión de los datos (DETAILS_VERSION). Lo que sale de nanoka.cc (en inglés,
 * porque yatta.moe aún no lo tiene) solo se queda en memoria. Que yatta.moe no lo tenía sí se guarda
 * (MISSES_KEY): durante YATTA_RETRY_MS se va directo a nanoka.cc, sin una petición fallida en cada
 * carga, y pasado ese tiempo se vuelve a probar con yatta.moe, por si ya está en español.
 */
const DETAILS_KEY = 'hsr-jades:details:v1';
const MISSES_KEY = 'hsr-jades:details-misses:v1';
const YATTA_RETRY_MS = 24 * 60 * 60 * 1000;

export interface DetailsRef {
  kind: PullKind;
  id: string;
  /** Versión de nanoka del catálogo (para su respaldo en inglés); no forma parte de la clave de la caché. */
  version: string;
}

/** Clave de cada uno en las cachés (sin la versión: no cambia lo que se guarda). */
export const keyOf = ({ kind, id }: Pick<DetailsRef, 'kind' | 'id'>) => `${kind}:${id}`;

/** Lo guardado, si es de la versión actual de los datos; los detalles de cada uno se validan al leerlos. */
let stored: Record<string, unknown> | null = null;
const readStored = (): Record<string, unknown> => {
  if (stored) return stored;
  stored = {};
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? 'null');
    if (isObj(raw) && raw.base === DETAILS_VERSION && isObj(raw.items)) stored = raw.items;
  } catch {
    // Sin almacenamiento o con algo que no es JSON: se empieza de cero.
  }
  return stored;
};

/** Cuándo falló yatta.moe con cada uno (ms desde 1970), de la versión actual de los datos. */
let misses: Record<string, number> | null = null;
const readMisses = (): Record<string, number> => {
  if (misses) return misses;
  misses = {};
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(MISSES_KEY) ?? 'null');
    if (isObj(raw) && raw.base === DETAILS_VERSION && isObj(raw.items)) {
      for (const [key, at] of Object.entries(raw.items)) if (typeof at === 'number') misses[key] = at;
    }
  } catch {
    // Sin almacenamiento o con algo que no es JSON: se prueba yatta.moe con todo.
  }
  return misses;
};

/** Apunta (o borra, con null) el fallo de yatta.moe con uno; de paso tira los que ya caducaron. */
const setMiss = (key: string, at: number | null) => {
  const now = Date.now();
  const items = Object.fromEntries(Object.entries(readMisses()).filter(([, t]) => now - t < YATTA_RETRY_MS));
  if (at === null) delete items[key];
  else items[key] = at;
  misses = items;
  try {
    localStorage.setItem(MISSES_KEY, JSON.stringify({ base: DETAILS_VERSION, items }));
  } catch {
    // Navegación privada o almacenamiento lleno: se volverá a probar yatta.moe en la próxima visita.
  }
};

const memory = new Map<string, Details>();
const pending = new Map<string, Promise<Details>>();

/** Los detalles si ya están (en memoria o guardados), sin descargar nada. */
export function cachedDetails(ref: Pick<DetailsRef, 'kind' | 'id'>): Details | null {
  const key = keyOf(ref);
  const hit = memory.get(key) ?? normalizeDetails(ref.kind, readStored()[key]);
  if (hit) memory.set(key, hit);
  return hit;
}

async function fetchFrom(source: DetailsSource, ref: DetailsRef): Promise<Details> {
  const res = await fetch(detailsUrl(source, ref.kind, ref.id, ref.version));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseDetails(source, ref.kind, await res.json());
}

/**
 * Primero yatta.moe (en español) y, si no lo tiene, nanoka.cc (en inglés). Se salta yatta.moe si hace menos de
 * YATTA_RETRY_MS que no lo tenía.
 */
async function fetchFirst(ref: DetailsRef): Promise<{ source: DetailsSource; details: Details }> {
  const missedAt = readMisses()[keyOf(ref)];
  const tryYatta = missedAt === undefined || Date.now() - missedAt >= YATTA_RETRY_MS;
  if (tryYatta) {
    try {
      return { source: 'yatta', details: await fetchFrom('yatta', ref) };
    } catch {
      // Se prueba con nanoka.cc.
    }
  }
  const details = await fetchFrom('nanoka', ref);
  // Solo cuenta como que yatta.moe no lo tiene si nanoka.cc sí responde: si fallan las dos, será la red.
  if (tryYatta) setMiss(keyOf(ref), Date.now());
  return { source: 'nanoka', details };
}

/** Los detalles de un personaje o cono, descargándolos si hace falta (una sola descarga a la vez por cada uno). */
export function loadDetails(ref: DetailsRef): Promise<Details> {
  const hit = cachedDetails(ref);
  if (hit) return Promise.resolve(hit);
  const key = keyOf(ref);
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      const { source, details } = await fetchFirst(ref);
      memory.set(key, details);
      if (source !== 'yatta') return details;
      if (readMisses()[key] !== undefined) setMiss(key, null);
      const items = { ...readStored(), [key]: details };
      stored = items;
      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ base: DETAILS_VERSION, items }));
      } catch {
        // Navegación privada o almacenamiento lleno: se queda en memoria hasta recargar.
      }
      return details;
    })().finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

/** Descarga de fondo lo que falte; si algo falla, se reintenta al pasar el ratón. */
export function prefetchDetails(refs: DetailsRef[]) {
  for (const ref of refs) loadDetails(ref).catch(() => {});
}

/** Detalles para mostrar: null mientras se descargan; failed si la descarga ha fallado. */
export function useDetails(ref: DetailsRef | null): { details: Details | null; failed: boolean } {
  const kind = ref?.kind;
  const id = ref?.id;
  const version = ref?.version;
  const [state, setState] = useState<{ key: string; details: Details | null; failed: boolean } | null>(null);
  const key = kind && id ? keyOf({ kind, id }) : null;

  useEffect(() => {
    if (!kind || !id || !version) return;
    let alive = true;
    loadDetails({ kind, id, version }).then(
      (details) => alive && setState({ key: keyOf({ kind, id }), details, failed: false }),
      () => alive && setState({ key: keyOf({ kind, id }), details: null, failed: true }),
    );
    return () => {
      alive = false;
    };
  }, [kind, id, version]);

  if (!kind || !id) return { details: null, failed: false };
  // Lo que ya está en caché se muestra en el primer render, sin esperar al efecto.
  if (state?.key === key) return state;
  return { details: cachedDetails({ kind, id }), failed: false };
}
