/**
 * Telaraña decorativa al estilo de Kafka para el fondo de la tarjeta principal,
 * con su araña (inspirada en el icono de su definitiva) en el centro.
 *
 * Coordenadas en un lienzo de 720×300 (≈ píxeles de la tarjeta en escritorio), anclado arriba a la derecha.
 */
const CENTER = { x: 590, y: 110 };

/** Dirección de cada radio, en grados en el sentido del reloj desde las 12. */
const SPOKES = [-10, 51, 100, 144, 188, 229, 273, 306];

/** Longitud de los radios: de sobra para llegar a los bordes de la tarjeta. */
const SPOKE_LENGTH = 800;

/** Anillos: radio, primer radio desde el que empieza, cuántos tramos recorre y opacidad. */
const RINGS = [
  { r: 50, start: 0, segments: 8, opacity: 0.8 },
  { r: 95, start: 0, segments: 8, opacity: 0.6 },
  { r: 180, start: 0, segments: 8, opacity: 0.45 },
  { r: 290, start: 0, segments: 8, opacity: 0.35 },
  { r: 420, start: 0, segments: 8, opacity: 0.28 },
];

/** Cuánto se comba cada tramo de anillo hacia el centro (fracción de la distancia). */
const SAG = 0.12;

const round = (n: number) => Math.round(n * 10) / 10;

function pointAt(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + Math.sin(a) * r, y: CENTER.y - Math.cos(a) * r };
}

function ringPath(r: number, start: number, segments: number): string {
  const points = Array.from({ length: segments + 1 }, (_, i) => pointAt(SPOKES[(start + i) % SPOKES.length], r));
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const cx = mx + (CENTER.x - mx) * SAG;
    const cy = my + (CENTER.y - my) * SAG;
    d += ` Q ${round(cx)} ${round(cy)} ${round(b.x)} ${round(b.y)}`;
  }
  return d;
}

// Patas de un lado (el otro es su reflejo).
const LEGS = ['M -4 -6 L -12 -18 L -13 -31', 'M -6 -2 L -20 -7 L -31 -4', 'M -6 3 L -17 8 L -24 22', 'M -4 7 L -10 17 L -11 31'];

function Spider() {
  return (
    <g className="spider" transform={`translate(${CENTER.x} ${CENTER.y})`}>
      <circle className="spider-ring" r="22" fill="none" strokeWidth="2.4" />
      <g className="spider-ink" fill="none" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {LEGS.map((d) => (
          <g key={d}>
            <path d={d} />
            <path d={d} transform="scale(-1 1)" />
          </g>
        ))}
        {/* Abdomen: dos hilos que se cruzan y se cierran en punta, como un nudo. */}
        <path d="M -7 -14 C -6 -2, 7 4, 7 12 C 7 19, 3 23, 0 27 C -3 23, -7 19, -7 12 C -7 4, 6 -2, 7 -14" />
      </g>
      <path className="spider-fill" d="M 0 9 C 3 13, 3 18, 0 22 C -3 18, -3 13, 0 9 Z" />
      {/* Cabeza */}
      <path className="spider-fill" d="M 0 -17 L 3.5 -21.5 L 0 -26 L -3.5 -21.5 Z" />
    </g>
  );
}

export function Threads() {
  return (
    <svg className="hero-deco threads" viewBox="0 0 720 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
      <g className="web" fill="none" stroke="currentColor" strokeLinecap="round">
        {SPOKES.map((angle) => {
          const end = pointAt(angle, SPOKE_LENGTH);
          return (
            <path
              key={angle}
              d={`M ${CENTER.x} ${CENTER.y} L ${round(end.x)} ${round(end.y)}`}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {RINGS.map((ring) => (
          <path
            key={ring.r}
            d={ringPath(ring.r, ring.start, ring.segments)}
            strokeWidth={0.8}
            strokeOpacity={ring.opacity}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <Spider />
    </svg>
  );
}
