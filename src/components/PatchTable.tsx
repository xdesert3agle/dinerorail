import { toSingles } from '../engine/calculate';
import { addDays, isValidISO } from '../engine/dates';
import { defaultEventDate, PATCH_LENGTH_DAYS } from '../engine/defaults';
import { nextVersion } from '../engine/sources';
import type { AppState, Patch, PatchEvent } from '../engine/types';
import { fmtSingles } from './format';
import { NumberField } from './NumberField';
import { PLAIN_TEXT_INPUT } from './inputs';

interface Props {
  state: AppState;
  today: string;
  onChange: (update: (s: AppState) => AppState) => void;
}

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
    <section className="card">
      <header className="card-header">
        <h2>Actualizaciones y eventos</h2>
        <button type="button" className="btn" onClick={addPatch}>
          + Actualización
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
              <input
                type="date"
                value={p.start}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isValidISO(v)) updatePatch(p.id, (x) => ({ ...x, start: v }));
                }}
              />
            </label>
            <div className="patch-total">
              <span>
                <strong>{fmtSingles(eventsSingles(p.events))}</strong> singles en eventos
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Eliminar parche ${p.version}`}
                title="Eliminar parche"
                onClick={() => onChange((s) => ({ ...s, patches: s.patches.filter((x) => x.id !== p.id) }))}
              >
                ✕
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
              return (
                <div key={ev.id} className={`event-row ${status ? 'is-ignored' : ''}`} title={status}>
                  <input
                    type="text"
                    {...PLAIN_TEXT_INPUT}
                    value={ev.name}
                    title={ev.name}
                    placeholder="Nombre del evento"
                    aria-label="Nombre del evento"
                    onChange={(e) => updateEvent(p.id, ev.id, { name: e.target.value })}
                  />
                  <input
                    type="date"
                    value={ev.date}
                    aria-label="Fecha de cobro"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isValidISO(v)) updateEvent(p.id, ev.id, { date: v });
                    }}
                  />
                  <NumberField
                    compact
                    hideLabel
                    className="no-spin"
                    icon="jade"
                    label="Jades"
                    value={ev.jades}
                    min={0}
                    onChange={(jades) => updateEvent(p.id, ev.id, { jades })}
                  />
                  <NumberField
                    compact
                    hideLabel
                    icon="pass"
                    label="Pases Especiales"
                    value={ev.specialPasses}
                    min={0}
                    onChange={(specialPasses) => updateEvent(p.id, ev.id, { specialPasses })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Eliminar evento ${ev.name}`}
                    title="Eliminar evento"
                    onClick={() => updatePatch(p.id, (x) => ({ ...x, events: x.events.filter((e) => e.id !== ev.id) }))}
                  >
                    ✕
                  </button>
                  {status && <span className="event-status">{status}</span>}
                </div>
              );
            })}
            <button type="button" className="btn btn-ghost btn-add" onClick={() => addEvent(p.id)}>
              + Evento
            </button>
          </div>
        </div>
      ))}

      {patches.length === 0 && (
        <p className="warning">Sin parches no se cuentan ni los eventos ni las fuentes "por parche".</p>
      )}
    </section>
  );
}
