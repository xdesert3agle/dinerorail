import { useId, type ReactNode } from 'react';
import { TermProvider } from './Tip';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Explicación del interruptor, como una entrada de glosario: la abre el término de la etiqueta marcado con
   * Term, y es la descripción del propio interruptor para los lectores de pantalla. Con `tip`, la etiqueta
   * tiene que llevar un Term: es el que pinta la burbuja con el id al que apunta el input.
   */
  tip?: ReactNode;
  children: ReactNode;
}

interface SwitchInputProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * La pieza del interruptor: el input (role="switch") y la pista que se pinta detrás. Va dentro de un `.switch`;
 * Toggle lo pone con su texto y las fuentes de ingresos, solo (con su nombre en aria-label).
 */
export function SwitchInput({ checked, onChange, ...aria }: SwitchInputProps) {
  return (
    <>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} {...aria} />
      <span aria-hidden="true" />
    </>
  );
}

/** Interruptor con su etiqueta, con el mismo aspecto que los de las fuentes de ingresos. */
export function Toggle({ checked, onChange, tip, children }: Props) {
  const id = useId();
  return (
    <TermProvider tip={tip} id={id}>
      <label className="check toggle">
        <span className="switch">
          <SwitchInput checked={checked} onChange={onChange} aria-describedby={tip ? id : undefined} />
        </span>
        {children}
      </label>
    </TermProvider>
  );
}
