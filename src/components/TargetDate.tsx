import { useId, useLayoutEffect, useRef, useState } from 'react';
import { addDays, toDayNum, WEEKDAYS, weekdayOf } from '../engine/dates';
import { byVersion, patchText, phaseText, upcomingKeyDates, type KeyDate } from '../engine/keyDates';
import type { AppState } from '../engine/types';
import type { ChangeState } from '../state/store';
import { DateField } from './DateField';
import { fmtCountdown, fmtDayMonth, fmtMonth } from './format';
import { reducedMotion } from './motion';

interface Props {
  state: AppState;
  today: string;
  onChange: ChangeState;
}

const QUICK_TARGETS = [
  { label: '+1 semana', days: 7 },
  { label: '+3 semanas', days: 21 },
];

/** Versiones a la vista antes de «Ver más»: solo la próxima; las demás, al desplegar. */
const SHOWN_VERSIONS = 1;

/**
 * Lo que tarda la lista en crecer al desplegar y en encogerse al plegar (un 20 % menos: lo que se deja ya no
 * interesa), y su curva: de entrada y salida, porque es un movimiento (lo de debajo se desplaza). La quíntica:
 * arranca y frena muy suave y el tramo central va rápido (se probaron ease-in-out y la cúbica, más blandas).
 */
const REVEAL_MS = 240;
const HIDE_MS = 190;
const MOVE_EASING = 'cubic-bezier(0.83, 0, 0.17, 1)';

/**
 * Hasta dónde llega, desde arriba de la tabla, la fila `count` de versiones (la última que queda a la vista): el
 * alto de la tabla con solo esas filas.
 */
const rowsEnd = (table: HTMLElement, count: number) => {
  const rows = table.querySelectorAll('.key-date-row:not(.key-date-head)');
  return (rows[count - 1]?.getBoundingClientRect().bottom ?? 0) - table.getBoundingClientRect().top;
};

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
  /*
   * Plegada, hasta la próxima versión o, si la fecha objetivo es de una posterior, hasta esa: la marcada no queda
   * escondida, y las de después siguen plegadas. Crece sola, pero no encoge sola: elegir después una fecha de más
   * arriba no quita las filas de debajo (lo de debajo se movería justo tras el clic). Encoge con «Ver menos», hasta
   * la versión de la fecha objetivo.
   */
  const targetIndex = versions.findIndex(
    (v) => v.first?.date === state.targetDate || v.second?.date === state.targetDate,
  );
  const [reached, setReached] = useState(targetIndex + 1);
  if (targetIndex + 1 > reached) setReached(targetIndex + 1);
  const foldedCount = Math.max(SHOWN_VERSIONS, reached);
  const hiddenCount = versions.length - foldedCount;
  // Las que tocan a la vista y las que se ven: al plegar, las que sobran siguen un momento, mientras se tapan.
  const wanted = expanded ? versions.length : foldedCount;
  const [shown, setShown] = useState(wanted);
  const visibleVersions = versions.slice(0, Math.max(shown, wanted));

  /*
   * La lista crece al desplegar (o al poner una fecha objetivo de una versión plegada) y se encoge al plegar, con lo
   * que sobra recortado: las filas se descubren o se tapan a la vez que la tarjeta cambia de alto, y lo de debajo
   * la acompaña. Al plegar, las que se van siguen hasta que acaba, y después se quitan.
   */
  const tableRef = useRef<HTMLDivElement>(null);
  const shownBefore = useRef<number | null>(null);
  useLayoutEffect(() => {
    const before = shownBefore.current;
    const count = visibleVersions.length;
    shownBefore.current = count;
    const table = tableRef.current;
    if (!table || before === null || count <= before || reducedMotion()) return;
    const from = rowsEnd(table, before);
    table.animate([{ height: `${from}px`, overflow: 'clip' }, { height: `${table.offsetHeight}px`, overflow: 'clip' }], {
      duration: REVEAL_MS,
      easing: MOVE_EASING,
    });
  }, [visibleVersions.length]);
  useLayoutEffect(() => {
    if (wanted >= shown) {
      if (wanted > shown) setShown(wanted);
      return;
    }
    const table = tableRef.current;
    if (!table || reducedMotion()) {
      setShown(wanted);
      return;
    }
    const hide = table.animate(
      [
        { height: `${table.offsetHeight}px`, overflow: 'clip' },
        { height: `${rowsEnd(table, wanted)}px`, overflow: 'clip' },
      ],
      { duration: HIDE_MS, easing: MOVE_EASING, fill: 'forwards' },
    );
    hide.onfinish = () => setShown(wanted);
    // Al quitarse las filas (o si se vuelve a desplegar antes), el alto fijo y el recorte se van con ellas.
    return () => hide.cancel();
  }, [wanted, shown]);

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
          <div ref={tableRef} className="key-date-table" id={keyDateListId} role="table" aria-labelledby={keyDatesId}>
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
          {hiddenCount > 0 && (
            <button
              type="button"
              className="btn btn-ghost key-dates-more"
              aria-expanded={expanded}
              aria-controls={keyDateListId}
              onClick={() => {
                if (expanded) setReached(targetIndex + 1);
                setExpanded(!expanded);
              }}
            >
              {expanded ? 'Ver menos' : `Ver ${moreText(hiddenCount)}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
