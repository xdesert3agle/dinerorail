/**
 * Decoración del tema Aha (Exultación) para el fondo de la tarjeta principal:
 * enrejado de arlequín y foco rojo (SVG) detrás de la ilustración del personaje.
 *
 * El enrejado usa el mismo lienzo que la telaraña de Kafka (720×300, anclado arriba a la derecha).
 */
import nihilux from '../assets/aha/nihilux.webp';

const CENTER = { x: 590, y: 115 };

const round = (n: number) => Math.round(n * 10) / 10;

// Enrejado de rombos: dos familias de líneas a ±60° separadas `STEP` unidades.
const STEP = 90;
const COT = 1 / Math.tan(Math.PI / 3);
const TOP = -20;
const BOTTOM = 320;
const LINE_INDEXES = Array.from({ length: 15 }, (_, i) => i - 3);

/** Radio alrededor del personaje en el que las celdas se tiñen (y se desvanecen con la distancia). */
const CHECKER_RADIUS = 240;

/** Punto donde se cruzan la línea i de la primera familia y la j de la segunda. */
function cross(i: number, j: number) {
  return { x: ((i + j) * STEP) / 2, y: ((i - j) * STEP) / (2 * COT) + TOP };
}

const CELLS = (() => {
  const cells: { d: string; opacity: number }[] = [];
  for (const i of LINE_INDEXES) {
    for (const j of LINE_INDEXES) {
      if ((((i + j) % 2) + 2) % 2 !== 0) continue;
      const left = cross(i, j);
      const top = cross(i, j + 1);
      const right = cross(i + 1, j + 1);
      const bottom = cross(i + 1, j);
      const dist = Math.hypot((left.x + right.x) / 2 - CENTER.x, (top.y + bottom.y) / 2 - CENTER.y);
      if (dist > CHECKER_RADIUS) continue;
      const points = [left, top, right, bottom].map((p) => `${round(p.x)} ${round(p.y)}`).join(' L ');
      cells.push({ d: `M ${points} Z`, opacity: round(0.18 * (1 - dist / CHECKER_RADIUS)) });
    }
  }
  return cells;
})();

export function Masks() {
  return (
    <>
      <svg className="hero-deco masks" viewBox="0 0 720 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
        <defs>
          <radialGradient id="aha-spotlight">
            <stop className="spotlight-core" offset="0%" stopColor="currentColor" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="lattice">
          {CELLS.map((c) => (
            <path key={c.d} d={c.d} fill="currentColor" fillOpacity={c.opacity} />
          ))}
          <g fill="none" stroke="currentColor" strokeWidth={0.8}>
            {LINE_INDEXES.map((k) => (
              <g key={k}>
                <path d={`M ${k * STEP} ${TOP} L ${round(k * STEP - (BOTTOM - TOP) * COT)} ${BOTTOM}`} vectorEffect="non-scaling-stroke" />
                <path d={`M ${k * STEP} ${TOP} L ${round(k * STEP + (BOTTOM - TOP) * COT)} ${BOTTOM}`} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </g>
        <circle cx={CENTER.x} cy={CENTER.y - 10} r="150" fill="url(#aha-spotlight)" />
      </svg>
      {/* Ilustración con el fondo blanco quitado (transparente); decorativa. */}
      <img className="hero-art" src={nihilux} alt="" aria-hidden="true" draggable={false} />
    </>
  );
}
