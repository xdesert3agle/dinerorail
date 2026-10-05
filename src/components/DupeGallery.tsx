import type { CSSProperties, PointerEvent } from 'react';
import { dupeImageUrl, MAX_DUPES, type DupeCount } from '../engine/dupes';

interface Props {
  count: DupeCount | null;
}

// Impares a la izquierda y pares a la derecha, de arriba abajo: 1 | 2, 3 | 4, 5 | 6.
const SIDES = {
  left: Array.from({ length: MAX_DUPES / 2 }, (_, i) => i * 2 + 1),
  right: Array.from({ length: MAX_DUPES / 2 }, (_, i) => i * 2 + 2),
};

/** Inclinación máxima al pasar el ratón, en grados (con el ratón en el borde de la imagen). */
const MAX_TILT = 9;

// La inclinación va en variables CSS del propio elemento, sin estado de React: no re-renderiza al mover el ratón.
const tilt = (e: PointerEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  // -0,5…0,5 desde el centro de la imagen.
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  // El lado bajo el ratón se hunde, como una tarjeta que se empuja.
  el.style.setProperty('--tilt-x', `${(-y * 2 * MAX_TILT).toFixed(2)}deg`);
  el.style.setProperty('--tilt-y', `${(x * 2 * MAX_TILT).toFixed(2)}deg`);
};
const untilt = (e: PointerEvent<HTMLImageElement>) => {
  e.currentTarget.style.removeProperty('--tilt-x');
  e.currentTarget.style.removeProperty('--tilt-y');
};

/**
 * Arte de los Eidolones del primer personaje del plan, en los márgenes de la página.
 * Cada hueco tiene su sitio fijo y solo se llena cuando el plan llega a ese dupe.
 * Solo se ve en pantallas lo bastante anchas para que haya margen.
 */
export function DupeGallery({ count }: Props) {
  if (!count || count.dupes === 0) return null;
  return (
    <>
      {(Object.keys(SIDES) as (keyof typeof SIDES)[]).map((side) => (
        <div key={side} className={`dupes dupes-${side}`} aria-hidden="true">
          {SIDES[side].map((dupe) => (
            // --dupe-index desfasa la animación de flotar de cada hueco.
            <div key={dupe} className="dupe-slot" style={{ '--dupe-index': dupe } as CSSProperties}>
              {dupe <= count.dupes && (
                <img
                  key={`${count.characterId}-${dupe}`}
                  className="dupe-img"
                  src={dupeImageUrl(count.characterId, dupe)}
                  alt=""
                  decoding="async"
                  draggable={false}
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
