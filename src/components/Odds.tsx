import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { BANNERS, STARLIGHT_PER_4_STAR, type BannerModel } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtSingles } from './format';
import { Icon } from './Icon';
import { Tip } from './Tip';
import { RUNS, type PlanOddsView } from './usePlanOdds';

interface Props {
  state: AppState;
  result: Result;
  /** La simulación del plan (null si no hay nada planificado); el % de cada objetivo va en su fila. */
  view: PlanOddsView | null;
}

// Los textos de ayuda salen de las reglas (rules.ts), para que no se desfasen si cambian.
const rate = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });

/** "Personaje: 0,6 %, sube desde la tirada 74, seguro en la 90; 50/50". */
const describeBanner = (label: string, b: BannerModel) => {
  const featured = Math.round(b.featuredChance * 100);
  return `${label}: ${rate.format(b.base)}, sube desde la tirada ${b.softPityFrom}, seguro en la ${b.hardPity}; ${featured}/${100 - featured}`;
};

const MODEL_HELP = [
  `Simulación de ${fmtInt(RUNS)} intentos con las probabilidades reales:`,
  describeBanner('Personaje', BANNERS.character),
  describeBanner('Cono', BANNERS.lightCone),
  'Empieza en tu pity actual y con tu garantizado. No usa las casillas «Gano 50/50» de la planificación.',
  'Solo dice 100 % si llega incluso en el peor caso absoluto.',
  'El % de cada objetivo, junto con todos los anteriores, va en su fila de la planificación.',
  '',
  'Peor caso: todos los 5★ en el pity duro, todos los 50/50 perdidos y solo el 4★ garantizado:',
  `en conos, siempre cono (${STARLIGHT_PER_4_STAR.lightCone}); en personaje, alternando cono (${STARLIGHT_PER_4_STAR.lightCone}) y personaje (${STARLIGHT_PER_4_STAR.character}).`,
].join('\n');

/** Dice en qué se distingue de la planificación, que cuenta con los ajustes del usuario. */
const worstCaseHelp = (hardPity: Record<PullKind, number>) =>
  [
    `Singles que lo garantizan todo pase lo que pase: todos los 5★ en el pity duro (${BANNERS.character.hardPity} personaje, ${BANNERS.lightCone.hardPity} cono), ` +
      'todos los 50/50 perdidos y solo el 4★ garantizado, del tipo que menos Cosmiluz da.',
    `La planificación, en cambio, cuenta tus tiradas por 5★ (${hardPity.character} personaje, ${hardPity.lightCone} cono) y tus casillas «Gano 50/50».`,
  ].join('\n');

export function Odds({ state, result, view }: Props) {
  if (!view) return null;
  const { odds, sure, pct } = view;
  const plan = state.plannedPulls;
  const budget = result.wholeSingles;

  return (
    <section className="card">
      <header className="card-header">
        <h2>
          <Tip content={MODEL_HELP}>Previsión de suerte</Tip>
        </h2>
        <Tip className="card-total" content={`Singles el ${formatDate(result.targetDate)}`}>
          <Icon kind="pass" size={22} decorative />
          {fmtInt(budget)}
        </Tip>
      </header>

      {/* Cada casilla se puede tocar o enfocar para ver qué significa. */}
      <dl className="odds-stats">
        <Tip as="div" content="Probabilidad de conseguir todas las tiradas planificadas con las singles de ese día">
          <dt>Conseguirlo todo</dt>
          <dd>{pct.at(-1)}</dd>
        </Tip>
        <Tip as="div" content="Cuántas tiradas planificadas conseguirías de media, en orden">
          <dt>Objetivos esperados</dt>
          <dd>
            {fmtSingles(odds.expectedTargets, 1)} <span className="muted">de {plan.length}</span>
          </dd>
        </Tip>
        <Tip as="div" content="La mitad de las veces bastan estas singles para conseguirlo todo">
          <dt>Suerte media</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.medianNeeded)}
          </dd>
        </Tip>
        <Tip as="div" content="El 90 % de las veces bastan estas singles para conseguirlo todo">
          <dt>90 % seguro</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.p90Needed)}
          </dd>
        </Tip>
        <Tip as="div" content={worstCaseHelp(state.settings.hardPity)}>
          <dt>Peor caso</dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(sure.at(-1) ?? 0)}
          </dd>
        </Tip>
      </dl>
    </section>
  );
}
