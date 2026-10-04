/**
 * Decoración del tema Aha (Exultación) para el fondo de la tarjeta principal:
 * un foco rojo (SVG) detrás de la ilustración del personaje. El motivo de naipes va en el fondo de la página.
 *
 * El foco usa el mismo lienzo que la telaraña de Kafka (720×300, anclado arriba a la derecha).
 */
import nihilux from '../assets/aha/nihilux.webp';

const CENTER = { x: 590, y: 115 };

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
        <circle cx={CENTER.x} cy={CENTER.y - 10} r="150" fill="url(#aha-spotlight)" />
      </svg>
      {/* Ilustración con el fondo blanco quitado (transparente); decorativa. */}
      <img className="hero-art" src={nihilux} alt="" aria-hidden="true" draggable={false} />
    </>
  );
}
