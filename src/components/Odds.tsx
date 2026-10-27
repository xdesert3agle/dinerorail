import { BANNERS, STARLIGHT_PER_4_STAR, type BannerModel } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtSingles } from './format';
import { Icon } from './Icon';
import { Tip } from './Tip';
import { RUNS, type PlanOddsView } from './usePlanOdds';

interface Props {
  state: AppState;
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
  'Empieza con el pity y el garantizado actuales. No usa las casillas «50/50 ganado» de la planificación.',
  'Solo dice 100 % si llega incluso en el peor caso absoluto.',
  'El % de cada objetivo (contando que salgan también todos los anteriores) va en su fila de la planificación.',
  '',
  'Peor caso: todos los 5★ en el pity duro, todos los 50/50 perdidos y solo el 4★ garantizado:',
  `en el banner de conos, siempre cono (${STARLIGHT_PER_4_STAR.lightCone}); en el de personajes, alternando cono (${STARLIGHT_PER_4_STAR.lightCone}) y personaje (${STARLIGHT_PER_4_STAR.character}).`,
].join('\n');

/** Dice en qué se distingue de la planificación, que cuenta con los ajustes del usuario. */
const worstCaseHelp = (hardPity: Record<PullKind, number>) =>
  [
    `Tiradas que lo garantizan todo pase lo que pase: todos los 5★ en el pity duro (${BANNERS.character.hardPity} personaje, ${BANNERS.lightCone.hardPity} cono), ` +
      'todos los 50/50 perdidos y solo el 4★ garantizado, del tipo que menos Cosmiluz da.',
    `La planificación, en cambio, cuenta las tiradas por 5★ configuradas (${hardPity.character} personaje, ${hardPity.lightCone} cono) y las casillas «50/50 ganado».`,
  ].join('\n');

export function Odds({ state, view }: Props) {
  if (!view) return null;
  const { odds, sure, pct } = view;
  const plan = state.plannedPulls;

  return (
    <section className="card card-odds">
      <header className="card-header">
        <h2>
          <Tip content={MODEL_HELP}>Previsión de suerte</Tip>
        </h2>
        {/* Sin total: las tiradas con las que se simula son las del Resumen. */}
      </header>

      {/*
        Lo que significa cada cifra se abre desde su etiqueta (punteada), no desde toda la casilla: con cinco
        casillas grandes, al mover el ratón por la tarjeta iban saltando burbujas.
      */}
      <dl className="odds-stats">
        <div>
          <dt>
            <Tip className="tip-term" content="Probabilidad de conseguir todos los objetivos del plan con las tiradas de la fecha objetivo">
              Conseguirlo todo
            </Tip>
          </dt>
          <dd>{pct.at(-1)}</dd>
        </div>
        <div>
          <dt>
            <Tip className="tip-term" content="Cuántos objetivos del plan se consiguen de media, en orden">
              Objetivos esperados
            </Tip>
          </dt>
          <dd>
            {fmtSingles(odds.expectedTargets, 1)} <span className="muted">de {plan.length}</span>
          </dd>
        </div>
        <div>
          <dt>
            <Tip className="tip-term" content="La mitad de las veces bastan estas tiradas para conseguirlo todo">
              Suerte media
            </Tip>
          </dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.medianNeeded)}
          </dd>
        </div>
        <div>
          <dt>
            <Tip className="tip-term" content="El 90 % de las veces bastan estas tiradas para conseguirlo todo">
              90 % seguro
            </Tip>
          </dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.p90Needed)}
          </dd>
        </div>
        <div>
          <dt>
            <Tip className="tip-term" content={worstCaseHelp(state.settings.hardPity)}>
              Peor caso
            </Tip>
          </dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(sure.at(-1) ?? 0)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
