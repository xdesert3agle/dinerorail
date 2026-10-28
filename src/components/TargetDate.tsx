import { useId, useState } from 'react';
import { addDays, toDayNum, WEEKDAYS, weekdayOf } from '../engine/dates';
import { byVersion, patchText, phaseText, upcomingKeyDates, type KeyDate } from '../engine/keyDates';
import type { AppState } from '../engine/types';
import type { ChangeState } from '../state/store';
import { DateField } from './DateField';
import { fmtCountdown, fmtDayMonth, fmtMonth } from './format';

interface Props {
  state: AppState;
  today: string;
  onChange: ChangeState;
}

const QUICK_TARGETS = [
  { label: '+1 semana', days: 7 },
  { label: '+3 semanas', days: 21 },
];

/** Versiones a la vista antes de «Ver más». */
const SHOWN_VERSIONS = 3;

/** "1 versión más" o "7 versiones más". */
const moreText = (n: number) => `${n} ${n === 1 ? 'versión' : 'versiones'} más`;

/** "hoy", "mañana" o "en 19 días" (como en el Resumen). */
const countdown = (iso: string, today: string) => fmtCountdown(toDayNum(iso) - toDayNum(today));

export function TargetDate({ state, today, onChange }: Props) {
  const targetDateId = useId();
  const keyDatesId = useId();
  const keyDateListId = useId();
  const keyDates = upcomingKeyDates(today);
  const versions = byVersion(keyDates);
  const [expanded, setExpanded] = useState(false);
  // Si la fecha objetivo es de una versión oculta, se ven todas: la marcada no puede quedar escondida.
  const targetHidden =
    versions.findIndex((v) => v.first?.date === state.targetDate || v.second?.date === state.targetDate) >=
    SHOWN_VERSIONS;
  const visibleVersions = expanded || targetHidden ? versions : versions.slice(0, SHOWN_VERSIONS);

  // Una hoja de calendario: pulsarla pone esa fecha objetivo; la de la fecha puesta queda marcada.
  const leaf = (d: KeyDate) => {
    const weekday = WEEKDAYS[weekdayOf(toDayNum(d.date))];
    const when = countdown(d.date, today);
    const patch = patchText(d);
    return (
      <button
        type="button"
        className="btn key-date"
        aria-pressed={state.targetDate === d.date}
        // La hoja no se lee: el nombre del botón dice la fecha entera.
        aria-label={`${d.label}${patch ? `, ${patch}` : ''}: ${weekday} ${fmtDayMonth(d.date)}, ${when}${d.estimated ? ', fecha estimada' : ''}`}
        onClick={() => onChange((s) => ({ ...s, targetDate: d.date }))}
      >
        <span className="key-date-leaf" aria-hidden="true">
          <span className="key-date-month">{fmtMonth(d.date)}</span>
          <span className="key-date-day">{Number(d.date.slice(8))}</span>
        </span>
        <span className="key-date-text" aria-hidden="true">
          <span className="key-date-title">
            <span className="key-date-name">{d.label}</span>
            {/* La parte solo se ve cuando no hay cabecera de columnas (tarjeta estrecha). */}
            {d.phase && <span className="key-date-patch key-date-phase">{phaseText(d)}</span>}
          </span>
          {/* En las estimadas, «estimada» en lugar del día de la semana (que también sería supuesto). */}
          <span className="key-date-when">
            {d.estimated ? 'estimada' : weekday} ({when})
          </span>
        </span>
      </button>
    );
  };

  return (
    <section className="card card-target">
      {/* El título de la tarjeta es la etiqueta del campo. */}
      <header className="card-header">
        <h2>
          <label htmlFor={targetDateId}>Fecha objetivo</label>
        </h2>
      </header>

      {/* La fecha y los atajos van en la misma fila flexible para que los atajos queden centrados con la casilla. */}
      <div className="target-row">
        <DateField
          id={targetDateId}
          value={state.targetDate}
          min={today}
          // Al pasar por el día en el calendario: «Firefly SP · versión 5.0 · 1.ª parte (estimada)», con el mismo
          // formato de versión que las hojas (patchText).
          marks={keyDates.map((d) => ({
            date: d.date,
            label: d.label + (d.patch ? ` · versión ${patchText(d)}` : '') + (d.estimated ? ' (estimada)' : ''),
          }))}
          onChange={(v) => onChange((s) => ({ ...s, targetDate: v }))}
        />
        <div className="chips">
          {QUICK_TARGETS.map((q) => (
            <button
              key={q.days}
              type="button"
              className="chip"
              // Suma a la fecha puesta (pulsarlo otra vez la vuelve a mover); si se quedó en el pasado, desde hoy.
              onClick={() =>
                onChange((s) => ({ ...s, targetDate: addDays(s.targetDate < today ? today : s.targetDate, q.days) }))
              }
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/*
        Atajos a días señalados, una fila por versión: la versión a la izquierda y sus dos partes en columnas
        (1.ª y 2.ª), cada una como una hoja de calendario. Para los lectores de pantalla, una tabla.
      */}
      {versions.length > 0 && (
        <div className="key-dates">
          {/*
            Con columnas, una sola fila de cabecera («Versión · 1.ª parte · 2.ª parte») alineada con las hojas:
            el título encima quedaba descompensado. El título solo se ve en la tarjeta estrecha, sin cabecera.
          */}
          <span className="field-label key-dates-title" id={keyDatesId}>
            Fechas destacadas
          </span>
          <div className="key-date-table" id={keyDateListId} role="table" aria-labelledby={keyDatesId}>
            <div className="key-date-row key-date-head" role="row">
              <span role="columnheader">Versión</span>
              <span role="columnheader">1.ª parte</span>
              <span role="columnheader">2.ª parte</span>
            </div>
            {visibleVersions.map((v) => (
              <div key={v.patch} className="key-date-row" role="row">
                <span className="key-date-version" role="rowheader">
                  {v.patch}
                </span>
                <span className={v.first ? 'key-date-cell' : 'key-date-cell is-empty'} role="cell">
                  {v.first && leaf(v.first)}
                </span>
                <span className={v.second ? 'key-date-cell' : 'key-date-cell is-empty'} role="cell">
                  {v.second ? (
                    leaf(v.second)
                  ) : (
                    // 2.ª parte aún sin anunciar: hueco discontinuo, no seleccionable (habrá cambio de banners,
                    // seguramente reruns). Si la 1.ª ya pasó, la fila es pasado y no lleva hueco.
                    v.first && (
                      <span className="key-date-placeholder">Sin anunciar</span>
                    )
                  )}
                </span>
              </div>
            ))}
          </div>
          {/* Solo las próximas a la vista: con todas, la tarjeta empujaba varias filas abajo a las que van debajo. */}
          {versions.length > SHOWN_VERSIONS && !targetHidden && (
            <button
              type="button"
              className="btn btn-ghost key-dates-more"
              aria-expanded={expanded}
              aria-controls={keyDateListId}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Ver menos' : `Ver ${moreText(versions.length - SHOWN_VERSIONS)}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
