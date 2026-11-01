import { RUNS } from '../engine/odds';
import { BANNERS, fiftyFiftyName, STARLIGHT_PER_4_STAR, type BannerModel } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtRate, fmtSettingsPath, fmtSingles } from './format';
import { Icon } from './Icon';
import { KIND_LABEL } from './kinds';
import { Tip } from './Tip';
import type { PlanOddsView } from './usePlanOdds';

interface Props {
  state: AppState;
  /** La simulación del plan (null si no hay nada planificado); el % de cada objetivo va en su fila. */
  view: PlanOddsView | null;
}

// Los textos de ayuda salen de las reglas (rules.ts), para que no se desfasen si cambian.

/**
 * "Personaje: 0,6 % por tirada, en aumento desde la tirada 74 y garantizado en la 90. El 56,25 % de los 5★ es el
 * destacado." No es el 50/50 ni el 75/25 redondos (ver FIFTY_FIFTY_POOL): escritos así harían creer que se simula
 * otra cosa.
 */
const describeBanner = (label: string, b: BannerModel) =>
  `${label}: ${fmtRate(b.base)} por tirada, en aumento desde la tirada ${b.softPityFrom} y garantizado en la ${b.hardPity}. El ${fmtRate(b.featuredChance, 2)} de los 5★ es el destacado.`;

/** Las casillas de las filas del plan, cada una con la apuesta de su banner. */
const WIN_CHECKS = `«${fiftyFiftyName('character')} ganado» y «${fiftyFiftyName('lightCone')} ganado»`;

// El peor caso no va aquí: tiene su propia explicación, en su cifra (un término, una definición).
const MODEL_HELP = [
  `Simulación de ${fmtInt(RUNS)} intentos con las probabilidades oficiales:`,
  describeBanner(KIND_LABEL.character, BANNERS.character),
  describeBanner(KIND_LABEL.lightCone, BANNERS.lightCone),
  `Parte del pity y el garantizado actuales. No usa las casillas ${WIN_CHECKS} del plan.`,
  'Solo se considera 100 % si se consigue todo incluso en el peor caso.',
  'La probabilidad de cada objetivo, junto con la de todos los anteriores, se muestra en su fila del plan.',
].join('\n');

/** Dice en qué se distingue del plan de tiradas, que cuenta con los ajustes del usuario. */
const worstCaseHelp = (hardPity: Record<PullKind, number>) =>
  [
    'Tiradas que garantizan conseguirlo todo con la peor suerte posible. ' +
      `Cada 5★ llega en el límite del juego (${BANNERS.character.hardPity} en personaje y ${BANNERS.lightCone.hardPity} en cono de luz), ` +
      `se pierden todos los ${fiftyFiftyName('character')} y ${fiftyFiftyName('lightCone')} y solo sale el 4★ garantizado.`,
    `Ese 4★ es siempre un cono de luz en el banner de conos (${STARLIGHT_PER_4_STAR.lightCone} de Cosmiluz), y en el de personajes alterna cono de luz y personaje (${STARLIGHT_PER_4_STAR.lightCone} y ${STARLIGHT_PER_4_STAR.character}).`,
    `El plan, en cambio, usa los límites de ${fmtSettingsPath('Pity')} (${hardPity.character} y ${hardPity.lightCone}) y las casillas ${WIN_CHECKS}.`,
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
        <div className="odds-stat-wide">
          <dt>
            <Tip className="tip-term" content="Probabilidad de conseguir todos los objetivos del plan con las tiradas de la fecha objetivo.">
              Conseguirlo todo
            </Tip>
          </dt>
          <dd>{pct.at(-1)}</dd>
        </div>
        <div className="odds-stat-wide">
          <dt>
            <Tip className="tip-term" content="Número medio de objetivos del plan que se consiguen, en orden.">
              Objetivos esperados
            </Tip>
          </dt>
          <dd>
            {fmtSingles(odds.expectedTargets, 1)} <span className="muted">de {plan.length}</span>
          </dd>
        </div>
        <div>
          <dt>
            <Tip className="tip-term" content="Tiradas que bastan para conseguirlo todo la mitad de las veces.">
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
            <Tip className="tip-term" content="Tiradas que bastan para conseguirlo todo el 90 % de las veces.">
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
