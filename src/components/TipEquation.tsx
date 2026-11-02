import type { ReactNode } from 'react';
import { Icon, type IconKind } from './Icon';

/** Un término de una igualdad: la cantidad con su nombre («26.160 Esquirlas») y el icono del objeto. */
export interface EquationTerm {
  text: string;
  icon: IconKind;
}

/**
 * Una igualdad en una burbuja («20 Cosmiluz🌟 = 1 Pase Especial🎫»), con el icono pegado a cada término. Un
 * término no se parte: la burbuja se ensancha por la igualdad (como por una tabla, ver .tip) y solo en una
 * pantalla que no la cabe salta de línea, antes de un signo. `children`: lo que sigue dentro, como el punto
 * para los lectores de pantalla.
 */
export function TipEquation({
  left,
  right,
  className,
  children,
}: {
  left: EquationTerm;
  right: EquationTerm[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span className={className ? `tip-equation ${className}` : 'tip-equation'}>
      <EquationPart term={left} />
      {right.map((term, i) => (
        <EquationPart key={term.icon} sign={i === 0 ? '=' : '+'} term={term} />
      ))}
      {children}
    </span>
  );
}

/** El signo va con el término que le sigue (fijo: en flex se recortaría el espacio), para que la línea nunca acabe en él. */
function EquationPart({ term, sign }: { term: EquationTerm; sign?: string }) {
  return (
    <span className="with-icon with-icon-tight tip-equation-term">
      {sign ? `${sign} ${term.text}` : term.text}
      <Icon kind={term.icon} size={16} decorative />
    </span>
  );
}
