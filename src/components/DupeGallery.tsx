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

/*
 * Flotar (dupe-float en styles.css): la altura del hueco (--lift, de 0 a 1) sube 3 s y baja 3 s, en bucle;
 * de ella salen la escala de la imagen y sus sombras. Al pasar el ratón, sube desde donde esté hasta arriba
 * del todo y se queda quieta; al salir, el bucle sigue desde arriba, así que baja sola con su propio ritmo y
 * vuelve a flotar. Sin animaciones (reduced motion) no hay bucle y no se hace nada.
 */
const FLOAT_HALF_MS = 3000;
/** Lo que tarda en subir desde abajo del todo (desde más arriba, la parte que le queda). */
const LIFT_MS = 500;

/** Subida en curso (o terminada y quieta arriba) de cada hueco. */
const lifts = new WeakMap<HTMLElement, Animation>();

const floatAnimation = (slot: HTMLElement) =>
  slot.getAnimations().find((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === 'dupe-float');

function liftUp(slot: HTMLElement) {
  const float = floatAnimation(slot);
  if (!float) return;
  float.pause();
  const lift = Number(getComputedStyle(slot).getPropertyValue('--lift')) || 0;
  lifts.get(slot)?.cancel();
  lifts.set(
    slot,
    slot.animate([{ '--lift': lift }, { '--lift': 1 }], {
      duration: Math.max(120, (1 - lift) * LIFT_MS),
      easing: 'ease-out',
      fill: 'forwards',
    }),
  );
}

function settleDown(slot: HTMLElement) {
  const lift = lifts.get(slot);
  if (!lift) return;
  // Cuando ha llegado arriba: el bucle se coloca en su punto más alto (el paso de subir a bajar) y sigue.
  const handOver = () => {
    const float = floatAnimation(slot);
    if (float) {
      // Tiempo dentro del bucle: el retardo negativo de cada hueco (el desfase) ya cuenta como tiempo pasado.
      const timing = float.effect?.getComputedTiming();
      const active = Number(timing?.localTime ?? 0) - (timing?.delay ?? 0);
      const cycle = 2 * FLOAT_HALF_MS;
      const toTop = (((FLOAT_HALF_MS - (active % cycle)) % cycle) + cycle) % cycle;
      float.currentTime = Number(float.currentTime ?? 0) + toTop;
      float.play();
    }
    lift.cancel();
    lifts.delete(slot);
  };
  // Si se vuelve a entrar antes, la subida nueva cancela esta y el relevo no llega a hacerse.
  lift.finished.then(handOver, () => {});
}

/** Una imagen de un margen: de quién es y qué copia (Eidolón 1…6 o superposición 1…5). */
interface Item {
  src: string;
  ref: DetailsRef;
  level: number;
}

/** Separación entre el popover y la imagen (la flecha ocupa unos 12) y margen mínimo con el borde de la ventana (px). */
const POP_GAP = 18;
const POP_EDGE = 8;
/** Lo más cerca que puede ir la flecha de arriba o de abajo del popover, para no caer en las esquinas redondeadas (px). */
const ARROW_INSET = 26;

/** El popover de una imagen: qué hace ese Eidolón o el efecto del cono en esa superposición. */
function Popover({ side, item, anchor }: { side: 'left' | 'right'; item: Item; anchor: HTMLElement }) {
  const { details, failed } = useDetails(item.ref);
  const ref = useRef<HTMLDivElement>(null);

  // Al lado de la imagen, hacia el centro de la página (a la derecha de los Eidolones y a la izquierda
  // de los conos), a POP_GAP de ella; centrado en vertical con la imagen sin salirse de la ventana, con
  // la flecha apuntando al centro de la imagen. Se recoloca al cambiar el contenido (al terminar de
  // cargar cambia el tamaño).
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
    const center = slot.top + slot.height / 2;
    const top = Math.max(POP_EDGE, Math.min(center - h / 2, window.innerHeight - POP_EDGE - h));
    el.style.top = `${top}px`;
    el.style.setProperty('--arrow-y', `${Math.max(ARROW_INSET, Math.min(center - top, h - ARROW_INSET))}px`);
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
    <div ref={ref} className={`dupe-pop dupe-pop-${side}`} aria-hidden="true">
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
          {formatDesc(effect.desc, effect.params, details?.lang).map((line, i) => (
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
          // --dupe-src: la imagen como máscara del reflejo (en la tarjeta) y de las sombras (en el hueco).
          // Las sombras van en el hueco, fuera de .dupe-lift: están en la página, no crecen con la imagen.
          <div
            key={i}
            className="dupe-slot"
            style={{ '--dupe-index': i + (side === 'right' ? 0.5 : 0), '--dupe-src': `url("${item.src}")` } as CSSProperties}
          >
            <span className="dupe-shadow dupe-shadow-contact" />
            <span className="dupe-shadow dupe-shadow-cast" />
            <div className="dupe-lift">
              <div
                key={item.src}
                className="dupe-card"
                onPointerEnter={(e) => {
                  const slot = e.currentTarget.closest<HTMLElement>('.dupe-slot')!;
                  liftUp(slot);
                  setHover({ index: i, anchor: slot });
                }}
                onPointerMove={tilt}
                onPointerLeave={(e) => {
                  untilt(e);
                  settleDown(e.currentTarget.closest<HTMLElement>('.dupe-slot')!);
                  setHover(null);
                }}
              >
                {/*
                  En modo CORS, como la máscara de su sombra (--dupe-src), que el navegador siempre pide así:
                  con el mismo modo, la imagen se descarga una vez y no dos.
                */}
                <img className="dupe-img" src={item.src} alt="" crossOrigin="anonymous" decoding="async" draggable={false} />
                <span className="dupe-glare" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/*
        Con el índice como clave: al pasar rápido de una imagen a la de al lado, salir de una y entrar en
        la otra llegan juntas y el popover no llega a quitarse; así se monta uno nuevo y vuelve a aparecer
        con su fundido.
      */}
      {hovered && <Popover key={hover.index} side={side} item={hovered} anchor={hover.anchor} />}
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
