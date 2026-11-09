import { useEffect, useState } from 'react';

/**
 * La fila recién añadida enfoca su nombre para poder escribir directamente: se guarda su id y, en cuanto aparece
 * entre `ids`, se olvida. Así enfoca una sola vez, y si vuelve a montarse (al deshacer su borrado o al volver a
 * abrir su editor) no se lleva el foco.
 */
export function useFocusNew(ids: readonly string[]) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const shown = focusId !== null && ids.includes(focusId);
  useEffect(() => {
    if (shown) setFocusId(null);
  }, [shown]);
  return [focusId, setFocusId] as const;
}
