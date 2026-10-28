import { useEffect, useState } from 'react';
import { WEEKLY_SYNC } from '../engine/catalog';
import { WEEKDAYS } from '../engine/dates';
import { SYNC_COOLDOWN_MS, type CatalogSync } from '../state/catalog';
import { fmtMoment } from './format';

/** «martes a las 10:00», de WEEKLY_SYNC (getDay: 0 es domingo; WEEKDAYS empieza en lunes). */
const WEEKLY_TEXT = `${WEEKDAYS[(WEEKLY_SYNC.weekday + 6) % 7]} a las ${String(WEEKLY_SYNC.hour).padStart(2, '0')}:00`;

/** Segundos que quedan, como "0:42". */
const fmtWait = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Descarga los personajes y conos 5★ que se sugieren en el plan de tiradas, con un minuto de espera entre clics. */
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
      {/* role="status": al terminar de sincronizar se anuncia la fecha nueva. */}
      <p className="muted" role="status">
        {catalog
          ? `Sincronizado el ${fmtMoment(catalog.syncedAt)}. Se actualiza solo los ${WEEKLY_TEXT}.`
          : 'Descarga los personajes y conos de luz 5★ para sugerirlos en el plan de tiradas.'}
      </p>
      <div className="content-sync-row">
        <button type="button" className="btn" disabled={disabled} aria-busy={syncing} onClick={() => void sync()}>
          Sincronizar contenido
        </button>
        {/*
          Mientras el botón está desactivado: el spinner solo mientras descarga, y la cuenta atrás durante toda
          la espera. El hueco se reserva siempre, para que nada se mueva.
        */}
        <span className={`content-sync-wait${disabled ? '' : ' invisible'}`}>
          <span className={`spinner${syncing ? '' : ' invisible'}`} aria-hidden="true" />
          {syncing && <span className="sr-only">Sincronizando…</span>}
          <span>
            <span className="sr-only">Tiempo hasta poder sincronizar de nuevo: </span>
            {fmtWait(cooling ? remaining : SYNC_COOLDOWN_MS)}
          </span>
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
