import { createContext, useContext, useId, type ReactNode } from 'react';
import { Tip } from './Tip';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Explicación del interruptor, como una entrada de glosario: la abre el término de la etiqueta marcado con
   * ToggleTerm, y es la descripción del propio interruptor para los lectores de pantalla. Con `tip`, la etiqueta
   * tiene que llevar un ToggleTerm: es el que pinta la burbuja con el id al que apunta el input.
   */
  tip?: ReactNode;
  children: ReactNode;
}

const TermContext = createContext<{ tip: ReactNode; id: string } | null>(null);

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
    <TermContext.Provider value={tip ? { tip, id } : null}>
      <label className="check toggle">
        <span className="switch">
          <SwitchInput checked={checked} onChange={onChange} aria-describedby={tip ? id : undefined} />
        </span>
        {children}
      </label>
    </TermContext.Provider>
  );
}

/**
 * El término de la etiqueta que lleva la explicación del interruptor (subrayado de puntos, como las etiquetas de
 * los campos): se abre al pasar el ratón, al llegar con el teclado o al tocarlo, y el toque no cambia el
 * interruptor (el resto de la etiqueta, sí). Un clic con el ratón lo cambia, como en el resto de la etiqueta.
 */
export function ToggleTerm({ children }: { children: ReactNode }) {
  const term = useContext(TermContext);
  if (!term) return children;
  return (
    <Tip id={term.id} className="tip-term" content={term.tip}>
      {children}
    </Tip>
  );
}
