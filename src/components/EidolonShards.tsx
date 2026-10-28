type Point = [number, number];

/*
 * Los seis Eidolones como trozos de cristal roto, a la manera de la ficha de Eidolones del juego: cada uno con su
 * forma irregular (aristas de distinta longitud y una punta aguda), su sitio y su inclinación. Formas de pie en
 * una caja de unos 12 × 24, centradas en su punto.
 */
const SHAPES: Point[][] = [
  [[-3, -12], [3, -9.5], [6, -1], [1.5, 12], [-6, 2]],
  [[-6, -8], [4, -12], [6, 0.5], [-1, 12], [-4, 4.5]],
  [[1, -12], [6, -2], [3, 8], [-2, 12], [-6, -1]],
  [[-5, -11], [5.5, -12], [4, -2.5], [0, 12], [-6, 2.5]],
  [[-6, -9.5], [0, -12], [6, -5], [3, 12], [-3.5, 4]],
  [[-1, -12], [6, -4.5], [1, 12], [-5.5, 6], [-4, -6]],
];
/** Centro de cada cristal dentro del grupo (en zigzag) y su inclinación en grados. */
const PLACES: [number, number, number][] = [
  [11, 24, -20],
  [33, 14, 15],
  [55, 25, -5],
  [78, 15, 25],
  [101, 25, -15],
  [124, 14, 10],
];
/** Grosor del cristal: el canto asoma abajo a la derecha (la luz viene de arriba a la izquierda en todos). */
const THICKNESS: Point = [1.3, 2];
/** Caja del dibujo de cada cristal, centrada en él (algo más que el cristal girado). */
const BOX: Point = [22, 28];
/** Ancho de todo el grupo (el del CSS, --shards-w en .account-list). */
const WIDTH = 135;

const toPoints = (points: Point[]) => points.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' ');

/**
 * La cara de arriba de cada cristal (ya girado) y los cantos que se ven: las caras laterales cuyas aristas
 * miran hacia donde cae el grosor. Se calcula una vez; la inclinación va en los puntos y no en un transform,
 * para que el grosor caiga hacia el mismo lado en todos.
 */
const SHARDS = SHAPES.map((shape, i) => {
  const [x, y, rotation] = PLACES[i];
  const a = (rotation * Math.PI) / 180;
  const top: Point[] = shape.map(([px, py]) => [px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)]);
  const low: Point[] = top.map(([px, py]) => [px + THICKNESS[0], py + THICKNESS[1]]);
  // Con el área con signo se sabe el sentido del polígono y, con él, hacia fuera de qué lado mira cada arista.
  const area = top.reduce((sum, [x1, y1], k) => {
    const [x2, y2] = top[(k + 1) % top.length];
    return sum + x1 * y2 - x2 * y1;
  }, 0);
  const sides = top.flatMap(([x1, y1], k) => {
    const next = (k + 1) % top.length;
    const [x2, y2] = top[next];
    const [nx, ny] = area > 0 ? [y2 - y1, x1 - x2] : [y1 - y2, x2 - x1];
    return nx * THICKNESS[0] + ny * THICKNESS[1] > 0 ? [toPoints([top[k], top[next], low[next], low[k]])] : [];
  });
  /*
   * El botón es toda la columna del cristal, con el alto entero del grupo: el ratón no lo pierde al bajar o
   * subir por el zigzag. Las columnas se tocan a medio camino entre un cristal y el siguiente, sin huecos.
   */
  const start = i === 0 ? 0 : (PLACES[i - 1][0] + x) / 2;
  const end = i === PLACES.length - 1 ? WIDTH : (x + PLACES[i + 1][0]) / 2;
  return {
    column: { left: start, width: end - start },
    art: { left: x - BOX[0] / 2 - start, top: y - BOX[1] / 2 },
    face: toPoints(top),
    sides,
  };
});

interface Props {
  /** Nombre del personaje, para los lectores de pantalla. */
  name: string;
  /** Eidolón que se tiene, o null si no se tiene el personaje. */
  eidolon: number | null;
  onChange: (eidolon: number) => void;
}

/**
 * Los seis Eidolones de un personaje, rellenos hasta el que se tiene. Pulsar uno marca hasta él (y marca el
 * personaje); pulsar el último relleno lo baja uno. Sin tenerlo, en contorno apagado; en E0, en contorno claro.
 */
export function EidolonShards({ name, eidolon, onChange }: Props) {
  return (
    <span className="eidolon-shards" role="group" aria-label={`Eidolones de ${name}`}>
      {SHARDS.map((s, i) => {
        const n = i + 1;
        const lit = eidolon !== null && eidolon >= n;
        return (
          <button
            key={n}
            type="button"
            className="eidolon-shard"
            style={s.column}
            aria-label={`E${n}`}
            aria-pressed={lit}
            onClick={() => onChange(eidolon === n ? n - 1 : n)}
          >
            <svg
              viewBox={`${-BOX[0] / 2} ${-BOX[1] / 2} ${BOX[0]} ${BOX[1]}`}
              width={BOX[0]}
              height={BOX[1]}
              style={s.art}
              aria-hidden="true"
            >
              {s.sides.map((side) => (
                <polygon key={side} className="shard-side" points={side} />
              ))}
              <polygon className="shard-face" points={s.face} />
            </svg>
          </button>
        );
      })}
    </span>
  );
}
