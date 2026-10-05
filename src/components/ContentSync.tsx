import { useEffect, useState } from 'react';
import { formatDate, todayISO } from '../engine/dates';
import { SYNC_COOLDOWN_MS, type CatalogSync } from '../state/catalog';

const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

/** Segundos que quedan, como "0:42". */
const fmtWait = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Descarga los personajes y conos 5★ que se sugieren en la planificación, con un minuto de espera entre clics. */
export function ContentSync({ catalog, syncing, error, lastAttempt, sync }: CatalogSync) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, lastAttempt + SYNC_COOLDOWN_MS - now);

  // Cuenta atrás en tiempo real: un tic por segundo mientras dura la espera.
  useEffect(() => {
    setNow(Date.now());
    if (lastAttempt + SYNC_COOLDOWN_MS <= Date.now()) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (lastAttempt + SYNC_COOLDOWN_MS <= t) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lastAttempt]);

  const cooling = remaining > 0;

  return (
    <section className="card content-sync">
      <header className="card-header">
        <h2>Contenido</h2>
      </header>
      <p className="muted">
        {catalog ? (
          <>
            {catalog.character.length} personajes y {catalog.lightCone.length} conos de luz 5★.
            <br />
            Sincronizado el {formatDate(todayISO(new Date(catalog.syncedAt)))} a las {timeFmt.format(catalog.syncedAt)}.
          </>
        ) : (
          'Descarga los personajes y conos de luz 5★ para sugerirlos en la planificación.'
        )}
      </p>
      <button type="button" className="btn" disabled={syncing || cooling} onClick={() => void sync()}>
        {syncing ? 'Sincronizando…' : 'Sincronizar contenido'}
      </button>
      {/* La línea de espera se reserva siempre para que la tarjeta no cambie de alto. */}
      <p className="field-hint content-sync-wait" style={{ visibility: cooling && !syncing ? 'visible' : 'hidden' }}>
        Disponible de nuevo en {fmtWait(cooling ? remaining : SYNC_COOLDOWN_MS)}
      </p>
      {error && (
        <p className="content-sync-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
