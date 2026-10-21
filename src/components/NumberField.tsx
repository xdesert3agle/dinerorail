import { useEffect, useId, useState, type ReactNode } from 'react';
import { Icon, type IconKind } from './Icon';
import { Tip } from './Tip';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  compact?: boolean;
  /** Oculta la etiqueta visualmente (sigue disponible para lectores de pantalla). */
  hideLabel?: boolean;
  /** Icono dentro del campo, a la izquierda. */
  icon?: IconKind;
  className?: string;
  /** Texto de ayuda de la etiqueta (punteada): sale al pasar el ratón, al enfocarla o al tocarla. */
  info?: ReactNode;
}

/**
 * Campo numérico que deja el input vacío mientras se escribe sin forzar un 0. Al salir del campo vuelve a
 * mostrar el valor de verdad: si el padre lo ha recortado (un Eidolón 9 que queda en 6), se ve el 6.
 * La ayuda de la etiqueta y la pista van también como descripción del campo (aria-describedby), no en su nombre.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
  compact,
  hideLabel,
  icon,
  className,
  info,
}: Props) {
  const id = useId();
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // Solo se sincroniza cuando el valor cambia desde fuera (p. ej. al importar).
    setText((t) => (Number(t) === value && t !== '' ? t : String(value)));
  }, [value]);

  const infoId = info ? `${id}-info` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [infoId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['field', compact && 'field-compact', className].filter(Boolean).join(' ')}>
      {/*
        Con ayuda, la propia etiqueta la explica (punteada, como en la previsión): sin icono (i), cabe en una línea.
        Con el ratón, su clic sigue enfocando el campo; al tocarla, abre la explicación sin sacar el teclado.
      */}
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'field-label'}>
        {info && !hideLabel ? (
          <Tip className="tip-term" content={info}>
            {label}
          </Tip>
        ) : (
          label
        )}
      </label>
      {info && (
        <span id={infoId} className="sr-only">
          {info}
        </span>
      )}
      <span className={icon ? 'input-wrap has-icon' : 'input-wrap'}>
        {icon && <Icon kind={icon} size={compact ? 20 : 24} decorative />}
        <input
          id={id}
          type="number"
          // El teclado numérico de iOS no tiene signo menos: solo cuando no se admiten negativos.
          inputMode={min !== undefined && min >= 0 ? 'numeric' : undefined}
          autoComplete="off"
          aria-describedby={describedBy}
          value={text}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => {
            if (text === '' || !Number.isFinite(Number(text))) {
              setText('0');
              onChange(0);
            } else {
              setText(String(value));
            }
          }}
        />
      </span>
      {hint && (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
