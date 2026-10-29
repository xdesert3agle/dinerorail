import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FALLBACK_VERSION,
  nextWeeklySync,
  normalizeCatalog,
  parseCatalogEntries,
  parseManifestVersion,
  parseYattaNames,
  syncDue,
  type Catalog,
} from '../engine/catalog';
import type { PullKind } from '../engine/types';
import { catalogUrl, MANIFEST_URL, YATTA_NAMES_URLS } from '../engine/urls';

// Va aparte del estado de la app: es una caché de datos del juego.
const CATALOG_KEY = 'hsr-jades:catalog:v1';
const LAST_SYNC_KEY = 'hsr-jades:catalog-last-sync';

/** Tiempo de espera entre sincronizaciones (también si la anterior falló). */
export const SYNC_COOLDOWN_MS = 60_000;

const read = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Navegación privada o almacenamiento lleno: el catálogo dura hasta recargar.
  }
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Descarga el catálogo: la versión del manifest de nanoka (o la última conocida si no responde) y, a la vez,
 * las listas de nanoka y los nombres en español de yatta. Si yatta falla, los nombres se quedan en inglés.
 */
export async function fetchCatalog(): Promise<Catalog> {
  const version = await fetchJson(MANIFEST_URL)
    .then(parseManifestVersion)
    .catch(() => FALLBACK_VERSION);
  const spanish = (kind: PullKind) =>
    fetchJson(YATTA_NAMES_URLS[kind])
      .then(parseYattaNames)
      .catch(() => new Map<string, string>());
  const entries = async (kind: PullKind) => {
    const [raw, names] = await Promise.all([fetchJson(catalogUrl(version, kind)), spanish(kind)]);
    return parseCatalogEntries(raw, names);
  };
  const [character, lightCone] = await Promise.all([entries('character'), entries('lightCone')]);
  return { syncedAt: Date.now(), version, character, lightCone };
}

export interface CatalogSync {
  catalog: Catalog | null;
  syncing: boolean;
  error: string | null;
  /** Último intento de sincronizar (ms), para el tiempo de espera. */
  lastAttempt: number;
  sync: () => Promise<void>;
}

export function useCatalog(): CatalogSync {
  const [catalog, setCatalog] = useState<Catalog | null>(() => normalizeCatalog(read(CATALOG_KEY)));
  const [lastAttempt, setLastAttempt] = useState(() => {
    const v = read(LAST_SYNC_KEY);
    // Una hora futura (reloj cambiado) no debe bloquear el botón.
    return typeof v === 'number' && v <= Date.now() ? v : 0;
  });
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lo que decide si se puede empezar otra descarga, en refs y no en estado: así dos llamadas seguidas (el doble
  // montaje de StrictMode, el botón y el temporizador a la vez) ven ya la primera, sin esperar a otro render.
  const inFlight = useRef(false);
  const attempt = useRef(lastAttempt);

  const sync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const now = Date.now();
    attempt.current = now;
    setLastAttempt(now);
    write(LAST_SYNC_KEY, now);
    setSyncing(true);
    setError(null);
    try {
      const next = await fetchCatalog();
      setCatalog(next);
      write(CATALOG_KEY, next);
    } catch {
      setError('No se ha podido descargar el contenido. Se puede volver a intentar en un rato.');
    } finally {
      inFlight.current = false;
      setSyncing(false);
    }
  }, []);

  /*
   * Sincronización automática, una vez por semana: los martes a las 10:00 (hora local). La app no tiene servidor,
   * así que se comprueba al abrirla (si el catálogo es anterior al último martes a las 10, o no hay), a esa hora
   * si está abierta, y al volver a la pestaña (con el equipo suspendido, el temporizador se retrasa). Si hace
   * menos de un minuto de otro intento (p. ej. falló y se ha recargado), se respeta la espera. Un intento que
   * falla no se repite solo: se vuelve a probar al volver a la pestaña, al recargar o con el botón.
   */
  const syncIfDue = useCallback(() => {
    const now = Date.now();
    if (syncDue(catalog, new Date(now)) && now - attempt.current >= SYNC_COOLDOWN_MS) void sync();
  }, [catalog, sync]);

  // Al abrir la app, y al cambiar el catálogo (ya al día, no hace nada).
  useEffect(() => {
    syncIfDue();
  }, [syncIfDue]);

  // Con la app abierta: al llegar el martes a las 10 (se reprograma tras cada sincronización) y al volver a la pestaña.
  useEffect(() => {
    const wait = nextWeeklySync(new Date()).getTime() - Date.now() + 1000;
    const timer = window.setTimeout(syncIfDue, wait);
    const onVisible = () => document.visibilityState === 'visible' && syncIfDue();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncIfDue]);

  // Otra pestaña abierta que sincroniza: se recoge su catálogo y su tiempo de espera.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CATALOG_KEY) setCatalog(normalizeCatalog(read(CATALOG_KEY)));
      if (e.key === LAST_SYNC_KEY) {
        const v = read(LAST_SYNC_KEY);
        if (typeof v === 'number') {
          attempt.current = v;
          setLastAttempt(v);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { catalog, syncing, error, lastAttempt, sync };
}
