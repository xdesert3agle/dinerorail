import { useEffect, useState } from 'react';
import { SYNC_COOLDOWN_MS, type CatalogSync } from '../state/catalog';

const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
// A mano y no con Intl: según el navegador, es-ES sale con punto ("nov.") o sin él ("nov").
const MONTHS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

/** Fecha de la sincronización, como "5 nov. 2026". */
const fmtSyncDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

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
  const disabled = syncing || cooling;

  return (
    <section className="card content-sync">
      <header className="card-header">
        <h2>Contenido</h2>
      </header>
      <p className="muted">
        {catalog
          ? `Sincronizado el ${fmtSyncDate(catalog.syncedAt)} a las ${timeFmt.format(catalog.syncedAt)}.`
          : 'Descarga los personajes y conos de luz 5★ para sugerirlos en la planificación.'}
      </p>
      <div className="content-sync-row">
        <button type="button" className="btn" disabled={disabled} onClick={() => void sync()}>
          Sincronizar contenido
        </button>
        {/* Spinner y cuenta atrás mientras el botón está desactivado; el hueco se reserva siempre. */}
        <span className="content-sync-wait" style={{ visibility: disabled ? 'visible' : 'hidden' }}>
          <span className="spinner" aria-hidden="true" />
          <span title="Tiempo hasta poder sincronizar de nuevo">{fmtWait(cooling ? remaining : SYNC_COOLDOWN_MS)}</span>
        </span>
      </div>
      {error && (
        <p className="content-sync-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
