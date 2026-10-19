import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { formatDesc, type Effect } from '../engine/details';
import { dupeImageUrl, lightConeImageUrl, type Dupe } from '../engine/dupes';
import { MAX_SUPERIMPOSITION } from '../engine/rules';
import { prefetchDetails, useDetails, type DetailsRef } from '../state/details';

interface Props {
  /** Dupes de los personajes del plan, hasta 6. */
  dupes: Dupe[];
  /** Ids de los conos del plan, hasta 6. */
  lightCones: string[];
}

/** Inclinación máxima al pasar el ratón, en grados (con el ratón en el borde de la imagen). */
const MAX_TILT = 16;

// La inclinación y el reflejo van en variables CSS del propio elemento, sin estado de React: no re-renderiza al mover el ratón.
const tilt = (e: PointerEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  // 0…1 desde la esquina de arriba a la izquierda.
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  // El lado bajo el ratón se hunde, como una tarjeta que se empuja.
  el.style.setProperty('--tilt-x', `${(-(y - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
  el.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
  // El reflejo del cristal, en el lado contrario: el que se levanta hacia la pantalla y coge la luz.
  el.style.setProperty('--glare-x', `${((1 - x) * 100).toFixed(1)}%`);
  el.style.setProperty('--glare-y', `${((1 - y) * 100).toFixed(1)}%`);
};
// El reflejo se queda donde estaba mientras se apaga (al mismo ritmo que la tarjeta vuelve a su sitio).
const untilt = (e: PointerEvent<HTMLDivElement>) => {
  e.currentTarget.style.removeProperty('--tilt-x');
  e.currentTarget.style.removeProperty('--tilt-y');
};

/** Una imagen de un margen: de quién es y qué copia (Eidolón 1…6 o superposición 1…5). */
interface Item {
  src: string;
  ref: DetailsRef;
  level: number;
}

/** Separación entre el popover y la imagen, y margen mínimo con el borde de la ventana (px). */
const POP_GAP = 12;
const POP_EDGE = 8;

/** El popover de una imagen: qué hace ese Eidolón o el efecto del cono en esa superposición. */
function Popover({ side, item, anchor }: { side: 'left' | 'right'; item: Item; anchor: HTMLElement }) {
  const { details, failed } = useDetails(item.ref);
  const ref = useRef<HTMLDivElement>(null);

  // Al lado de la imagen, hacia el centro de la página (a la derecha de los Eidolones y a la izquierda
  // de los conos), a POP_GAP de ella; centrado en vertical con la imagen sin salirse de la ventana. Se
  // recoloca al cambiar el contenido (al terminar de cargar cambia el tamaño).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Se mide en la esquina, con todo el ancho disponible, antes de colocarlo.
    el.style.left = '0px';
    el.style.top = '0px';
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const slot = anchor.getBoundingClientRect();
    const left = side === 'left' ? slot.right + POP_GAP : slot.left - POP_GAP - w;
    el.style.left = `${Math.max(POP_EDGE, Math.min(left, window.innerWidth - POP_EDGE - w))}px`;
    const top = slot.top + slot.height / 2 - h / 2;
    el.style.top = `${Math.max(POP_EDGE, Math.min(top, window.innerHeight - POP_EDGE - h))}px`;
  }, [side, anchor, details, failed]);

  let owner: string | null = null;
  let effect: Effect | null = null;
  if (details && 'eidolons' in details) {
    owner = details.name;
    effect = details.eidolons[item.level - 1] ?? null;
  } else if (details) {
    owner = details.name;
    effect = { ...details.effect, params: details.levels[item.level - 1] ?? [] };
  }

  return (
    <div ref={ref} className="dupe-pop">
      <div className="dupe-pop-head">
        <span className="dupe-badge">
          {item.ref.kind === 'character' ? 'E' : 'S'}
          {item.level}
        </span>
        {owner && <span className="dupe-pop-owner">{owner}</span>}
      </div>
      {effect ? (
        <>
          <div className="dupe-pop-title">{effect.name}</div>
          {formatDesc(effect.desc, effect.params).map((line, i) => (
            <p key={i} className="dupe-pop-desc">
              {line.map((seg, j) =>
                seg.value ? (
                  <span key={j} className="dupe-pop-value">
                    {seg.text}
                  </span>
                ) : (
                  seg.text
                ),
              )}
            </p>
          ))}
        </>
      ) : (
        <p className="dupe-pop-desc dupe-pop-status">
          {failed ? 'No se ha podido cargar la descripción.' : 'Cargando…'}
        </p>
      )}
    </div>
  );
}

/**
 * Un margen con sus imágenes en orden; el CSS reserva el sitio de las 6. Cada imagen va en una tarjeta
 * que se inclina con el ratón y lleva encima un reflejo de cristal recortado con la propia imagen como
 * máscara. La tarjeta va con la URL como clave: si cambia la de un hueco, vuelve a animar la entrada.
 * Al pasar el ratón sale el popover con lo que hace; va fuera del margen porque el CSS cuenta sus hijos
 * para decidir las columnas.
 */
function Side({ side, items }: { side: 'left' | 'right'; items: Item[] }) {
  const [hover, setHover] = useState<{ index: number; anchor: HTMLElement } | null>(null);
  if (items.length === 0) return null;
  const hovered = hover && items[hover.index];
  return (
    <>
      <div className={`dupes dupes-${side}`} aria-hidden="true">
        {items.map((item, i) => (
          // --dupe-index desfasa la animación de flotar de cada hueco (el lado derecho, medio ciclo más).
          <div key={i} className="dupe-slot" style={{ '--dupe-index': i + (side === 'right' ? 0.5 : 0) } as CSSProperties}>
            <div
              key={item.src}
              className="dupe-card"
              style={{ '--dupe-src': `url("${item.src}")` } as CSSProperties}
              onPointerEnter={(e) => setHover({ index: i, anchor: e.currentTarget.parentElement ?? e.currentTarget })}
              onPointerMove={tilt}
              onPointerLeave={(e) => {
                untilt(e);
                setHover(null);
              }}
            >
              <img className="dupe-img" src={item.src} alt="" decoding="async" draggable={false} />
              <span className="dupe-glare" />
            </div>
          </div>
        ))}
      </div>
      {hovered && <Popover side={side} item={hovered} anchor={hover.anchor} />}
    </>
  );
}

/** Mismo ancho mínimo que el @media de .dupes en styles.css: por debajo, la galería no se ve. */
const GALLERY_MEDIA = '(min-width: 1480px)';

/**
 * En los márgenes de la página: a la izquierda, el arte de los Eidolones de los dupes del plan (de
 * cualquier personaje, a partir de su segunda copia); a la derecha, los conos de luz del plan.
 * Se llenan en orden (los Eidolones por filas y los conos por columnas); ver la disposición en styles.css.
 * Solo se ve en pantallas lo bastante anchas para que haya margen.
 */
export function DupeGallery({ dupes, lightCones }: Props) {
  const left: Item[] = dupes.map((d) => ({
    src: dupeImageUrl(d.characterId, d.eidolon),
    ref: { kind: 'character', id: d.characterId },
    level: d.eidolon,
  }));
  // Cada copia de un cono en el plan sube su superposición (la cuenta no guarda los conos que ya se tienen).
  const right: Item[] = lightCones.map((id, i) => ({
    src: lightConeImageUrl(id),
    ref: { kind: 'lightCone', id },
    level: Math.min(lightCones.slice(0, i + 1).filter((x) => x === id).length, MAX_SUPERIMPOSITION),
  }));

  // Los detalles se descargan de fondo en cuanto la imagen sale en la galería, para que el popover ya
  // los tenga al pasar el ratón; con la galería oculta (ventana estrecha) no se descarga nada.
  const wanted = new Map([...left, ...right].map((it) => [`${it.ref.kind}:${it.ref.id}`, it.ref]));
  const wantedKey = [...wanted.keys()].join(',');
  useEffect(() => {
    if (wanted.size > 0 && window.matchMedia(GALLERY_MEDIA).matches) prefetchDetails([...wanted.values()]);
    // Solo cuando cambia qué personajes y conos hay, no en cada render.
  }, [wantedKey]);

  return (
    <>
      <Side side="left" items={left} />
      <Side side="right" items={right} />
    </>
  );
}
