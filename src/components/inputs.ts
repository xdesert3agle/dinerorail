/**
 * Atributos para los campos de texto libre (nombres, versión): sin corrector ortográfico, sin autocorrección
 * en móvil y sin sugerencias de lo escrito antes en el navegador. La mayúscula inicial automática se deja.
 */
export const PLAIN_TEXT_INPUT = {
  spellCheck: false,
  autoCorrect: 'off',
  autoComplete: 'off',
} as const;
