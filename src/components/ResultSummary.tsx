import type { ComponentType } from 'react';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { fmtInt, fmtSingles } from './format';
import type { Skin } from '../engine/types';
import { Icon } from './Icon';
import { Masks } from './Masks';
import { Threads } from './Threads';
import { Wireframe } from './Wireframe';

/** Decoración de fondo de la tarjeta principal en cada tema (Sparxie no lleva: su estilo ya es el marco). */
const DECORATION: Record<Skin, ComponentType | null> = {
  kafka: Threads,
  aha: Masks,
  grafito: Wireframe,
  sparxie: null,
};

export function ResultSummary({ result, skin }: { result: Result; skin: Skin }) {
  if (!result.valid) {
    return (
      <section className="card hero">
        <header className="card-header">
          <h2>Resumen</h2>
        </header>
        <p className="warning">La fecha objetivo tiene que ser hoy o posterior.</p>
      </section>
    );
  }

  const { final } = result;
  const Decoration = DECORATION[skin];
  return (
    <section className="card hero" aria-live="polite">
      <header className="card-header">
        <h2>Resumen</h2>
      </header>
      {Decoration && <Decoration />}
      {/* Solo la cifra; la fecha, los Jades sueltos y lo ganado en el periodo quedan en el tooltip. */}
      <div
        className="hero-value"
        title={`El ${formatDate(result.targetDate)} (${fmtInt(result.days)} días) · ${fmtInt(result.leftoverJades)} Jades sueltos · +${fmtSingles(result.incomeSingles, 1)} singles ganadas en el periodo`}
      >
        <Icon kind="pass" size={64} decorative />
        {fmtInt(result.wholeSingles)}
        {/* El icono del Pase ya dice la unidad; la palabra queda solo para lectores de pantalla. */}
        <span className="sr-only">singles</span>
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
        <div>
          <dt>Esquirlas Oníricas</dt>
          <dd>
            <Icon kind="shard" size={28} decorative />
            {result.shards > 0 ? fmtInt(result.shards) : '—'}
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
    <section className="card">
      <header className="card-header">
        <h2>Desglose por fuente</h2>
        <span className="muted">en singles</span>
      </header>
      <div className="table-wrap">
        <table className="breakdown">
          <thead>
            <tr>
              <th>Fuente</th>
              <th className="num">Cobros</th>
              <th className="num">Singles</th>
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
