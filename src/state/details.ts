import { useEffect, useState } from 'react';
import {
  DETAILS_SOURCES,
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
}

const keyOf = ({ kind, id }: DetailsRef) => `${kind}:${id}`;

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
export function cachedDetails(ref: DetailsRef): Details | null {
  const key = keyOf(ref);
  const hit = memory.get(key) ?? normalizeDetails(ref.kind, readStored()[key]);
  if (hit) memory.set(key, hit);
  return hit;
}

/**
 * Prueba las fuentes por orden (yatta.moe, luego nanoka.cc) y se queda con la primera que los tiene. Se salta
 * yatta.moe si hace menos de YATTA_RETRY_MS que no lo tenía.
 */
async function fetchFirst(ref: DetailsRef): Promise<{ source: DetailsSource; details: Details }> {
  const missedAt = readMisses()[keyOf(ref)];
  const skipYatta = missedAt !== undefined && Date.now() - missedAt < YATTA_RETRY_MS;
  let error: unknown = null;
  for (const source of DETAILS_SOURCES) {
    if (source === 'yatta' && skipYatta) continue;
    try {
      const res = await fetch(detailsUrl(source, ref.kind, ref.id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const details = parseDetails(source, ref.kind, await res.json());
      // Solo cuenta como que yatta.moe no lo tiene si nanoka.cc sí responde: si fallan las dos, será la red.
      if (source !== 'yatta' && !skipYatta) setMiss(keyOf(ref), Date.now());
      return { source, details };
    } catch (e) {
      error = e;
    }
  }
  throw error;
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
  const [state, setState] = useState<{ key: string; details: Details | null; failed: boolean } | null>(null);
  const key = kind && id ? `${kind}:${id}` : null;

  useEffect(() => {
    if (!kind || !id) return;
    let alive = true;
    loadDetails({ kind, id }).then(
      (details) => alive && setState({ key: `${kind}:${id}`, details, failed: false }),
      () => alive && setState({ key: `${kind}:${id}`, details: null, failed: true }),
    );
    return () => {
      alive = false;
    };
  }, [kind, id]);

  if (!kind || !id) return { details: null, failed: false };
  // Lo que ya está en caché se muestra en el primer render, sin esperar al efecto.
  if (state?.key === key) return state;
  return { details: cachedDetails({ kind, id }), failed: false };
}
