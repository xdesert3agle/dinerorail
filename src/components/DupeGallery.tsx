import type { CSSProperties, PointerEvent } from 'react';
import { dupeImageUrl, lightConeImageUrl, type Dupe } from '../engine/dupes';

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

/**
 * Un margen con sus imágenes en orden; el CSS reserva el sitio de las 6. Cada imagen va en una tarjeta
 * que se inclina con el ratón y lleva encima un reflejo de cristal recortado con la propia imagen como
 * máscara. La tarjeta va con la URL como clave: si cambia la de un hueco, vuelve a animar la entrada.
 */
function Side({ side, images }: { side: 'left' | 'right'; images: string[] }) {
  if (images.length === 0) return null;
  return (
    <div className={`dupes dupes-${side}`} aria-hidden="true">
      {images.map((src, i) => (
        // --dupe-index desfasa la animación de flotar de cada hueco (el lado derecho, medio ciclo más).
        <div key={i} className="dupe-slot" style={{ '--dupe-index': i + (side === 'right' ? 0.5 : 0) } as CSSProperties}>
          <div
            key={src}
            className="dupe-card"
            style={{ '--dupe-src': `url("${src}")` } as CSSProperties}
            onPointerMove={tilt}
            onPointerLeave={untilt}
          >
            <img className="dupe-img" src={src} alt="" decoding="async" draggable={false} />
            <span className="dupe-glare" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * En los márgenes de la página: a la izquierda, el arte de los Eidolones de los dupes del plan (de
 * cualquier personaje, a partir de su segunda copia); a la derecha, los conos de luz del plan.
 * Se llenan en orden (los Eidolones por filas y los conos por columnas); ver la disposición en styles.css.
 * Solo se ve en pantallas lo bastante anchas para que haya margen.
 */
export function DupeGallery({ dupes, lightCones }: Props) {
  return (
    <>
      <Side side="left" images={dupes.map((d) => dupeImageUrl(d.characterId, d.eidolon))} />
      <Side side="right" images={lightCones.map(lightConeImageUrl)} />
    </>
  );
}
