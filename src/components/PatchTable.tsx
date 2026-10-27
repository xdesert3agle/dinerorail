import { toSingles } from '../engine/calculate';
import { addDays } from '../engine/dates';
import { defaultEventDate, PATCH_LENGTH_DAYS } from '../engine/defaults';
import { nextVersion } from '../engine/sources';
import type { AppState, Patch, PatchEvent } from '../engine/types';
import { newId } from '../engine/util';
import type { ChangeState } from '../state/store';
import { fmtSingles } from './format';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { PLAIN_TEXT_INPUT } from './inputs';
import { RemoveGlyph } from './RemoveGlyph';

interface Props {
  state: AppState;
  today: string;
  onChange: ChangeState;
}

const eventsSingles = (events: PatchEvent[]) =>
  events.reduce((sum, e) => sum + toSingles({ jades: e.jades, specialPasses: e.specialPasses }), 0);

export function PatchTable({ state, today, onChange }: Props) {
  const patches = [...state.patches].sort((a, b) => a.start.localeCompare(b.start));

  const updatePatch = (id: string, update: (p: Patch) => Patch) =>
    onChange((s) => ({ ...s, patches: s.patches.map((p) => (p.id === id ? update(p) : p)) }));

  const updateEvent = (patchId: string, eventId: string, patch: Partial<PatchEvent>) =>
    updatePatch(patchId, (p) => ({ ...p, events: p.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }));

  const addEvent = (patchId: string) =>
    updatePatch(patchId, (p) => ({
      ...p,
      events: [
        ...p.events,
        { id: newId('event'), name: '', date: defaultEventDate(p.start, today), jades: 0, specialPasses: 0 },
      ],
    }));

  const addPatch = () => {
    const last = patches.at(-1);
    const start = last ? addDays(last.start, PATCH_LENGTH_DAYS) : today;
    const version = last ? nextVersion(last.version) : '?';
    onChange((s) => ({ ...s, patches: [...s.patches, { id: newId('patch'), version, start, events: [] }] }));
  };

  return (
    <section className="card card-events">
      <header className="card-header">
        <h2>Versiones y eventos</h2>
        <button type="button" className="btn" onClick={addPatch}>
          + Versión
        </button>
      </header>

      {patches.map((p) => (
        <div key={p.id} className="patch-block">
          <div className="patch-head">
            <label className="field field-compact">
              <span className="field-label">Versión</span>
              <input
                type="text"
                {...PLAIN_TEXT_INPUT}
                className="input-version"
                value={p.version}
                onChange={(e) => updatePatch(p.id, (x) => ({ ...x, version: e.target.value }))}
              />
            </label>
            <label className="field field-compact">
              <span className="field-label">Inicio</span>
              <DateField value={p.start} onChange={(v) => updatePatch(p.id, (x) => ({ ...x, start: v }))} />
            </label>
            <div className="patch-total">
              <span>
                <strong>{fmtSingles(eventsSingles(p.events))}</strong> tiradas en eventos
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-remove"
                aria-label={`Eliminar la versión ${p.version}`}
                title="Eliminar versión"
                onClick={() =>
                  onChange(
                    (s) => ({ ...s, patches: s.patches.filter((x) => x.id !== p.id) }),
                    `Versión ${p.version} eliminada.`,
                  )
                }
              >
                <RemoveGlyph />
              </button>
            </div>
          </div>

          <div className="event-list">
            {p.events.length > 0 && (
              <div className="event-row event-header" aria-hidden="true">
                <span>Evento</span>
                <span>Fecha de cobro</span>
                <span>Jades</span>
                <span>Pases</span>
                <span />
              </div>
            )}
            {p.events.map((ev) => {
              const past = ev.date <= today;
              const late = ev.date > state.targetDate;
              const status = past ? 'Fecha pasada: no se cuenta' : late ? 'Después de la fecha objetivo: no se cuenta' : undefined;
              // Etiquetas con el evento y la versión: la cabecera de columnas no llega a los lectores de pantalla.
              const evName = ev.name || 'evento sin nombre';
              return (
                <div key={ev.id} className={`event-row ${status ? 'is-ignored' : ''}`} title={status}>
                  <input
                    type="text"
                    {...PLAIN_TEXT_INPUT}
                    value={ev.name}
                    title={ev.name}
                    placeholder="Nombre del evento…"
                    aria-label={`Nombre del evento (versión ${p.version})`}
                    onChange={(e) => updateEvent(p.id, ev.id, { name: e.target.value })}
                  />
                  <DateField
                    value={ev.date}
                    aria-label={`Fecha de cobro de ${evName}`}
                    onChange={(v) => updateEvent(p.id, ev.id, { date: v })}
                  />
                  <NumberField
                    compact
                    hideLabel
                    className="no-spin"
                    icon="jade"
                    label={`Jades de ${evName}`}
                    value={ev.jades}
                    min={0}
                    max={9999}
                    onChange={(jades) => updateEvent(p.id, ev.id, { jades })}
                  />
                  <NumberField
                    compact
                    hideLabel
                    icon="pass"
                    label={`Pases Especiales de ${evName}`}
                    value={ev.specialPasses}
                    min={0}
                    max={99}
                    onChange={(specialPasses) => updateEvent(p.id, ev.id, { specialPasses })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-remove"
                    aria-label={`Eliminar ${evName}`}
                    title="Eliminar evento"
                    onClick={() =>
                      onChange(
                        (s) => ({
                          ...s,
                          patches: s.patches.map((x) =>
                            x.id === p.id ? { ...x, events: x.events.filter((e) => e.id !== ev.id) } : x,
                          ),
                        }),
                        ev.name ? `Evento «${ev.name}» eliminado.` : 'Evento eliminado.',
                      )
                    }
                  >
                    <RemoveGlyph />
                  </button>
                  {status && <span className="event-status">{status}</span>}
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn-ghost btn-add"
              aria-label={`Añadir evento a la versión ${p.version}`}
              onClick={() => addEvent(p.id)}
            >
              + Evento
            </button>
          </div>
        </div>
      ))}

      {patches.length === 0 && (
        <p className="warning">Sin versiones no se cuentan ni los eventos ni las fuentes «por versión».</p>
      )}
    </section>
  );
}
