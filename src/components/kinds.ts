import type { PullKind } from '../engine/types';

export const KIND_LABEL: Record<PullKind, string> = { character: 'Personaje', lightCone: 'Cono de luz' };

/** Clase del icono de cada tipo (silueta de personaje o de cono), para usar con "glyph". */
export const KIND_GLYPH: Record<PullKind, string> = { character: 'glyph-character', lightCone: 'glyph-light-cone' };
