import type { ReactNode } from 'react';
import { Tip } from './Tip';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Explicación del interruptor (Tip, no `title`): sale al pasar el ratón o al llegar con el teclado, y es la
   * descripción del propio interruptor para los lectores de pantalla.
   */
  tip?: ReactNode;
  children: ReactNode;
}

/** Interruptor con su etiqueta, con el mismo aspecto que los de las fuentes de ingresos. */
export function Toggle({ checked, onChange, tip, children }: Props) {
  const toggle = (describedBy?: string) => (
    <label className="check toggle">
      <span className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span aria-hidden="true" />
      </span>
      {children}
    </label>
  );
  if (!tip) return toggle();
  return (
    // Al tocarlo no se abre: la etiqueta ya dice qué hace, y la burbuja tapaba lo que cambia.
    <Tip control tapExplains={false} className="toggle-tip" content={tip}>
      {(id) => toggle(id)}
    </Tip>
  );
}
