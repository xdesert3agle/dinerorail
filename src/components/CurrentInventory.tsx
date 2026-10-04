import { useId } from 'react';
import { addDays, isValidISO } from '../engine/dates';
import { JADES_PER_PULL } from '../engine/defaults';
import { clampPity, STARLIGHT_PER_PASS } from '../engine/pulls';
import type { AppState, Inventory, PullKind } from '../engine/types';
import { fmtSinglesShort } from './format';
import { Icon } from './Icon';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  today: string;
  onChange: (update: (s: AppState) => AppState) => void;
}

const PITY_FIELDS: { kind: PullKind; label: string; guaranteedLabel: string }[] = [
  { kind: 'character', label: 'Pity de personaje', guaranteedLabel: 'Siguiente personaje garantizado' },
  { kind: 'lightCone', label: 'Pity de cono de luz', guaranteedLabel: 'Siguiente cono de luz garantizado' },
];

const QUICK_TARGETS = [
  { label: '+1 semana', days: 7 },
  { label: '+3 semanas', days: 21 },
  { label: '+6 semanas', days: 42 },
  { label: '+3 meses', days: 91 },
];

export function CurrentInventory({ state, today, onChange }: Props) {
  const targetDateId = useId();
  const inv = state.inventory;
  const { hardPity } = state.settings;
  const setInv = (patch: Partial<Inventory>) => onChange((s) => ({ ...s, inventory: { ...s.inventory, ...patch } }));
  const currentSingles =
    (inv.jades + (state.settings.includeShards ? inv.shards : 0)) / JADES_PER_PULL +
    inv.specialPasses +
    inv.starlight / STARLIGHT_PER_PASS;
  const setGuaranteed = (kind: PullKind, value: boolean) =>
    onChange((s) => ({ ...s, guaranteed: { ...s.guaranteed, [kind]: value } }));

  return (
    <section className="card">
      <header className="card-header">
        <h2>Recursos actuales</h2>
        <span className="muted with-icon" title="Singles que tienes ahora">
          <Icon kind="pass" size={18} decorative />
          <span className="sr-only">Singles ahora: </span>
          {fmtSinglesShort(currentSingles)}
        </span>
      </header>

      <div className="grid-4">
        <NumberField
          icon="pass"
          label="Pases Especiales"
          value={inv.specialPasses}
          min={0}
          onChange={(specialPasses) => setInv({ specialPasses })}
        />
        <NumberField icon="jade" label="Jades Estelares" value={inv.jades} min={0} onChange={(jades) => setInv({ jades })} />
        <NumberField icon="shard" label="Esquirlas Oníricas" value={inv.shards} min={0} onChange={(shards) => setInv({ shards })} />
        <NumberField
          icon="starlight"
          label="Cosmiluz Inextinguible"
          info={`${STARLIGHT_PER_PASS} = 1 Pase Especial`}
          value={inv.starlight}
          min={0}
          onChange={(starlight) => setInv({ starlight: Math.max(0, Math.floor(starlight)) })}
        />
      </div>

      <Toggle
        checked={state.settings.includeShards}
        onChange={(includeShards) => onChange((s) => ({ ...s, settings: { ...s.settings, includeShards } }))}
        title="Cada Esquirla Onírica cuenta como 1 Jade"
      >
        Contar Esquirlas como Jades
        <span className="with-icon" style={{ gap: 2 }} aria-hidden="true">
          (<Icon kind="shard" size={16} decorative />→<Icon kind="jade" size={16} decorative />)
        </span>
      </Toggle>

      <div className="grid-2 group-gap">
        {PITY_FIELDS.map(({ kind, label, guaranteedLabel }) => (
          <div key={kind} className="pity-field">
            <NumberField
              label={label}
              value={state.pity[kind]}
              min={0}
              max={hardPity[kind] - 1}
              onChange={(v) =>
                onChange((s) => ({ ...s, pity: { ...s.pity, [kind]: clampPity(kind, v, s.settings.hardPity) } }))
              }
            />
            <Toggle
              checked={state.guaranteed[kind]}
              onChange={(v) => setGuaranteed(kind, v)}
              title="Perdiste el último 50/50: el próximo 5★ será el destacado seguro"
            >
              {guaranteedLabel}
            </Toggle>
          </div>
        ))}
      </div>

      {/* La fecha y los atajos van en la misma fila flexible para que los atajos queden centrados con la casilla. */}
      <div className="field group-gap">
        <label className="field-label" htmlFor={targetDateId}>
          Fecha objetivo
        </label>
        <div className="target-row">
          <input
            id={targetDateId}
            type="date"
            value={state.targetDate}
            min={today}
            onChange={(e) => {
              const v = e.target.value;
              if (isValidISO(v)) onChange((s) => ({ ...s, targetDate: v }));
            }}
          />
          <div className="chips">
            {QUICK_TARGETS.map((q) => (
              <button
                key={q.days}
                type="button"
                className="chip"
                onClick={() => onChange((s) => ({ ...s, targetDate: addDays(today, q.days) }))}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
