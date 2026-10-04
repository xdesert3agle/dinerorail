import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Texto de ayuda al pasar el ratón. */
  title?: string;
  children: ReactNode;
}

/** Interruptor con su etiqueta, con el mismo aspecto que los de las fuentes de ingresos. */
export function Toggle({ checked, onChange, title, children }: Props) {
  return (
    <label className="check toggle" title={title}>
      <span className="switch">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden="true" />
      </span>
      {children}
    </label>
  );
}
