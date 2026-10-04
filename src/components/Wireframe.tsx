/**
 * Decoración del tema Grafito para el fondo de la tarjeta principal: un globo en alambre de líneas finas
 * sobre una cuadrícula que se desvanece, con una única ruta en verde (el color solo en dosis pequeñas).
 *
 * Coordenadas en un lienzo de 720×300 (≈ píxeles de la tarjeta en escritorio), anclado arriba a la derecha.
 */
const CENTER = { x: 590, y: 140 };
const R = 118;

/** Meridianos: longitud en grados (0 = la línea vertical del centro). */
const MERIDIANS = [0, 30, 60];
/** Paralelos: latitud en grados. */
const PARALLELS = [-60, -30, 0, 30, 60];
/** Cuánto se aplastan los paralelos: el globo se ve un poco desde arriba. */
const TILT = 0.18;

const round = (n: number) => Math.round(n * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Punto de la superficie visible a partir de longitud y latitud. */
function surface(lon: number, lat: number) {
  return {
    x: CENTER.x + R * Math.cos(rad(lat)) * Math.sin(rad(lon)),
    y: CENTER.y - R * Math.sin(rad(lat)) + R * Math.cos(rad(lat)) * Math.cos(rad(lon)) * TILT,
  };
}

// La ruta va de un punto a otro del globo y se curva por fuera de él, como un arco de vuelo.
const FROM = surface(-48, -18);
const TO = surface(38, 34);
const LIFT = 0.55;
const mid = { x: (FROM.x + TO.x) / 2, y: (FROM.y + TO.y) / 2 };
const CONTROL = { x: mid.x + (mid.x - CENTER.x) * LIFT - 40, y: mid.y + (mid.y - CENTER.y) * LIFT - 70 };
const ROUTE = `M ${round(FROM.x)} ${round(FROM.y)} Q ${round(CONTROL.x)} ${round(CONTROL.y)} ${round(TO.x)} ${round(TO.y)}`;

export function Wireframe() {
  return (
    <svg className="hero-deco wireframe" viewBox="0 0 720 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
      <defs>
        <pattern id="wireframe-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 H 0 V 16" fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </pattern>
        <radialGradient id="wireframe-fade" cx={CENTER.x} cy={CENTER.y} r="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="wireframe-mask">
          <rect width="720" height="300" fill="url(#wireframe-fade)" />
        </mask>
      </defs>
      <rect className="grid" width="720" height="300" fill="url(#wireframe-grid)" mask="url(#wireframe-mask)" />
      <g className="globe" fill="none" stroke="currentColor" strokeWidth={1}>
        <circle cx={CENTER.x} cy={CENTER.y} r={R} vectorEffect="non-scaling-stroke" />
        {MERIDIANS.map((lon) =>
          lon === 0 ? (
            <line key={lon} x1={CENTER.x} y1={CENTER.y - R} x2={CENTER.x} y2={CENTER.y + R} vectorEffect="non-scaling-stroke" />
          ) : (
            <ellipse key={lon} cx={CENTER.x} cy={CENTER.y} rx={round(R * Math.sin(rad(lon)))} ry={R} vectorEffect="non-scaling-stroke" />
          ),
        )}
        {PARALLELS.map((lat) => {
          const rx = R * Math.cos(rad(lat));
          return (
            <ellipse
              key={lat}
              cx={CENTER.x}
              cy={round(CENTER.y - R * Math.sin(rad(lat)))}
              rx={round(rx)}
              ry={round(rx * TILT)}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
      <g className="route">
        <path d={ROUTE} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {[FROM, TO].map((p) => (
          <g key={`${p.x}-${p.y}`}>
            <circle className="route-halo" cx={round(p.x)} cy={round(p.y)} r="7" fill="currentColor" />
            <circle cx={round(p.x)} cy={round(p.y)} r="3.5" fill="currentColor" />
          </g>
        ))}
      </g>
    </svg>
  );
}
