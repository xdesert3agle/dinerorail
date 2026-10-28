import { emptyPurchase, MAX_PACK_COUNT, packPrice, packShards, packsTotal, SHARD_PACKS } from '../engine/packs';
import { JADES_PER_PULL } from '../engine/rules';
import type { AppState, ShardPackPurchase } from '../engine/types';
import { withSettings } from '../state/store';
import { fmtInt, wholeSingles, YEN_PRICES_TIP } from './format';
import { Icon } from './Icon';
import { NumberField } from './NumberField';
import { Tip, TipTitle } from './Tip';
import { Toggle, ToggleTerm } from './Toggle';

interface Props {
  state: AppState;
  onChange: (update: (s: AppState) => AppState) => void;
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });

export function ShardPacks({ state, onChange }: Props) {
  const inYen = state.settings.packsInYen;
  const total = packsTotal(state.shardPacks, inYen);
  // Las Esquirlas se cambian 1:1 por Jades: en la cabecera, solo las tiradas enteras; lo que sobra, en la explicación.
  const packSingles = wholeSingles(total.shards / JADES_PER_PULL);
  const spareJades = total.shards - packSingles * JADES_PER_PULL;
  // Por qué no suman, si no suman: solo depende de «Usar paquetes en el plan» (aquí); «Convertir Esquirlas en Jades»
  // (Recursos actuales) es solo para las del inventario.
  const counted = state.settings.includePacks;
  const notCounted = counted ? '' : 'Ahora no suman: «Usar paquetes en el plan» está apagado.';

  const update = (id: string, patch: Partial<ShardPackPurchase>) =>
    onChange((s) => ({
      ...s,
      shardPacks: { ...s.shardPacks, [id]: { ...(s.shardPacks[id] ?? emptyPurchase()), ...patch } },
    }));

  return (
    <section className="card card-packs">
      <header className="card-header">
        <h2>Paquetes de Esquirlas Oníricas</h2>
        {/*
          Las tiradas que dan, como el total de las otras tarjetas; lo que cuestan va en la fila Total.
          Siempre presente (oculto si no hay nada) para que la cabecera no cambie de alto al aparecer.
        */}
        <Tip
          className={`card-total${total.shards > 0 ? '' : ' invisible'}${notCounted ? ' is-off' : ''}`}
          content={[
            spareJades > 0
              ? `Las Esquirlas dan ${fmtInt(packSingles)} tiradas y ${fmtInt(spareJades)} Jades más`
              : `Las Esquirlas dan ${fmtInt(packSingles)} tiradas`,
            notCounted,
          ]
            .filter(Boolean)
            .join('\n')}
        >
          <Icon kind="pass" size={22} decorative />
          <span className="sr-only">Tiradas de los paquetes: </span>
          {fmtInt(packSingles)}
        </Tip>
      </header>

      {/*
        Tabla para los lectores de pantalla (cada cifra con su columna); en pantalla, una rejilla. Con «Sumar los
        paquetes al total» apagado (.is-off), todos los totales de Esquirlas se apagan, no solo el de la fila Total.
      */}
      <div className={`pack-list${counted ? '' : ' is-off'}`} role="table" aria-label="Paquetes de Esquirlas Oníricas">
        <div className="pack-row pack-header" role="row">
          {/* Cada título al inicio de su columna (sobre el icono o el borde del campo), como en los eventos. */}
          <span role="columnheader">Paquete</span>
          <span role="columnheader">Precio</span>
          <span role="columnheader">Por compra</span>
          <span role="columnheader">Cantidad</span>
          {/* A la vista: sin título, el «×2» no se entendía sin abrir su ayuda. */}
          <span role="columnheader">1.ª compra</span>
          <span role="columnheader">Total</span>
        </div>
        {SHARD_PACKS.map((pack) => {
          const purchase = state.shardPacks[pack.id] ?? emptyPurchase();
          // Lo que da cada compra, la que se repite: el ×2 de la primera solo se nota en el Total. Con el ×2 aquí,
          // la fila no se podía comprobar multiplicando (2 compras de 980 enseñaban 1.960 y sumaban 3.050).
          const perPack = pack.base + pack.bonus;
          const shards = packShards(pack, purchase);
          const price = euros.format(packPrice(pack, inYen));
          return (
            <div key={pack.id} className={`pack-row ${shards > 0 ? '' : 'is-empty'}`} role="row">
              {/* «×6.480» con el icono: el título de la tarjeta ya dice que son Esquirlas. */}
              <span className="pack-name" role="cell">
                <Icon kind="shard" size={18} decorative />
                <span className="sr-only">Esquirlas Oníricas </span>×{fmtInt(pack.base)}
              </span>
              <span role="cell" className="num pack-price">
                {price}
              </span>
              {/*
                Icono a la izquierda y cifra a la derecha: los iconos quedan en columna. En el móvil va junto al
                precio, sin la cabecera encima, así que dice qué es («por compra»; el lector ya tiene la cabecera).
              */}
              <span className="pack-shards" role="cell">
                <Icon kind="shard" size={18} decorative />
                {fmtInt(perPack)}
                <span className="pack-per" aria-hidden="true">
                  por compra
                </span>
              </span>
              <span role="cell">
                <NumberField
                  compact
                  hideLabel
                  label={`Cantidad del paquete de ${fmtInt(pack.base)} Esquirlas`}
                  value={purchase.count}
                  min={0}
                  max={MAX_PACK_COUNT}
                  onChange={(count) =>
                    update(pack.id, { count: Math.min(MAX_PACK_COUNT, Math.max(0, Math.floor(count))) })
                  }
                />
              </span>
              <span role="cell">
                {/* Con la cifra real: el ×2 dobla la base del paquete, no lo que da cada compra (Por compra). */}
                <Tip control content={`Primera compra: ${fmtInt(pack.base * 2)} en vez de ${fmtInt(perPack)}`}>
                  {(describedBy) => (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={purchase.firstBonus}
                        aria-label={`Primera compra (el doble) del paquete de ${fmtInt(pack.base)} Esquirlas`}
                        aria-describedby={describedBy}
                        onChange={(e) => update(pack.id, { firstBonus: e.target.checked })}
                      />
                      {/* El signo de multiplicar, como en «×6.480»; el lector de pantalla lo dice en palabras (arriba). */}
                      <span aria-hidden="true">×2</span>
                    </label>
                  )}
                </Tip>
              </span>
              {/* Como en Por compra: icono a la izquierda y cifra a la derecha. */}
              <strong className="num pack-total" role="cell">
                <Icon kind="shard" size={18} decorative />
                <span className="pack-total-value">{fmtInt(shards)}</span>
              </strong>
            </div>
          );
        })}
        {/*
          Fila de total: lo que cuestan bajo Precio y las Esquirlas que dan bajo Total. Con «Sumar los paquetes al
          total» apagado, las Esquirlas se apagan como el total de la cabecera (el precio no: es lo que costarían).
          Tras «Total», siempre de qué tienda son los precios (se elige en Configuración): con España también,
          para que se sepa que hay otra. Las dos palabras ocupan el mismo hueco (.pack-store), así que cambiar de
          tienda no mueve las columnas.
        */}
        <div
          className={`pack-row pack-footer${total.shards > 0 ? '' : ' is-empty'}`}
          role="row"
        >
          <span className="pack-name" role="rowheader">
            Total
            <Tip
              className="tip-term swap pack-store"
              content={`${inYen ? YEN_PRICES_TIP : 'Precios de España'}. Se cambia en Configuración › Tienda`}
            >
              <span className={inYen ? 'invisible' : undefined} aria-hidden={inYen}>
                España
              </span>
              <span className={inYen ? undefined : 'invisible'} aria-hidden={!inYen}>
                Japón
              </span>
            </Tip>
          </span>
          <strong className="num pack-price" role="cell">
            {euros.format(total.euros)}
          </strong>
          <span role="cell" />
          <span role="cell" />
          <span role="cell" />
          <strong className="num pack-total" role="cell">
            <Icon kind="shard" size={18} decorative />
            <span className="pack-total-value">{fmtInt(total.shards)}</span>
          </strong>
        </div>
      </div>

      {/*
        Al pie, porque afecta a toda la tarjeta, y a la derecha, bajo el total de Esquirlas que decide: apagado,
        los paquetes no suman en nada pero las cantidades se quedan (¿llego sin pagar?). «En el plan» y no «al
        total»: justo encima está la fila Total, que no es la que cambia. Los precios de Japón no van aquí: se
        eligen una vez, en Configuración.
      */}
      <Toggle
        checked={counted}
        onChange={(includePacks) => onChange(withSettings({ includePacks }))}
        tip={
          <>
            <TipTitle>Paquetes</TipTitle>
            Apagado, no suman nada y se ve si basta sin pagar (las cantidades se quedan)
          </>
        }
      >
        {/* En un trozo: la etiqueta es flex, y el término con explicación partiría la frase con huecos. */}
        <span>
          Usar <ToggleTerm>paquetes</ToggleTerm> en el plan
        </span>
      </Toggle>
    </section>
  );
}
