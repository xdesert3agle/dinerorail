import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { fmtInt } from './format';
import { Icon, type IconKind } from './Icon';
import { TermProvider } from './Tip';

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
  label: ReactNode;
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
  /**
   * Sin flechas de ±1: para las cantidades que van por miles y se escriben (Jades, Esquirlas). Las demás (paquetes,
   * Pases, Cosmiluz, pity, días) las llevan.
   */
  noStepper?: boolean;
  className?: string;
  /**
   * Explicación del campo, como una entrada de glosario (igual que la de un interruptor): la abre el término de la
   * etiqueta, que tiene que ir marcado con Term (la etiqueta entera, si toda ella es el término), y es la
   * descripción del input para los lectores de pantalla. Solo con la etiqueta a la vista.
   */
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
  noStepper,
}: Props) {
  // Entero y dentro del rango: el padre ya no tiene que recortar lo que llega.
  const accept = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Math.trunc(n)));
  const id = useId();
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [overlay, setOverlay] = useState<CSSProperties | null>(null);

  useEffect(() => {
    // Sin foco, el texto sigue al valor (al salir, o si cambia desde fuera, p. ej. al deshacer). Con foco no se
    // toca aunque el padre recorte lo escrito: el recorte se ve al salir, sea cual sea el valor de antes.
    if (!focused) setText((t) => (Number(t) === value && t !== '' ? t : String(value)));
  }, [value, focused]);

  /*
   * Flechas de ±1 propias (las nativas son diminutas y no se dejan dar estilo). Como las nativas: al mantenerlas
   * pulsadas repiten, y no se llevan el foco (con el teclado ya están las flechas, y el lector de pantalla ya
   * anuncia el campo como un número que sube y baja).
   */
  const current = useRef(value);
  const repeat = useRef<number | undefined>(undefined);
  useEffect(() => {
    current.current = value;
  }, [value]);
  const stopRepeat = () => window.clearTimeout(repeat.current);
  useEffect(() => stopRepeat, []);
  const step = (delta: number) => {
    const next = accept(current.current + delta);
    // En el límite, para: el botón se desactiva y ya no recibiría el soltar.
    if (next === current.current) return false;
    current.current = next;
    setText(String(next));
    onChange(next);
    return true;
  };
  const startStep = (delta: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    stopRepeat();
    if (!step(delta)) return;
    // La espera y el ritmo de las nativas: medio segundo y luego seguido.
    const tick = (delay: number) => {
      repeat.current = window.setTimeout(() => {
        if (step(delta)) tick(50);
      }, delay);
    };
    tick(500);
  };

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

  // La descripción de la explicación es su propia burbuja (siempre en el DOM, aunque cerrada), como en los interruptores.
  const infoId = `${id}-info`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [info && infoId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['field', compact && 'field-compact', className].filter(Boolean).join(' ')}>
      {/*
        Con explicación, la abre el término de la etiqueta (punteado, como en la previsión): sin icono (i), cabe en
        una línea. Con el ratón, su clic sigue enfocando el campo; al tocarlo, abre la explicación sin sacar el teclado.
      */}
      <TermProvider tip={info} id={infoId}>
        <label htmlFor={id} className={hideLabel ? 'sr-only' : 'field-label'}>
          {label}
        </label>
      </TermProvider>
      <span className={['input-wrap', icon && 'has-icon', !noStepper && 'has-stepper'].filter(Boolean).join(' ')}>
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
            // Al salir, el efecto de arriba pone el valor real (el recortado, o el que el padre haya dejado).
            setFocused(false);
            // Vacío cuenta como 0 (el padre puede cambiarlo por otro: el pity máximo vuelve al de por defecto).
            if (text === '' || !Number.isFinite(Number(text))) onChange(accept(0));
          }}
        />
        {overlay && (
          <span className="num-mask" style={overlay} aria-hidden="true">
            {fmtInt(value)}
          </span>
        )}
        {!noStepper && (
          // Solo para el ratón (sin foco ni nombre): el teclado y el lector de pantalla ya tienen el campo.
          <span className="stepper" aria-hidden="true">
            {([1, -1] as const).map((delta) => (
              <button
                key={delta}
                type="button"
                tabIndex={-1}
                className="stepper-btn"
                disabled={delta > 0 ? max !== undefined && value >= max : min !== undefined && value <= min}
                onPointerDown={startStep(delta)}
                // El pointerdown cancelado no siempre evita el mousedown, que se llevaría el foco del campo.
                onMouseDown={(e) => e.preventDefault()}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
              >
                <svg width="10" height="6" viewBox="0 0 10 6" focusable="false">
                  <path
                    d={delta > 0 ? 'M1 5l4-4 4 4' : 'M1 1l4 4 4-4'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
            ))}
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
