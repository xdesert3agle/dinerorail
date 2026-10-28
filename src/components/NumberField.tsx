import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { fmtInt } from './format';
import { Icon, type IconKind } from './Icon';
import { Tip } from './Tip';

/** Lo que la capa de la cifra con puntos copia del input para que su texto caiga en el mismo sitio. */
const OVERLAY_PROPS = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'letterSpacing',
] as const;

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
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
 * Campo numérico de enteros (todos los de la app son cantidades) que deja el input vacío mientras se escribe sin
 * forzar un 0. Lo que entrega ya va recortado a min/max y sin decimales; al salir del campo vuelve a mostrar el
 * valor de verdad (escrito 120 con máximo 99, se ve el 99).
 * La ayuda de la etiqueta y la pista van también como descripción del campo (aria-describedby), no en su nombre.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  compact,
  hideLabel,
  icon,
  className,
  info,
}: Props) {
  // Entero y dentro del rango: el padre ya no tiene que recortar lo que llega.
  const accept = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Math.trunc(n)));
  const id = useId();
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [overlay, setOverlay] = useState<CSSProperties | null>(null);

  useEffect(() => {
    // Solo se sincroniza cuando el valor cambia desde fuera (p. ej. al deshacer).
    setText((t) => (Number(t) === value && t !== '' ? t : String(value)));
  }, [value]);

  /*
   * Sin foco, las cifras de 4 o más llevan su punto de miles («12.480», como el resto de la app). Un input
   * numérico no puede mostrarlo, así que una capa encima pinta la cifra formateada y el texto del input queda
   * transparente (como el nombre del planificador). Con el foco se ve y se escribe el número tal cual.
   * La capa copia la caja y el relleno del input: así cae en el mismo sitio con icono, compacto o a la derecha.
   */
  const masked = !focused && Number.isInteger(value) && Math.abs(value) >= 1000 && Number(text) === value;
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!masked || !input) {
      setOverlay(null);
      return;
    }
    const place = () => {
      const cs = getComputedStyle(input);
      const style: Record<string, string | number> = {
        left: input.offsetLeft,
        top: input.offsetTop,
        width: input.offsetWidth,
        height: input.offsetHeight,
      };
      for (const p of OVERLAY_PROPS) style[p] = cs[p];
      // Alineado como el input, pero con flex: si la cifra con punto no cabe (Courier en los Jades de un evento),
      // sobra por el lado del inicio y su final sigue donde el del número crudo, en vez de salirse por la derecha.
      style.justifyContent = cs.textAlign === 'right' || cs.textAlign === 'end' ? 'flex-end' : cs.textAlign === 'center' ? 'center' : 'flex-start';
      setOverlay(style as CSSProperties);
    };
    place();
    // Los rellenos cambian con el ancho de pantalla (filas que se parten en el móvil), y la letra con el tema,
    // que App pone en <html> después del primer pintado (data-skin, data-theme).
    window.addEventListener('resize', place);
    const themeWatch = new MutationObserver(place);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin', 'data-theme'] });
    return () => {
      window.removeEventListener('resize', place);
      themeWatch.disconnect();
    };
  }, [masked]);

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
          ref={inputRef}
          id={id}
          type="number"
          className={overlay ? 'is-masked' : undefined}
          onFocus={() => setFocused(true)}
          // El teclado numérico de iOS no tiene signo menos: solo cuando no se admiten negativos.
          inputMode={min !== undefined && min >= 0 ? 'numeric' : undefined}
          autoComplete="off"
          aria-describedby={describedBy}
          value={text}
          min={min}
          max={max}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(n)) onChange(accept(n));
          }}
          onBlur={() => {
            setFocused(false);
            if (text === '' || !Number.isFinite(Number(text))) {
              const zero = accept(0);
              setText(String(zero));
              onChange(zero);
            } else {
              setText(String(value));
            }
          }}
        />
        {overlay && (
          <span className="num-mask" style={overlay} aria-hidden="true">
            {fmtInt(value)}
          </span>
        )}
      </span>
      {hint && (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
