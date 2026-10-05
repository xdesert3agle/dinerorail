import { useCallback, useEffect, useRef, useState } from 'react';
import { CATALOG_URLS, normalizeCatalog, parseCatalogEntries, type Catalog } from '../engine/catalog';

// Va aparte del estado de la app: es una caché de datos del juego, no se exporta ni se importa.
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

async function fetchEntries(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseCatalogEntries(await res.json());
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
      const [character, lightCone] = await Promise.all([
        fetchEntries(CATALOG_URLS.character),
        fetchEntries(CATALOG_URLS.lightCone),
      ]);
      const next: Catalog = { syncedAt: Date.now(), character, lightCone };
      setCatalog(next);
      write(CATALOG_KEY, next);
    } catch {
      setError('No se ha podido descargar el contenido. Inténtalo de nuevo en un rato.');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Primera visita (o caché borrada): se descarga de fondo al abrir, sin esperar al botón. Si hace menos
  // de un minuto de otro intento (p. ej. falló y se ha recargado), se respeta la espera.
  // La ref evita la doble descarga del doble montaje de StrictMode en desarrollo.
  const autoSynced = useRef(false);
  useEffect(() => {
    if (autoSynced.current) return;
    autoSynced.current = true;
    if (!catalog && Date.now() - lastAttempt >= SYNC_COOLDOWN_MS) void sync();
    // Solo al abrir la app: con el catálogo y el último intento con los que arranca.
  }, []);

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
