import { JADES_PER_PULL } from '../engine/defaults';
import { emptyPurchase, JPY_PER_EUR, packPrice, packShards, packsTotal, SHARD_PACKS } from '../engine/packs';
import type { AppState, ShardPackPurchase } from '../engine/types';
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
        <span className="muted with-icon" style={total.shards > 0 ? undefined : { visibility: 'hidden' }}>
          <Icon kind="pass" size={18} decorative />
          {fmtSinglesShort(total.shards / JADES_PER_PULL)} singles · {euros.format(total.euros)}
        </span>
      </header>

      <div className="pack-list">
        <div className="pack-row pack-header" aria-hidden="true">
          <span>Pack</span>
          <span className="num">Precio</span>
          <span className="num">Cristales</span>
          <span className="num pack-qty-header">Cantidad</span>
          <span />
          <span className="num">Total</span>
        </div>
        {SHARD_PACKS.map((pack) => {
          const purchase = state.shardPacks[pack.id] ?? emptyPurchase();
          // Lo que da una compra suelta, con o sin el x2 de la primera vez.
          const perPack = purchase.firstBonus ? pack.base * 2 : pack.base + pack.bonus;
          const shards = packShards(pack, purchase);
          return (
            <div key={pack.id} className={`pack-row ${shards > 0 ? '' : 'is-empty'}`}>
              <span className="pack-name">Esquirlas Oníricas ×{fmtInt(pack.base)}</span>
              <span
                className="num pack-price"
                title={inYen ? `¥${fmtInt(pack.priceJpy)} a ${rate.format(JPY_PER_EUR)} ¥/€` : undefined}
              >
                {euros.format(packPrice(pack, inYen))}
              </span>
              {/* Icono a la izquierda y cifra a la derecha: los iconos quedan en columna. */}
              <span className="pack-shards">
                <Icon kind="shard" size={18} decorative />
                {fmtInt(perPack)}
              </span>
              <NumberField
                compact
                hideLabel
                label={`Cantidad del paquete de ${euros.format(pack.price)}`}
                value={purchase.count}
                min={0}
                onChange={(count) => update(pack.id, { count: Math.max(0, Math.floor(count)) })}
              />
              <label className="check" title="Primera compra: el doble de cristales">
                <input
                  type="checkbox"
                  checked={purchase.firstBonus}
                  onChange={(e) => update(pack.id, { firstBonus: e.target.checked })}
                />
                x2
              </label>
              <strong className="num pack-total">{shards > 0 ? fmtInt(shards) : '—'}</strong>
            </div>
          );
        })}
      </div>

      <Toggle
        checked={inYen}
        onChange={(packsInYen) => onChange((s) => ({ ...s, settings: { ...s.settings, packsInYen } }))}
        title={`Cambio: ${rate.format(JPY_PER_EUR)} ¥/€`}
      >
        Pagar con precios de Japón (¥)
      </Toggle>
      <p className="muted small">
        Se cuentan como comprados hoy y se cambian 1:1 por Jades. Con el x2 solo la primera compra da el doble; las
        siguientes dan lo normal más su bonus.
      </p>
    </section>
  );
}
