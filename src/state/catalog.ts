import { useCallback, useEffect, useRef, useState } from 'react';
import {
  catalogUrl,
  FALLBACK_VERSION,
  MANIFEST_URL,
  nextWeeklySync,
  normalizeCatalog,
  parseCatalogEntries,
  parseManifestVersion,
  parseYattaNames,
  syncDue,
  YATTA_NAMES_URLS,
  type Catalog,
} from '../engine/catalog';
import type { PullKind } from '../engine/types';

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
async function fetchCatalog(): Promise<Catalog> {
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

/** Versión de nanoka del catálogo guardado (la usan los detalles de la galería); la conocida si aún no hay. */
export function catalogVersion(): string {
  return normalizeCatalog(read(CATALOG_KEY))?.version ?? FALLBACK_VERSION;
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

  const sync = useCallback(async () => {
    const now = Date.now();
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
      setSyncing(false);
    }
  }, []);

  /*
   * Sincronización automática, una vez por semana: los martes a las 10:00 (hora local). La app no tiene servidor,
   * así que se comprueba al abrirla (si el catálogo es anterior al último martes a las 10, o no hay), a esa hora
   * si está abierta, y al volver a la pestaña (con el equipo suspendido, el temporizador se retrasa). Si hace
   * menos de un minuto de otro intento (p. ej. falló y se ha recargado), se respeta la espera.
   */
  const latest = useRef({ catalog, lastAttempt, syncing });
  latest.current = { catalog, lastAttempt, syncing };
  const syncIfDue = useCallback(() => {
    const { catalog, lastAttempt, syncing } = latest.current;
    const now = Date.now();
    if (!syncing && syncDue(catalog, new Date(now)) && now - lastAttempt >= SYNC_COOLDOWN_MS) {
      void sync();
    }
  }, [sync]);

  // Al abrir la app. La ref evita la doble descarga del doble montaje de StrictMode en desarrollo.
  const autoSynced = useRef(false);
  useEffect(() => {
    if (autoSynced.current) return;
    autoSynced.current = true;
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
  }, [syncIfDue, catalog?.syncedAt]);

  // Otra pestaña abierta que sincroniza: se recoge su catálogo y su tiempo de espera.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CATALOG_KEY) setCatalog(normalizeCatalog(read(CATALOG_KEY)));
      if (e.key === LAST_SYNC_KEY) {
        const v = read(LAST_SYNC_KEY);
        if (typeof v === 'number') setLastAttempt(v);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { catalog, syncing, error, lastAttempt, sync };
}
