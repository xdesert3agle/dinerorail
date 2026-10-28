import { createContext, useContext, useId, type ReactNode } from 'react';
import { Tip } from './Tip';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Explicación del interruptor, como una entrada de glosario: la abre el término de la etiqueta marcado con
   * ToggleTerm, y es la descripción del propio interruptor para los lectores de pantalla.
   */
  tip?: ReactNode;
  children: ReactNode;
}

const TermContext = createContext<{ tip: ReactNode; id: string } | null>(null);

/** Interruptor con su etiqueta, con el mismo aspecto que los de las fuentes de ingresos. */
export function Toggle({ checked, onChange, tip, children }: Props) {
  const id = useId();
  return (
    <TermContext.Provider value={tip ? { tip, id } : null}>
      <label className="check toggle">
        <span className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            aria-describedby={tip ? id : undefined}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span aria-hidden="true" />
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
