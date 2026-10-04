import { useEffect, useState } from 'react';
import { Icon, type IconKind } from './Icon';

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
  /** Texto de ayuda en un icono (i) junto a la etiqueta, visible al pasar el ratón. */
  info?: string;
}

/** Campo numérico que deja el input vacío mientras se escribe sin forzar un 0. */
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
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // Solo se sincroniza cuando el valor cambia desde fuera (p. ej. al importar).
    setText((t) => (Number(t) === value && t !== '' ? t : String(value)));
  }, [value]);

  return (
    <label className={['field', compact && 'field-compact', className].filter(Boolean).join(' ')}>
      <span className={hideLabel ? 'sr-only' : 'field-label'}>
        {label}
        {info && (
          <span className="info" role="img" aria-label={info} title={info} tabIndex={0}>
            i
          </span>
        )}
      </span>
      <span className={icon ? 'input-wrap has-icon' : 'input-wrap'}>
        {icon && <Icon kind={icon} size={compact ? 20 : 24} decorative />}
        <input
          type="number"
          inputMode="numeric"
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
            }
          }}
        />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
