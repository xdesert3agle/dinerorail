import type { PullKind } from '../engine/types';
import {
  BANNERS,
  fiveStarRate,
  FOUR_STAR_BASE_RATE,
  FOUR_STAR_RATE,
  MAX_EIDOLON,
  STARLIGHT_PER_4_STAR,
  STARLIGHT_PER_PASS,
  targetStarlight,
} from '../engine/rules';
import { fmtRate } from './format';
import { Icon } from './Icon';
import { KIND_LABEL } from './kinds';
import { Rarity } from './Rarity';
import { TipTitle } from './Tip';

/*
 * Glosario: las definiciones que se repiten en más de una tarjeta. Un término, una definición: donde se marque
 * (una vez por tarjeta), dice lo mismo, y si cambia una regla del juego se cambia aquí.
 */

/** Cosmiluz que devuelve cada cosa al salir (de las reglas de rules.ts). */
const STARLIGHT_REFUNDS: { kind: PullKind; stars: 4 | 5; note?: string; amount: number }[] = [
  // Por rareza: los 4★ juntos y luego los 5★, cada personaje con su cono.
  { kind: 'character', stars: 4, amount: STARLIGHT_PER_4_STAR.character },
  { kind: 'lightCone', stars: 4, amount: STARLIGHT_PER_4_STAR.lightCone },
  { kind: 'character', stars: 5, note: 'nuevo', amount: targetStarlight('character', 0) },
  { kind: 'character', stars: 5, note: 'E1–E6', amount: targetStarlight('character', 1) },
  { kind: 'character', stars: 5, note: 'tras E6', amount: targetStarlight('character', MAX_EIDOLON + 1) },
  { kind: 'lightCone', stars: 5, amount: targetStarlight('lightCone', null) },
];
/**
 * Probabilidad por tirada, la base y la consolidada, agrupada por banner: su 5★ y debajo, sangrado, su 4★. El sitio
 * dice de qué banner es el 4★; con una nota («banner de personaje») la columna se ensanchaba y alejaba las cifras.
 * `banner`: lo que el sangrado no dice a los lectores de pantalla.
 */
const ODDS_ROWS: { label: string; stars: 4 | 5; banner?: string; base: string; total: string }[] = (
  ['character', 'lightCone'] as const
).flatMap((kind) => [
  { label: KIND_LABEL[kind], stars: 5 as const, base: fmtRate(BANNERS[kind].base), total: fmtRate(fiveStarRate(kind), 2) },
  // «Cualquier»: la del 4★ cuenta cualquier 4★ (personaje o cono de luz).
  {
    label: 'Cualquier',
    stars: 4 as const,
    banner: kind === 'character' ? 'banner de personaje' : 'banner de conos',
    base: fmtRate(FOUR_STAR_BASE_RATE[kind]),
    total: fmtRate(FOUR_STAR_RATE[kind]),
  },
]);
/** «Cono 4★», «Personaje 5★ (nuevo)»: el texto de cada fila, para la clave y los lectores de pantalla. */
const refundLabel = ({ kind, stars, note }: (typeof STARLIGHT_REFUNDS)[number]) =>
  `${KIND_LABEL[kind]} ${stars}★${note ? ` (${note})` : ''}`;

/**
 * Cosmiluz: su cambio en tiradas, lo que devuelve cada objeto y las probabilidades por tirada. La del campo de
 * Recursos actuales y la del interruptor del plan.
 */
export function StarlightDefinition() {
  return (
    <>
    {/* La entrada, con el nombre completo del juego; el texto usa la forma corta. */}
    <TipTitle>Cosmiluz Inextinguible</TipTitle>
    {/*
      La conversión, primero: es la leyenda de todo lo que sigue (como el tipo de cambio sobre una lista de
      precios) y explica en qué unidad va la píldora «+22» del interruptor del plan. Entre los dos bloques de
      datos quedaba encajonada.
    */}
    {/*
      Con nombre e icono, como la de las Esquirlas (espacios del «=» fijos: en flex se recortan). El punto,
      solo para los lectores: sin él juntarían la equivalencia con el rótulo.
    */}
    <span className="with-icon with-icon-tight tip-rule">
      {`${STARLIGHT_PER_PASS} Cosmiluz`}
      <Icon kind="starlight" size={16} decorative />
      {'\u00a0=\u00a01 tirada'}
      <Icon kind="pass" size={16} decorative />
      <span className="sr-only">. </span>
    </span>
    Por objeto obtenido
    {/* Rótulo sin puntuación a la vista; los lectores, que no ven el salto de línea, hacen la pausa. */}
    <span className="sr-only">: </span>
    {/*
      La tabla de equivalencias con el icono en lugar de la palabra, como una unidad («5★ = 40🌟»):
      la frase de arriba ya lo presenta.
    */}
    <span className="tip-lines" aria-hidden="true">
      {/* En columnas: qué sale · la Cosmiluz, alineada a la derecha para que las cifras cuadren. */}
      <span className="tip-table">
        {STARLIGHT_REFUNDS.map((r) => (
          <span key={refundLabel(r)} className="tip-table-row">
            {/* «(nuevo)» en tinta: es una condición de la fila, no parte de la rareza. */}
            <span>
              <span className={`rarity-${r.stars}`}>
                {`${KIND_LABEL[r.kind]} `}
                <Rarity stars={r.stars} />
              </span>
              {r.note && ` (${r.note})`}
            </span>
            <span className="with-icon with-icon-tight tip-table-value">
              {r.amount}
              <Icon kind="starlight" size={16} decorative />
            </span>
          </span>
        ))}
      </span>
    </span>
    <span className="sr-only">
      {STARLIGHT_REFUNDS.map((r) => `${refundLabel(r)} = ${r.amount} Cosmiluz. `).join('')}
    </span>
    {/*
      Probabilidades, una línea por fila y en columnas como la lista de arriba: la base del juego y,
      entre paréntesis, la consolidada (contando el garantizado o el pity), que lo dice su rótulo.
    */}
    Probabilidad por tirada (con garantizado)
    <span className="sr-only">: </span>
    <span className="tip-table tip-table-3 tip-lines-last">
      {ODDS_ROWS.map((row) => (
        <span key={`${row.label}${row.banner ?? ''}`} className="tip-table-row">
          <span className={row.banner ? `rarity-${row.stars} tip-table-sub` : `rarity-${row.stars}`}>
            {`${row.label} `}
            <Rarity stars={row.stars} />
            {row.banner && <span className="sr-only">{` (${row.banner})`}</span>}
          </span>
          <span className="tip-table-value">{row.base}</span>
          <span className="tip-table-value">({row.total})</span>
        </span>
      ))}
    </span>
    </>
  );
}
