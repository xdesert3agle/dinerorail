/**
 * La X de los botones de quitar y cerrar, dibujada en SVG en vez del carácter ✕ (que algunos sistemas
 * pintan como emoji). Sigue al color del texto del botón; el nombre lo pone el botón (aria-label).
 */
export function RemoveGlyph() {
  return (
    <svg className="remove-glyph" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
