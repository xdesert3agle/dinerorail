import type { ComponentType } from 'react';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { fmtDayMonth, fmtInt, fmtSingles } from './format';
import type { Skin } from '../engine/types';
import { Icon } from './Icon';
import { Masks } from './Masks';
import { Tip } from './Tip';
import { Threads } from './Threads';
import { Wireframe } from './Wireframe';

/** Decoración de fondo de la tarjeta principal en cada tema (Sparxie no lleva: su estilo ya es el marco). */
const DECORATION: Record<Skin, ComponentType | null> = {
  kafka: Threads,
  aha: Masks,
  grafito: Wireframe,
  sparxie: null,
};

/** "En 42 días · 11 nov." (o "Hoy · 21 oct."): la cuenta atrás y la fecha corta. */
function dateLabel(result: Result): string {
  const when = result.days === 0 ? 'Hoy' : result.days === 1 ? 'En 1 día' : `En ${fmtInt(result.days)} días`;
  return `${when} · ${fmtDayMonth(result.targetDate)}`;
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
  return (
    // Sin aria-live: la tarjeta cambia con cada tecla y el lector de pantalla la repetiría entera.
    <section className="card hero card-summary">
      <header className="card-header">
        <h2>Resumen</h2>
        {/* La fecha objetivo, a la vista: de ella sale la cifra (la fecha se cambia en Recursos actuales). */}
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
        {/* Las del inventario más las de los paquetes que cuentan («Contar los paquetes», en su tarjeta). */}
        <div className="hero-shards">
          <dt>Esquirlas Oníricas</dt>
          <dd className={counted ? undefined : 'is-off'}>
            <Icon kind="shard" size={28} decorative />
            {fmtInt(result.shardsHeld)}
            {!counted && <span className="sr-only"> (no se cuentan como Jades)</span>}
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
              <tr key={t.sourceId} title={`${fmtInt(t.reward.jades)} Jades · ${fmtInt(t.reward.specialPasses)} P. Especiales`}>
                <td>{t.name}</td>
                <td className="num">{fmtInt(t.count)}</td>
                <td className="num">{fmtSingles(t.singles)}</td>
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
