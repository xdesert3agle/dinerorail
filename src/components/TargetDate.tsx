import { useId } from 'react';
import { addDays, toDayNum, WEEKDAYS, weekdayOf } from '../engine/dates';
import { patchText, upcomingKeyDates } from '../engine/keyDates';
import type { AppState } from '../engine/types';
import { DateField } from './DateField';
import { fmtDayMonth, fmtInt, fmtMonth } from './format';

interface Props {
  state: AppState;
  today: string;
  onChange: (update: (s: AppState) => AppState) => void;
}

const QUICK_TARGETS = [
  { label: '+1 semana', days: 7 },
  { label: '+3 semanas', days: 21 },
];

/** "hoy", "mañana" o "en 19 días". */
function countdown(iso: string, today: string): string {
  const days = toDayNum(iso) - toDayNum(today);
  return days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${fmtInt(days)} días`;
}

export function TargetDate({ state, today, onChange }: Props) {
  const targetDateId = useId();
  const keyDatesId = useId();
  const keyDates = upcomingKeyDates(today);

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
          marks={keyDates.map((d) => ({ date: d.date, label: [d.label, patchText(d)].filter(Boolean).join(' · ') }))}
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
        Atajos a días señalados, cada uno como una hoja de calendario (mes y día) con su nombre, el día de la
        semana y cuánto falta. Pulsar una pone esa fecha objetivo; la de la fecha puesta queda marcada.
      */}
      {keyDates.length > 0 && (
        <div className="key-dates" role="group" aria-labelledby={keyDatesId}>
          <span className="field-label" id={keyDatesId}>
            Fechas destacadas
          </span>
          <div className="key-date-list">
            {keyDates.map((d) => {
              const weekday = WEEKDAYS[weekdayOf(toDayNum(d.date))];
              const when = countdown(d.date, today);
              const patch = patchText(d);
              return (
                <button
                  key={d.date + d.label}
                  type="button"
                  className="btn key-date"
                  aria-pressed={state.targetDate === d.date}
                  // La hoja no se lee: el nombre del botón dice la fecha entera.
                  aria-label={`${d.label}${patch ? `, ${patch}` : ''}: ${weekday} ${fmtDayMonth(d.date)}, ${when}`}
                  onClick={() => onChange((s) => ({ ...s, targetDate: d.date }))}
                >
                  <span className="key-date-leaf" aria-hidden="true">
                    <span className="key-date-month">{fmtMonth(d.date)}</span>
                    <span className="key-date-day">{Number(d.date.slice(8))}</span>
                  </span>
                  {/* El nombre con su parche al lado (en gris), y debajo el día de la semana y cuánto falta. */}
                  <span className="key-date-text" aria-hidden="true">
                    <span className="key-date-title">
                      <span className="key-date-name">{d.label}</span>
                      {patch && <span className="key-date-patch">{patch}</span>}
                    </span>
                    <span className="key-date-when">
                      {weekday} ({when})
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
