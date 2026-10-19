import { useEffect, useState } from 'react';
import { DATA_URL } from '../engine/catalog';
import {
  detailsUrl,
  normalizeDetails,
  parseCharacterDetails,
  parseLightConeDetails,
  type Details,
} from '../engine/details';
import type { PullKind } from '../engine/types';
import { isObj } from '../engine/util';

/*
 * Caché de los detalles (Eidolones y efectos de conos) para el popover de la galería de dupes. Como el
 * catálogo, va aparte del estado de la app. nanoka.cc solo deja cachear sus JSON 2 minutos, así que se
 * guarda lo útil en localStorage: cada uno se descarga una vez por versión de los datos (DATA_URL).
 */
const DETAILS_KEY = 'hsr-jades:details:v1';

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
    if (isObj(raw) && raw.base === DATA_URL && isObj(raw.items)) stored = raw.items;
  } catch {
    // Sin almacenamiento o con algo que no es JSON: se empieza de cero.
  }
  return stored;
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

/** Los detalles de un personaje o cono, descargándolos si hace falta (una sola descarga a la vez por cada uno). */
export function loadDetails(ref: DetailsRef): Promise<Details> {
  const hit = cachedDetails(ref);
  if (hit) return Promise.resolve(hit);
  const key = keyOf(ref);
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      const res = await fetch(detailsUrl(ref.kind, ref.id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      const details = ref.kind === 'character' ? parseCharacterDetails(json) : parseLightConeDetails(json);
      memory.set(key, details);
      const items = { ...readStored(), [key]: details };
      stored = items;
      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ base: DATA_URL, items }));
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
