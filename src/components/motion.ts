/** Si el usuario ha pedido reducir el movimiento: las animaciones de salida no corren y su final no llega. */
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
