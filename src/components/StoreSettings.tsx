import { useId } from 'react';
import type { AppState } from '../engine/types';
import { withSettings, type ChangeState } from '../state/store';
import { YEN_RATE } from './format';
import { Tip } from './Tip';

interface Props {
  state: AppState;
  onChange: ChangeState;
}

const STORES = [
  { yen: false, label: 'España' },
  { yen: true, label: 'Japón' },
];

/**
 * Dónde se compran los paquetes de Esquirlas: se elige una vez, así que vive aquí y no en la tarjeta de
 * paquetes (allí la fila Total solo dice cuál, «España» o «Japón»). Con el selector de los temas: una de dos opciones.
 */
export function StoreSettings({ state, onChange }: Props) {
  const labelId = useId();
  const inYen = state.settings.packsInYen;
  return (
    <section className="card store-settings">
      <header className="card-header">
        <h2>Tienda</h2>
      </header>
      {/* La explicación sale de la etiqueta, como en los campos (tip-term). */}
      <div className="store-field">
        <span id={labelId} className="field-label">
          {/* Encima: debajo tapaba las opciones que explica. */}
          <Tip
            className="tip-term"
            side="above"
            content={`Japón suele salir más barato; los ¥ se pasan a € a ${YEN_RATE}`}
          >
            Precios de los paquetes
          </Tip>
        </span>
        <div className="segmented" role="group" aria-labelledby={labelId}>
          {STORES.map((s) => (
            <button
              key={s.label}
              type="button"
              className="segment"
              aria-pressed={inYen === s.yen}
              onClick={() => onChange(withSettings({ packsInYen: s.yen }))}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
