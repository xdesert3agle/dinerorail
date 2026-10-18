export type Obj = Record<string, unknown>;

/** Objeto plano (no null ni array): para validar datos leídos de JSON. */
export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Id único para filas nuevas (tiradas, parches, eventos, fuentes personalizadas): "pull-1760000000000-k3x9a". */
export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
