import type { ComponentType } from 'react';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { fmtCountdown, fmtDayMonth, fmtInt, fmtSingles } from './format';
import type { Skin } from '../engine/types';
import { Icon } from './Icon';
import { Masks } from './Masks';
import { Tip } from './Tip';

/** Decoración de fondo de la tarjeta principal en cada tema (Sparxie no lleva: su estilo ya es el marco). */
const DECORATION: Record<Skin, ComponentType | null> = {
  aha: Masks,
  sparxie: null,
};

/** "11 nov. (en 42 días)", "21 oct. (hoy)": la fecha corta y cuánto falta, como en las fechas destacadas. */
function dateLabel(result: Result): string {
  return `${fmtDayMonth(result.targetDate)} (${fmtCountdown(result.days)})`;
}

export function ResultSummary({ result, skin }: { result: Result; skin: Skin }) {
  if (!result.valid) {
    return (
      <section className="card hero card-summary">
        <header className="card-header">
          <h2>Resumen</h2>
        </header>
        <p className="warning">La fecha objetivo tiene que ser hoy o posterior.</p>
      </section>
    );
  }

  const { final } = result;
  const Decoration = DECORATION[skin];
  const counted = result.shards > 0 || result.shardsHeld === 0;
  // Las que se tienen pero no suman: las del inventario con «Convertir Esquirlas en Jades» apagado.
  const unconverted = result.shardsHeld - result.shards;
  return (
    // Sin aria-live: la tarjeta cambia con cada tecla y el lector de pantalla la repetiría entera.
    <section className="card hero card-summary">
      <header className="card-header">
        <h2>Resumen</h2>
        {/* La fecha objetivo, a la vista: de ella sale la cifra (se cambia en la tarjeta de la fecha objetivo). */}
        <Tip className="hero-date" content={`Fecha objetivo: ${formatDate(result.targetDate)}`}>
          {dateLabel(result)}
        </Tip>
      </header>
      {Decoration && <Decoration />}
      {/* Solo la cifra, sin explicación: en el Resumen, cuantas menos burbujas, mejor. */}
      <div className="hero-value">
        <Icon kind="pass" size={64} decorative />
        {fmtInt(result.wholeSingles)}
        {/* El icono del Pase ya dice la unidad; la palabra queda solo para lectores de pantalla. */}
        <span className="sr-only">tiradas</span>
      </div>

      <dl className="hero-stats">
        <div>
          <dt>Jades Estelares</dt>
          <dd>
            <Icon kind="jade" size={28} decorative />
            {fmtInt(final.jades - result.shards)}
          </dd>
        </div>
        <div>
          <dt>Pases Especiales</dt>
          <dd>
            <Icon kind="pass" size={28} decorative />
            {fmtInt(final.specialPasses)}
          </dd>
        </div>
        {/*
          Las que suman a la cifra: las del inventario si se convierten y las de los paquetes si se cuentan (cada
          una con su interruptor). Si no suma ninguna, las que se tienen, atenuadas.
        */}
        <div className="hero-shards">
          <dt>Esquirlas Oníricas</dt>
          <dd className={counted ? undefined : 'is-off'}>
            <Icon kind="shard" size={28} decorative />
            {fmtInt(counted ? result.shards : result.shardsHeld)}
            {!counted && <span className="sr-only"> (no se convierten en Jades)</span>}
            {counted && unconverted > 0 && (
              <span className="sr-only"> (y {fmtInt(unconverted)} del inventario sin convertir)</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function Breakdown({ result }: { result: Result }) {
  if (!result.valid || result.bySource.length === 0) return null;
  const max = Math.max(...result.bySource.map((t) => t.singles), 0.0001);

  return (
    <section className="card card-breakdown">
      <header className="card-header">
        <h2>Desglose por fuente</h2>
      </header>
      <div className="table-wrap">
        <table className="breakdown">
          <thead>
            <tr>
              <th>Fuente</th>
              <th className="num">Cobros</th>
              <th className="num">Tiradas</th>
              <th className="bar-col" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {result.bySource.map((t) => (
              <tr key={t.sourceId}>
                <td>{t.name}</td>
                <td className="num">{fmtInt(t.count)}</td>
                {/* De dónde salen esas tiradas: una explicación del dato (Tip, también en táctil), no un title. */}
                <td className="num">
                  <Tip content={`${fmtInt(t.reward.jades)} Jades · ${fmtInt(t.reward.specialPasses)} Pases Especiales`}>
                    {fmtSingles(t.singles)}
                  </Tip>
                </td>
                <td className="bar-col" aria-hidden="true">
                  <div className="bar" style={{ width: `${(t.singles / max) * 100}%` }} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total del periodo</td>
              <td />
              <td className="num">{fmtSingles(result.incomeSingles)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
