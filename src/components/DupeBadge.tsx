/** Etiqueta del dupe de una fila ("E1"), junto al nombre: el dupe no forma parte del nombre. Sin dupe, nada. */
export function DupeBadge({ eidolon }: { eidolon: number | null }) {
  if (eidolon === null) return null;
  return (
    <span className="dupe-badge" title={`Eidolón ${eidolon}: copia número ${eidolon + 1} de este personaje`}>
      E{eidolon}
    </span>
  );
}
