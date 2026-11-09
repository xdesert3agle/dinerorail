import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useId, useState } from 'react';
import { countedEventSingles, eventsSingles, eventTiming, type EventTiming } from '../engine/calculate';
import { addDays, formatDate } from '../engine/dates';
import { defaultEventDate } from '../engine/defaults';
import { PATCH_LENGTH_DAYS } from '../engine/rules';
import { nextVersion } from '../engine/sources';
import type { AppState, Patch, PatchEvent } from '../engine/types';
import { newId } from '../engine/util';
import { namedNotice, type ChangeState } from '../state/store';
import { DateField } from './DateField';
import { floorSingles, fmtInt, fmtSingles } from './format';
import { Icon } from './Icon';
import { PLAIN_TEXT_INPUT } from './inputs';
import { NumberField } from './NumberField';
import { RemoveGlyph } from './RemoveGlyph';
import { RewardInline } from './RewardInline';
import { DragHandle, DustFilter, moveById, SortableList, useDustRemoval, useSortableRow } from './SortableRows';
import { useFocusNew } from './useFocusNew';

interface Props {
  state: AppState;
  today: string;
  onChange: ChangeState;
}

/** Por qué un evento no cuenta (eventTiming); los que cuentan no llevan aviso. */
const EVENT_STATUS: Record<EventTiming, string | undefined> = {
  counts: undefined,
  past: 'Fecha pasada: no se cuenta',
  today: 'Hoy: se da por cobrado, no se cuenta',
  late: 'Después de la fecha objetivo: no se cuenta',
};

/** Las filas de cada versión se arrastran en vertical y sin salir de su lista (.event-rows). */
const EVENT_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

/** Nombre de un evento en avisos y etiquetas. */
const eventName = (ev: PatchEvent) => ev.name || 'evento sin nombre';

/**
 * Versiones y eventos, como las fuentes de ingresos: cada versión se lee como una tabla (evento, cobro y
 * recompensas) y «Editar» abre en el sitio sus campos y las filas editables de sus eventos.
 */
export function PatchTable({ state, today, onChange }: Props) {
  const patches = [...state.patches].sort((a, b) => a.start.localeCompare(b.start));
  // La versión con el editor abierto (una a la vez, como las fuentes).
  const [openId, setOpenId] = useState<string | null>(null);

  const updatePatch = (id: string, update: (p: Patch) => Patch) =>
    onChange((s) => ({ ...s, patches: s.patches.map((p) => (p.id === id ? update(p) : p)) }));

  const updateEvent = (patchId: string, eventId: string, patch: Partial<PatchEvent>) =>
    updatePatch(patchId, (p) => ({ ...p, events: p.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }));

  // El evento recién añadido enfoca su nombre para poder escribirlo directamente (una sola vez, ver useFocusNew).
  const [focusId, setFocusId] = useFocusNew(state.patches.flatMap((p) => p.events.map((e) => e.id)));
  const addEvent = (patchId: string) => {
    const id = newId('event');
    setFocusId(id);
    updatePatch(patchId, (p) => ({
      ...p,
      events: [...p.events, { id, name: '', date: defaultEventDate(p.start, today), jades: 0, specialPasses: 0 }],
    }));
  };

  // Al quitar un evento, se deshace en polvo y luego sale de su versión, como las filas del plan.
  const { leaving, removeLater } = useDustRemoval();
  const removeEvent = (patchId: string, ev: PatchEvent) =>
    removeLater(ev.id, () =>
      onChange(
        (s) => ({
          ...s,
          patches: s.patches.map((x) =>
            x.id === patchId ? { ...x, events: x.events.filter((e) => e.id !== ev.id) } : x,
          ),
        }),
        ev.name ? namedNotice('Evento ', ev.name, ' eliminado.') : 'Evento eliminado.',
      ),
    );

  // La versión recién añadida enfoca su número, que es lo primero que hay que corregir (sale «?» o la siguiente).
  const [focusPatchId, setFocusPatchId] = useFocusNew(state.patches.map((p) => p.id));
  const addPatch = () => {
    const last = patches.at(-1);
    const start = last ? addDays(last.start, PATCH_LENGTH_DAYS) : today;
    const version = last ? nextVersion(last.version) : '?';
    const id = newId('patch');
    setFocusPatchId(id);
    setOpenId(id);
    onChange((s) => ({ ...s, patches: [...s.patches, { id, version, start, events: [] }] }));
  };

  // Lo que aportan: las tiradas de los eventos que cuentan en todas las versiones. En la cabecera, solo las
  // enteras, como Recursos actuales y Paquetes (los Jades que sobran se suman al resto en el Resumen).
  const totalSingles = patches.reduce((sum, p) => sum + countedEventSingles(p.events, today, state.targetDate), 0);

  return (
    <section className="card card-events">
      <header className="card-header">
        <h2>Versiones y eventos</h2>
        <div className="header-actions">
          <span className="card-total">
            <Icon kind="pass" size={28} decorative />
            <span className="sr-only">Tiradas de los eventos: </span>
            {fmtInt(floorSingles(totalSingles))}
          </span>
          <button type="button" className="btn" onClick={addPatch}>
            + Versión
          </button>
        </div>
      </header>

      {patches.map((p) => {
        const open = openId === p.id;
        return (
          <div key={p.id} className="patch-block">
            {/* Título de grupo, como los de las fuentes («Diarias»), con el inicio al lado y su «Editar». */}
            <div className="patch-head">
              <h3>
                Versión {p.version} · {formatDate(p.start)}
              </h3>
              <button
                type="button"
                className="btn btn-ghost"
                aria-expanded={open}
                aria-label={`${open ? 'Cerrar' : 'Editar'} la versión ${p.version}`}
                onClick={() => setOpenId(open ? null : p.id)}
              >
                {open ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            {open ? (
              <div className="inline-edit">
                <div className="patch-fields">
                  <label className="field field-compact">
                    <span className="field-label">Versión</span>
                    <input
                      type="text"
                      {...PLAIN_TEXT_INPUT}
                      className="input-version"
                      value={p.version}
                      autoFocus={p.id === focusPatchId}
                      onChange={(e) => updatePatch(p.id, (x) => ({ ...x, version: e.target.value }))}
                    />
                  </label>
                  <label className="field field-compact">
                    <span className="field-label">Inicio</span>
                    <DateField value={p.start} onChange={(v) => updatePatch(p.id, (x) => ({ ...x, start: v }))} />
                  </label>
                </div>

                <div className="event-list">
                  {p.events.length > 0 && (
                    <>
                      <div className="event-row event-header" aria-hidden="true">
                        <span />
                        <span>Evento</span>
                        <span>Fecha de cobro</span>
                        <span>Jades</span>
                        <span>Pases</span>
                        <span />
                      </div>
                      {/* Las filas en su propia caja: es el límite del arrastre (restrictToParentElement). */}
                      <SortableList
                        items={p.events.map((ev) => ({ id: ev.id, name: eventName(ev) }))}
                        modifiers={EVENT_MODIFIERS}
                        onMove={(activeId, overId) =>
                          updatePatch(p.id, (x) => ({ ...x, events: moveById(x.events, activeId, overId) }))
                        }
                      >
                        <div className="event-rows">
                          {p.events.map((ev) => (
                            <EventRow
                              key={ev.id}
                              event={ev}
                              version={p.version}
                              status={EVENT_STATUS[eventTiming(ev.date, today, state.targetDate)]}
                              autoFocus={ev.id === focusId}
                              leaving={leaving.includes(ev.id)}
                              onUpdate={(patch) => updateEvent(p.id, ev.id, patch)}
                              onRemove={() => removeEvent(p.id, ev)}
                            />
                          ))}
                        </div>
                      </SortableList>
                    </>
                  )}
                  {/* Del ancho de una fila, donde aparecerá la nueva: dice qué hace antes de pulsarlo. */}
                  <button
                    type="button"
                    className="btn btn-add-event"
                    aria-label={`Añadir evento a la versión ${p.version}`}
                    onClick={() => addEvent(p.id)}
                  >
                    + Evento
                  </button>
                </div>

                {/* Al pie del editor, como «Eliminar fuente». */}
                <div className="inline-edit-footer">
                  <span />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      onChange(
                        (s) => ({ ...s, patches: s.patches.filter((x) => x.id !== p.id) }),
                        `Versión ${p.version} eliminada.`,
                      )
                    }
                  >
                    Eliminar versión
                  </button>
                </div>
              </div>
            ) : (
              <PatchSummary events={p.events} today={today} targetDate={state.targetDate} />
            )}

            {/*
              Lo que da la versión: las tiradas de todos sus eventos, también los que aún no llegan a la fecha
              objetivo o ya pasaron (cada uno lo avisa en su fila). Lo que cuenta para el cálculo es el total de la
              cabecera. Al pie y bajo las recompensas, con su ticket; con decimales, para que se vea lo que aporta
              cada evento. También con el editor abierto: cambia al escribir.
            */}
            <div className="patch-foot">
              <span className="card-total patch-total">
                <Icon kind="pass" size={25} decorative />
                <span className="sr-only">Tiradas de los eventos de la versión {p.version}: </span>
                {fmtSingles(eventsSingles(p.events))}
              </span>
            </div>
          </div>
        );
      })}

      {patches.length === 0 && (
        <p className="warning">Sin versiones no se cuentan ni los eventos ni las fuentes «por versión».</p>
      )}
    </section>
  );
}

/** Los eventos de una versión, para leer: nombre (y por qué no cuenta), fecha de cobro y recompensas. */
function PatchSummary({ events, today, targetDate }: { events: PatchEvent[]; today: string; targetDate: string }) {
  if (events.length === 0) return <p className="muted">Sin eventos.</p>;
  return (
    <table className="patch-table">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Cobro</th>
          <th className="num">Recompensas</th>
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => {
          const status = EVENT_STATUS[eventTiming(ev.date, today, targetDate)];
          return (
            <tr key={ev.id} className={status ? 'is-ignored' : undefined}>
              <td>
                {ev.name || <span className="muted">Sin nombre</span>}
                {status && <span className="event-status">{status}</span>}
              </td>
              <td>{formatDate(ev.date)}</td>
              <td className="num patch-reward">
                <RewardInline reward={{ jades: ev.jades, specialPasses: ev.specialPasses }} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface EventRowProps {
  event: PatchEvent;
  version: string;
  /** Por qué no cuenta, o undefined si cuenta. */
  status: string | undefined;
  autoFocus: boolean;
  /** Se está quitando: se deshace en polvo antes de salir de la versión. */
  leaving: boolean;
  onUpdate: (patch: Partial<PatchEvent>) => void;
  onRemove: () => void;
}

/** Una fila de evento: asa · nombre · fecha de cobro · Jades · Pases · quitar, y debajo si no cuenta. */
function EventRow({ event: ev, version, status, autoFocus, leaving, onUpdate, onRemove }: EventRowProps) {
  const sortable = useSortableRow(ev.id, leaving);
  // Etiquetas con el evento y la versión: la cabecera de columnas no llega a los lectores de pantalla.
  const evName = eventName(ev);
  // El aviso «no se cuenta», enlazado al nombre y a la fecha (la causa): si no, el lector lo oía tras «Eliminar».
  const statusId = useId();
  const describedBy = status ? statusId : undefined;
  return (
    <div
      ref={sortable.setNodeRef}
      className={`event-row ${sortable.className}${status ? ' is-ignored' : ''}`}
      style={sortable.style}
    >
      <DustFilter id={ev.id} leaving={leaving} />
      <DragHandle handle={sortable.handle} label={evName} />
      <input
        type="text"
        {...PLAIN_TEXT_INPUT}
        value={ev.name}
        title={ev.name}
        placeholder="Nombre del evento…"
        aria-label={`Nombre del evento (versión ${version})`}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />
      <DateField
        value={ev.date}
        aria-label={`Fecha de cobro de ${evName}`}
        aria-describedby={describedBy}
        onChange={(date) => onUpdate({ date })}
      />
      <NumberField
        compact
        hideLabel
        noStepper
        className="event-jades"
        icon="jade"
        label={`Jades de ${evName}`}
        value={ev.jades}
        min={0}
        max={9999}
        onChange={(jades) => onUpdate({ jades })}
      />
      <NumberField
        compact
        hideLabel
        className="event-passes"
        icon="pass"
        label={`Pases Especiales de ${evName}`}
        value={ev.specialPasses}
        min={0}
        max={99}
        onChange={(specialPasses) => onUpdate({ specialPasses })}
      />
      <button type="button" className="btn btn-ghost btn-remove" aria-label={`Eliminar ${evName}`} onClick={onRemove}>
        <RemoveGlyph />
      </button>
      {status && (
        <span id={statusId} className="event-status">
          {status}
        </span>
      )}
    </div>
  );
}
