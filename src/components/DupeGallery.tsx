import { dupeImageUrl, MAX_DUPES, type DupeCount } from '../engine/dupes';

interface Props {
  count: DupeCount | null;
}

// Impares a la izquierda y pares a la derecha, de arriba abajo: 1 | 2, 3 | 4, 5 | 6.
const SIDES = {
  left: Array.from({ length: MAX_DUPES / 2 }, (_, i) => i * 2 + 1),
  right: Array.from({ length: MAX_DUPES / 2 }, (_, i) => i * 2 + 2),
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
            <div key={dupe} className="dupe-slot">
              {dupe <= count.dupes && (
                <img
                  key={`${count.characterId}-${dupe}`}
                  className="dupe-img"
                  src={dupeImageUrl(count.characterId, dupe)}
                  alt=""
                  decoding="async"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
