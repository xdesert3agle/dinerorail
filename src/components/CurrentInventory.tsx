import { useId } from 'react';
import type { Result } from '../engine/calculate';
import { addDays } from '../engine/dates';
import { clampPity } from '../engine/pulls';
import { STARLIGHT_PER_PASS } from '../engine/rules';
import type { AppState, Inventory, PullKind } from '../engine/types';
import { withSettings } from '../state/store';
import { fmtInt, wholeSingles } from './format';
import { Icon } from './Icon';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  result: Result;
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
];

export function CurrentInventory({ state, result, today, onChange }: Props) {
  const targetDateId = useId();
  const inv = state.inventory;
  const { hardPity } = state.settings;
  const setInv = (patch: Partial<Inventory>) => onChange((s) => ({ ...s, inventory: { ...s.inventory, ...patch } }));
  const setGuaranteed = (kind: PullKind, value: boolean) =>
    onChange((s) => ({ ...s, guaranteed: { ...s.guaranteed, [kind]: value } }));

  return (
    <section className="card card-inventory">
      <header className="card-header">
        <h2>Recursos actuales</h2>
        {/* Solo las enteras (no se tira media tirada); sin explicación, como la cifra del Resumen. */}
        <span className="card-total">
          <Icon kind="pass" size={22} decorative />
          <span className="sr-only">Tiradas ahora: </span>
          {fmtInt(wholeSingles(result.currentSingles))}
        </span>
      </header>

      {/* Los campos del inventario y su interruptor de Esquirlas, juntos (como el pity y su garantizado). */}
      <div className="field-group">
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
            info={
              <>
                {/* Con los iconos del juego; en palabras para los lectores de pantalla. */}
                {/* Iconos pegados a su cifra; el «=» con su aire (espacios fijos: en flex se recortan). */}
                <span className="with-icon with-icon-tight" aria-hidden="true">
                  {STARLIGHT_PER_PASS}
                  <Icon kind="starlight" size={18} decorative />
                  {' = 1'}
                  <Icon kind="pass" size={18} decorative />
                </span>
                <span className="sr-only">{`${STARLIGHT_PER_PASS} Cosmiluz = 1 tirada`}</span>
              </>
            }
            value={inv.starlight}
            min={0}
            onChange={(starlight) => setInv({ starlight: Math.max(0, Math.floor(starlight)) })}
          />
        </div>

        <Toggle
          checked={state.settings.includeShards}
          onChange={(includeShards) => onChange(withSettings({ includeShards }))}
          title="Cada Esquirla Onírica cuenta como 1 Jade"
        >
          {/* Cada icono pegado a su palabra; el espacio antes de «como», fijo (en flex se recortaría). */}
          <span className="with-icon with-icon-tight shards-as-jades">
            Contar Esquirlas
            <Icon kind="shard" size={16} decorative />
            {' como Jades'}
            <Icon kind="jade" size={16} decorative />
          </span>
        </Toggle>
      </div>

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
              {/* «Siguiente»: solo el próximo 5★ de ese banner es seguro. El banner lo dice el campo de encima; entero para los lectores de pantalla. */}
              <span aria-hidden="true">Siguiente garantizado</span>
              <span className="sr-only">{guaranteedLabel}</span>
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
          <DateField
            id={targetDateId}
            value={state.targetDate}
            min={today}
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
      </div>
    </section>
  );
}
