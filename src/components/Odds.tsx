import { useMemo } from 'react';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { guaranteedNeeded, planOdds, simulatePlan } from '../engine/odds';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtSingles } from './format';
import { Icon } from './Icon';

interface Props {
  state: AppState;
  result: Result;
}

const RUNS = 10000;
const KIND_LABEL: Record<PullKind, string> = { character: 'Personaje', lightCone: 'Cono de luz' };

/**
 * Porcentaje legible, sin decimales. Solo dice 100 % si llega aunque todo salga en el pity duro,
 * y 0 % si ni siquiera hay una single por objetivo; si no, como mucho ">99 %" y como poco "<1 %".
 */
function fmtPct(p: number, certain: boolean, impossible: boolean): string {
  if (certain) return '100 %';
  if (impossible) return '0 %';
  if (p > 0.99) return '>99 %';
  if (p < 0.01) return '<1 %';
  return `${Math.round(p * 100)} %`;
}

const MODEL_HELP = [
  `Simulación de ${fmtInt(RUNS)} intentos con las probabilidades reales:`,
  'Personaje: 0,6 %, sube desde la tirada 74, seguro en la 90; 50/50',
  'Cono: 0,8 %, sube desde la tirada 66, seguro en la 80; 75/25',
  'Empieza en tu pity actual y con tu garantizado. No usa la casilla 50/50 de cada fila.',
  'Solo dice 100 % si llega incluso en el peor caso absoluto.',
  '',
  'Peor caso: todos los 5★ en el pity duro, todos los 50/50 perdidos y solo el 4★ garantizado:',
  'en conos, siempre cono (8); en personaje, alternando cono (8) y personaje (20).',
].join('\n');

export function Odds({ state, result }: Props) {
  const plan = state.plannedPulls;
  const { pity, guaranteed } = state;
  const { countStarlight } = state.settings;
  const budget = result.wholeSingles;
  const initialStarlight = result.starlightLeftover;

  // Solo importan el tipo y el orden de cada objetivo: cambiar un nombre no repite la simulación.
  const kinds = plan.map((p) => p.kind).join(',');
  const sim = useMemo(
    () => simulatePlan(plan, pity, { countStarlight, guaranteed, initialStarlight }, RUNS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kinds, pity.character, pity.lightCone, guaranteed.character, guaranteed.lightCone, countStarlight, initialStarlight],
  );

  if (plan.length === 0) return null;
  const odds = planOdds(sim, budget);
  const sure = guaranteedNeeded(plan, pity, { countStarlight, guaranteed, initialStarlight });
  const pctOf = (i: number) => fmtPct(odds.chances[i], budget >= sure[i], budget < i + 1);

  return (
    <section className="card">
      <header className="card-header">
        <h2 title={MODEL_HELP}>Previsión de suerte</h2>
        <span className="muted with-icon" title={`Singles el ${formatDate(result.targetDate)}`}>
          <Icon kind="pass" size={18} decorative />
          {fmtInt(budget)}
        </span>
      </header>

      <div className="odds-list">
        {plan.map((p, i) => (
          <div key={p.id} className="odds-row" title="Probabilidad de tenerlo, junto con todos los anteriores">
            {/* El tipo va como icono (con su nombre en el tooltip y para lectores de pantalla). */}
            <span className="odds-name">
              <span
                className={`glyph ${p.kind === 'character' ? 'glyph-character' : 'glyph-light-cone'}`}
                title={KIND_LABEL[p.kind]}
                aria-hidden="true"
              />
              {p.name ? (
                <>
                  <span className="sr-only">{KIND_LABEL[p.kind]}: </span>
                  {p.name}
                </>
              ) : (
                KIND_LABEL[p.kind]
              )}
            </span>
            <span className="odds-bar" aria-hidden="true">
              <span style={{ width: `${odds.chances[i] * 100}%` }} />
            </span>
            <strong className="odds-pct">{pctOf(i)}</strong>
          </div>
        ))}
      </div>

      <dl className="odds-stats">
        <div title="Probabilidad de conseguir todas las tiradas planificadas con las singles de ese día">
          <dt>Conseguirlo todo</dt>
          <dd>{pctOf(plan.length - 1)}</dd>
        </div>
        <div title="Cuántas tiradas planificadas conseguirías de media, en orden">
          <dt>Objetivos esperados</dt>
          <dd>
            {fmtSingles(odds.expectedTargets, 1)} <span className="muted">de {plan.length}</span>
          </dd>
        </div>
        <div title="La mitad de las veces bastan estas singles para conseguirlo todo">
          <dt>Suerte media</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={20} decorative />
            {fmtInt(odds.medianNeeded)}
          </dd>
        </div>
        <div title="El 90 % de las veces bastan estas singles para conseguirlo todo">
          <dt>90 % seguro</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={20} decorative />
            {fmtInt(odds.p90Needed)}
          </dd>
        </div>
        <div title="El peor caso absoluto: todos los 5★ en el pity duro (90 personaje, 80 cono), todos los 50/50 perdidos y solo el 4★ garantizado, del tipo que menos Cosmiluz da">
          <dt>100 % seguro</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={20} decorative />
            {fmtInt(sure.at(-1) ?? 0)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
