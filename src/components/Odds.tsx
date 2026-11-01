import type { ReactNode } from 'react';
import { RUNS } from '../engine/odds';
import { BANNERS, fiftyFiftyName, STARLIGHT_PER_4_STAR } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtRate, fmtSettingsPath, fmtSingles } from './format';
import { Icon } from './Icon';
import { KIND_LABEL } from './kinds';
import { Rarity } from './Rarity';
import { Tip, TipTitle } from './Tip';
import type { PlanOddsView } from './usePlanOdds';

interface Props {
  state: AppState;
  /** La simulación del plan (null si no hay nada planificado); el % de cada objetivo va en su fila. */
  view: PlanOddsView | null;
}

// Los textos de ayuda salen de las reglas (rules.ts), para que no se desfasen si cambian.

/** Las casillas de las filas del plan, cada una con la apuesta de su banner. */
const WIN_CHECKS = `«${fiftyFiftyName('character')} ganado» y «${fiftyFiftyName('lightCone')} ganado»`;

const KINDS: PullKind[] = ['character', 'lightCone'];

/** Una fila de BannerTable: lo que se ve (con la rareza en su color), su texto para los lectores y la cifra de cada banner. */
interface BannerRow {
  label: ReactNode;
  text: string;
  value: (kind: PullKind) => string;
}

/**
 * Las cifras de los dos banners en una tabla: una columna por banner, con su 5★ en el color de la rareza (como la
 * de la Cosmiluz), y las cifras alineadas para compararlas. Para los lectores, cada fila en una frase
 * («Por tirada: 0,6 % en personaje y 0,8 % en cono de luz.»).
 */
function BannerTable({ rows }: { rows: BannerRow[] }) {
  return (
    <>
      <span className="tip-lines" aria-hidden="true">
        <span className="tip-table tip-table-3 tip-table-spaced">
          <span className="tip-table-row">
            <span />
            {KINDS.map((kind) => (
              <span key={kind} className="tip-table-value rarity-5">
                {`${KIND_LABEL[kind]} `}
                <Rarity stars={5} />
              </span>
            ))}
          </span>
          {rows.map((row) => (
            <span key={row.text} className="tip-table-row">
              <span>{row.label}</span>
              {KINDS.map((kind) => (
                <span key={kind} className="tip-table-value">
                  {row.value(kind)}
                </span>
              ))}
            </span>
          ))}
        </span>
      </span>
      <span className="sr-only">
        {rows
          .map((row) => `${row.text}: ${KINDS.map((kind) => `${row.value(kind)} en ${KIND_LABEL[kind].toLowerCase()}`).join(' y ')}. `)
          .join('')}
      </span>
    </>
  );
}

/**
 * Las filas del modelo. El destacado no es el 50/50 ni el 75/25 redondos (ver FIFTY_FIFTY_POOL): escritos así harían
 * creer que se simula otra cosa.
 */
const MODEL_ROWS: BannerRow[] = [
  { label: 'Por tirada', text: 'Por tirada', value: (kind) => fmtRate(BANNERS[kind].base) },
  { label: 'Aumenta desde la tirada', text: 'Aumenta desde la tirada', value: (kind) => String(BANNERS[kind].softPityFrom) },
  { label: 'Garantizado en la tirada', text: 'Garantizado en la tirada', value: (kind) => String(BANNERS[kind].hardPity) },
  { label: 'Destacado', text: 'Destacado', value: (kind) => fmtRate(BANNERS[kind].featuredChance, 2) },
];

/**
 * Cómo se simula: la tabla de los dos banners y debajo las notas, una por viñeta. El peor caso no va aquí: tiene
 * su propia explicación, en su cifra (un término, una definición).
 */
function ModelHelp() {
  return (
    <>
      {/* «Simulación» y no el título de la tarjeta, que queda justo encima: nombra lo que explica la burbuja. */}
      <TipTitle>Simulación</TipTitle>
      {`${fmtInt(RUNS)} intentos con las probabilidades oficiales`}
      <span className="sr-only">: </span>
      <BannerTable rows={MODEL_ROWS} />
      <span className="tip-list">
        <span>Parte del pity y el garantizado actuales.</span>
        <span>{`No usa las casillas ${WIN_CHECKS} del plan.`}</span>
        <span>Solo se considera 100&nbsp;% si se consigue todo incluso en el peor caso.</span>
        <span>La probabilidad de cada objetivo, junto con la de todos los anteriores, se muestra en su fila del plan.</span>
      </span>
    </>
  );
}

/**
 * La etiqueta de una cifra con su definición, como una entrada de glosario: el término subrayado y, en la burbuja,
 * el mismo término de cabecera y la definición debajo.
 */
function StatTerm({ term, help }: { term: string; help: ReactNode }) {
  return (
    <Tip
      className="tip-term"
      content={
        <>
          <TipTitle>{term}</TipTitle>
          {help}
        </>
      }
    >
      {term}
    </Tip>
  );
}

/**
 * Cosmiluz con su icono en lugar de la palabra, como una unidad («8🌟»), igual que en la tabla de la Cosmiluz
 * (glossary.tsx); la palabra queda para los lectores. Cifra e icono, sin corte entre ellos. `named`: la palabra ya
 * va a la vista justo detrás («8🌟 y 20🌟 de Cosmiluz»), y los lectores no la oyen dos veces.
 */
function StarlightAmount({ amount, named = false }: { amount: number; named?: boolean }) {
  return (
    <span className="with-icon with-icon-tight">
      {amount}
      <Icon kind="starlight" size={16} decorative />
      {!named && <span className="sr-only"> de Cosmiluz</span>}
    </span>
  );
}

/**
 * El peor caso: la frase que lo define y, en viñetas, lo que supone (sin tabla: son dos cifras por banner, se leen
 * bien en una frase) y en qué se distingue del plan, que cuenta con los ajustes.
 */
function WorstCaseHelp({ hardPity }: { hardPity: Record<PullKind, number> }) {
  return (
    <>
      Tiradas que garantizan conseguirlo todo con la peor suerte posible.
      <span className="tip-list tip-lines-last">
        <span>
          Cada <Rarity stars={5} /> llega en el límite del juego ({BANNERS.character.hardPity} en personaje y{' '}
          {BANNERS.lightCone.hardPity} en cono de luz).
        </span>
        <span>{`Se pierden todos los ${fiftyFiftyName('character')} y ${fiftyFiftyName('lightCone')}.`}</span>
        <span>
          Solo sale el <Rarity stars={4} /> garantizado. En el banner de personajes alterna cono de luz y personaje (
          {/* La primera vez, con su nombre: en esta burbuja no se presenta en otro sitio. Luego basta el icono. */}
          <StarlightAmount amount={STARLIGHT_PER_4_STAR.lightCone} named /> y{' '}
          <StarlightAmount amount={STARLIGHT_PER_4_STAR.character} named /> de Cosmiluz); en el de conos, siempre es un cono de luz (
          <StarlightAmount amount={STARLIGHT_PER_4_STAR.lightCone} />).
        </span>
        <span>
          {`El plan, en cambio, usa los límites de ${fmtSettingsPath('Pity')} (${hardPity.character} y ${hardPity.lightCone}) y las casillas ${WIN_CHECKS}.`}
        </span>
      </span>
    </>
  );
}

export function Odds({ state, view }: Props) {
  if (!view) return null;
  const { odds, sure, pct } = view;
  const plan = state.plannedPulls;

  return (
    <section className="card card-odds">
      <header className="card-header">
        <h2>
          <Tip content={<ModelHelp />}>Previsión de suerte</Tip>
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
            <StatTerm
              term="Conseguirlo todo"
              help="Probabilidad de conseguir todos los objetivos del plan con las tiradas de la fecha objetivo."
            />
          </dt>
          <dd>{pct.at(-1)}</dd>
        </div>
        <div className="odds-stat-wide">
          <dt>
            <StatTerm term="Objetivos esperados" help="Número medio de objetivos del plan que se consiguen, en orden." />
          </dt>
          <dd>
            {fmtSingles(odds.expectedTargets, 1)} <span className="muted">de {plan.length}</span>
          </dd>
        </div>
        <div>
          <dt>
            <StatTerm term="Suerte media" help="Tiradas que bastan para conseguirlo todo la mitad de las veces." />
          </dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.medianNeeded)}
          </dd>
        </div>
        <div>
          <dt>
            <StatTerm term="90 % seguro" help="Tiradas que bastan para conseguirlo todo el 90 % de las veces." />
          </dt>
          <dd className="with-icon">
            <Icon kind="pass" size={28} decorative />
            {fmtInt(odds.p90Needed)}
          </dd>
        </div>
        <div>
          <dt>
            <StatTerm term="Peor caso" help={<WorstCaseHelp hardPity={state.settings.hardPity} />} />
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
