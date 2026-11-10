import type { ReactNode } from 'react';
import { RUNS } from '../engine/odds';
import { BANNERS, fiftyFiftyName } from '../engine/rules';
import type { AppState, PullKind } from '../engine/types';
import { fmtInt, fmtRate, fmtSingles } from './format';
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

/** Cómo se simula: la tabla de los dos banners y debajo las notas, una por viñeta. */
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
        <span>Solo se considera 100&nbsp;% si se consigue todo con la peor suerte posible.</span>
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

export function Odds({ state, view }: Props) {
  if (!view) return null;
  const { odds, pct } = view;
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
        Lo que significa cada cifra se abre desde su etiqueta (punteada), no desde toda la casilla: con cuatro
        casillas grandes, al mover el ratón por la tarjeta iban saltando burbujas.
      */}
      <dl className="odds-stats">
        <div>
          <dt>
            <StatTerm
              term="Conseguirlo todo"
              help="Probabilidad de conseguir todos los objetivos del plan con las tiradas de la fecha objetivo."
            />
          </dt>
          <dd>{pct.at(-1)}</dd>
        </div>
        <div>
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
      </dl>
    </section>
  );
}
