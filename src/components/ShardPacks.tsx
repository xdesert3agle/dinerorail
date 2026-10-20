import { emptyPurchase, JPY_PER_EUR, packPrice, packShards, packsTotal, SHARD_PACKS } from '../engine/packs';
import { JADES_PER_PULL } from '../engine/rules';
import type { AppState, ShardPackPurchase } from '../engine/types';
import { withSettings } from '../state/store';
import { fmtInt, fmtSinglesShort } from './format';
import { Icon } from './Icon';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  onChange: (update: (s: AppState) => AppState) => void;
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const rate = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

export function ShardPacks({ state, onChange }: Props) {
  const inYen = state.settings.packsInYen;
  const total = packsTotal(state.shardPacks, inYen);

  const update = (id: string, patch: Partial<ShardPackPurchase>) =>
    onChange((s) => ({
      ...s,
      shardPacks: { ...s.shardPacks, [id]: { ...(s.shardPacks[id] ?? emptyPurchase()), ...patch } },
    }));

  return (
    <section className="card">
      <header className="card-header">
        <h2>Paquetes de Esquirlas Oníricas</h2>
        {/* Siempre presente (oculto si no hay nada) para que la cabecera no cambie de alto al aparecer. */}
        <span className={`muted with-icon${total.shards > 0 ? '' : ' invisible'}`}>
          <Icon kind="pass" size={18} decorative />
          {fmtSinglesShort(total.shards / JADES_PER_PULL)} singles · {euros.format(total.euros)}
        </span>
      </header>

      {/* Tabla para los lectores de pantalla (cada cifra con su columna); en pantalla, una rejilla. */}
      <div className="pack-list" role="table" aria-label="Paquetes de Esquirlas Oníricas">
        <div className="pack-row pack-header" role="row">
          {/* Cada título al inicio de su columna (sobre el icono o el borde del campo), como en los eventos. */}
          <span role="columnheader">Pack</span>
          <span role="columnheader">Precio</span>
          <span role="columnheader">Por compra</span>
          <span role="columnheader">Cantidad</span>
          <span role="columnheader">
            <span className="sr-only">Primera compra</span>
          </span>
          <span role="columnheader">Total</span>
        </div>
        {SHARD_PACKS.map((pack) => {
          const purchase = state.shardPacks[pack.id] ?? emptyPurchase();
          // Lo que da una compra suelta, con o sin el x2 de la primera vez.
          const perPack = purchase.firstBonus ? pack.base * 2 : pack.base + pack.bonus;
          const shards = packShards(pack, purchase);
          const price = euros.format(packPrice(pack, inYen));
          return (
            <div key={pack.id} className={`pack-row ${shards > 0 ? '' : 'is-empty'}`} role="row">
              <span className="pack-name" role="cell">
                Esquirlas Oníricas ×{fmtInt(pack.base)}
              </span>
              <span
                role="cell"
                className="num pack-price"
                title={inYen ? `¥${fmtInt(pack.priceJpy)} a ${rate.format(JPY_PER_EUR)} ¥/€` : undefined}
              >
                {price}
              </span>
              {/* Icono a la izquierda y cifra a la derecha: los iconos quedan en columna. */}
              <span className="pack-shards" role="cell">
                <Icon kind="shard" size={18} decorative />
                {fmtInt(perPack)}
              </span>
              <span role="cell">
                <NumberField
                  compact
                  hideLabel
                  label={`Cantidad del paquete de ${price}`}
                  value={purchase.count}
                  min={0}
                  onChange={(count) => update(pack.id, { count: Math.max(0, Math.floor(count)) })}
                />
              </span>
              <span role="cell">
                <label className="check" title="Primera compra: el doble de Esquirlas">
                  <input
                    type="checkbox"
                    checked={purchase.firstBonus}
                    aria-label={`Primera compra (x2) del paquete de ${price}`}
                    onChange={(e) => update(pack.id, { firstBonus: e.target.checked })}
                  />
                  x2
                </label>
              </span>
              {/* Como en Por compra: icono a la izquierda y cifra a la derecha. */}
              <strong className="num pack-total" role="cell">
                <Icon kind="shard" size={18} decorative />
                <span className="pack-total-value">{shards > 0 ? fmtInt(shards) : '—'}</span>
              </strong>
            </div>
          );
        })}
      </div>

      <Toggle
        checked={inYen}
        onChange={(packsInYen) => onChange(withSettings({ packsInYen }))}
        title={`Cambio: ${rate.format(JPY_PER_EUR)} ¥/€`}
      >
        Pagar con precios de Japón (¥)
      </Toggle>
    </section>
  );
}
