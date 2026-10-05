import { useMemo, useState } from 'react';
import type { SourceTotal } from '../engine/calculate';
import { formatDate, fromDayNum, toDayNum, WEEKDAYS } from '../engine/dates';
import { occurrences } from '../engine/sources';
import type { AppState, Reward, Schedule, Source, SourceCategory } from '../engine/types';
import { describeSchedule, fmtInt, fmtSingles, pendingLabel } from './format';
import { Icon } from './Icon';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { PLAIN_TEXT_INPUT } from './inputs';

interface Props {
  state: AppState;
  today: string;
  totals: Map<string, SourceTotal>;
  onChange: (update: (s: AppState) => AppState) => void;
}

const GROUPS: { category: SourceCategory; title: string }[] = [
  { category: 'diario', title: 'Diarias' },
  { category: 'semanal', title: 'Semanales' },
  { category: 'endgame', title: 'Endgame' },
  { category: 'parche', title: 'Por parche' },
  { category: 'mensual', title: 'Mensuales' },
  { category: 'otro', title: 'Otras' },
];

const SCHEDULE_TYPES: { type: Schedule['type']; label: string }[] = [
  { type: 'daily', label: 'Cada día' },
  { type: 'weekly', label: 'Cada semana' },
  { type: 'monthly', label: 'Cada mes' },
  { type: 'cycle', label: 'Cada N días' },
  { type: 'perPatch', label: 'Por parche' },
];

function defaultSchedule(type: Schedule['type'], today: string): Schedule {
  switch (type) {
    case 'daily':
      return { type };
    case 'weekly':
      return { type, weekday: 0 };
    case 'monthly':
      return { type, day: 1 };
    case 'cycle':
      return { type, anchor: today, periodDays: 42 };
    case 'perPatch':
      return { type, offsetDays: 0 };
  }
}

function RewardInline({ reward }: { reward: Reward }) {
  if (!reward.jades && !reward.specialPasses) return <>Sin recompensa</>;
  return (
    <span className="reward">
      {reward.jades > 0 && (
        <span className="with-icon">
          <Icon kind="jade" size={16} />+{fmtInt(reward.jades)}
        </span>
      )}
      {reward.specialPasses > 0 && (
        <span className="with-icon">
          <Icon kind="pass" size={16} />+{fmtInt(reward.specialPasses)}
        </span>
      )}
    </span>
  );
}

export function SourcesPanel({ state, today, totals, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Próximo cobro de cada fuente (en el próximo año), para mostrarlo en la lista.
  const nextDates = useMemo(() => {
    const from = toDayNum(today) + 1;
    const to = from + 400;
    const starts = state.patches.map((p) => toDayNum(p.start));
    return new Map(
      state.sources.map((s) => {
        const [next] = occurrences(s.schedule, from, to, starts);
        return [s.id, next === undefined ? null : fromDayNum(next)];
      }),
    );
  }, [state.sources, state.patches, today]);

  const updateSource = (id: string, patch: Partial<Source>) =>
    onChange((s) => ({ ...s, sources: s.sources.map((src) => (src.id === id ? { ...src, ...patch } : src)) }));

  const addCustom = () => {
    const id = `custom-${Date.now()}`;
    onChange((s) => ({
      ...s,
      sources: [
        ...s.sources,
        {
          id,
          name: 'Nueva fuente',
          category: 'otro',
          enabled: true,
          schedule: { type: 'daily' },
          reward: { jades: 0, specialPasses: 0 },
          pendingNow: false,
          custom: true,
        },
      ],
    }));
    setOpenId(id);
  };

  return (
    <section className="card">
      <header className="card-header">
        <h2>Fuentes de ingresos</h2>
        <button type="button" className="btn" onClick={addCustom}>
          + Fuente personalizada
        </button>
      </header>

      {GROUPS.map(({ category, title }) => {
        const sources = state.sources.filter((s) => s.category === category);
        if (!sources.length) return null;
        return (
          <div key={category} className="source-group">
            <h3>{title}</h3>
            {sources.map((src) => {
              const total = totals.get(src.id);
              const open = openId === src.id;
              const next = nextDates.get(src.id);
              return (
                <div key={src.id} className={`source ${src.enabled ? '' : 'is-off'}`}>
                  <div className="source-row">
                    <label className="switch" title={src.enabled ? 'Desactivar' : 'Activar'}>
                      <input
                        type="checkbox"
                        checked={src.enabled}
                        onChange={(e) => updateSource(src.id, { enabled: e.target.checked })}
                        aria-label={`Activar ${src.name}`}
                      />
                      <span aria-hidden="true" />
                    </label>
                    <div className="source-main">
                      <div className="source-name">{src.name}</div>
                      <div className="source-meta">
                        <RewardInline reward={src.reward} /> · {describeSchedule(src.schedule)}
                        {next && <> · próximo {formatDate(next)}</>}
                        {src.pendingNow && src.schedule.type !== 'perPatch' && <> · pendiente hoy</>}
                      </div>
                    </div>
                    <div className="source-contrib">
                      {src.enabled && total ? (
                        <>
                          <strong>{fmtSingles(total.singles)}</strong> singles
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : src.id)}
                    >
                      {open ? 'Cerrar' : 'Editar'}
                    </button>
                  </div>

                  {open && <SourceEditor source={src} today={today} onUpdate={(p) => updateSource(src.id, p)} onDelete={() => onChange((s) => ({ ...s, sources: s.sources.filter((x) => x.id !== src.id) }))} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}

interface EditorProps {
  source: Source;
  today: string;
  onUpdate: (patch: Partial<Source>) => void;
  onDelete: () => void;
}

function SourceEditor({ source, today, onUpdate, onDelete }: EditorProps) {
  const { schedule, reward } = source;
  const setReward = (patch: Partial<Reward>) => onUpdate({ reward: { ...reward, ...patch } });
  const pending = pendingLabel(schedule);

  return (
    <div className="source-edit">
      {source.description && <p className="muted">{source.description}</p>}

      {source.custom && (
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Nombre</span>
            <input type="text" {...PLAIN_TEXT_INPUT} value={source.name} onChange={(e) => onUpdate({ name: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Frecuencia</span>
            <select
              value={schedule.type}
              onChange={(e) => onUpdate({ schedule: defaultSchedule(e.target.value as Schedule['type'], today) })}
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="grid-3">
        <NumberField compact icon="jade" label="Jades" value={reward.jades} min={0} onChange={(jades) => setReward({ jades })} />
        <NumberField
          compact
          icon="pass"
          label="Pases Especiales"
          value={reward.specialPasses}
          min={0}
          onChange={(specialPasses) => setReward({ specialPasses })}
        />

        {schedule.type === 'weekly' && (
          <label className="field field-compact">
            <span className="field-label">Día</span>
            <select
              value={schedule.weekday}
              onChange={(e) => onUpdate({ schedule: { ...schedule, weekday: Number(e.target.value) } })}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        {schedule.type === 'monthly' && (
          <NumberField
            compact
            label="Día del mes"
            value={schedule.day}
            min={1}
            max={31}
            onChange={(day) => onUpdate({ schedule: { ...schedule, day: Math.min(31, Math.max(1, day)) } })}
          />
        )}
        {schedule.type === 'perPatch' && (
          <NumberField
            compact
            label="Días desde el inicio"
            hint="Negativo = antes"
            value={schedule.offsetDays}
            onChange={(offsetDays) => onUpdate({ schedule: { ...schedule, offsetDays } })}
          />
        )}
      </div>

      {schedule.type === 'cycle' && (
        <div className="grid-2">
          <label className="field field-compact">
            <span className="field-label">Fecha de un reinicio (referencia)</span>
            <DateField value={schedule.anchor} onChange={(anchor) => onUpdate({ schedule: { ...schedule, anchor } })} />
          </label>
          <NumberField
            compact
            label="Cada cuántos días"
            value={schedule.periodDays}
            min={1}
            onChange={(periodDays) => onUpdate({ schedule: { ...schedule, periodDays: Math.max(1, periodDays) } })}
          />
        </div>
      )}

      <div className="source-edit-footer">
        {pending ? (
          <label className="check">
            <input type="checkbox" checked={source.pendingNow} onChange={(e) => onUpdate({ pendingNow: e.target.checked })} />
            {pending} (se suma hoy)
          </label>
        ) : (
          <span />
        )}
        {source.custom && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Eliminar fuente
          </button>
        )}
      </div>
    </div>
  );
}
