import { DEFAULT_HARD_PITY } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { withSettings, type ChangeState } from '../state/store';
import { NumberField } from './NumberField';

interface Props {
  state: AppState;
  onChange: ChangeState;
}

const FIELDS: { kind: PullKind; label: string }[] = [
  { kind: 'character', label: 'Tiradas para un personaje 5★' },
  { kind: 'lightCone', label: 'Tiradas para un cono de luz 5★' },
];

/** Cuántas tiradas se cuentan por cada 5★ en el peor caso del plan de tiradas. */
export function PitySettings({ state, onChange }: Props) {
  const setHardPity = (kind: PullKind, value: number) =>
    onChange((s) => {
      // Vacío o 0: vuelve al valor por defecto.
      const v = Math.floor(value);
      // El pity actual no se recorta aquí: mientras se escribe "80" se pasa por "8" y se perdería.
      // El plan ya lo limita al calcular.
      return withSettings({ hardPity: { ...s.settings.hardPity, [kind]: v >= 1 ? v : DEFAULT_HARD_PITY[kind] } })(s);
    });

  return (
    <section className="card">
      <header className="card-header">
        <h2>Pity</h2>
      </header>
      <div className="grid-2">
        {FIELDS.map(({ kind, label }) => (
          <NumberField
            key={kind}
            label={label}
            value={state.settings.hardPity[kind]}
            min={1}
            onChange={(v) => setHardPity(kind, v)}
          />
        ))}
      </div>
    </section>
  );
}
