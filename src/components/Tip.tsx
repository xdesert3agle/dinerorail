import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { reducedMotion } from './motion';

interface Props {
  /**
   * La explicación: un texto (los saltos de línea se respetan) o contenido con iconos. Si lleva iconos
   * decorativos, que incluya su texto para los lectores de pantalla (.sr-only).
   */
  content: ReactNode;
  /**
   * Con `control`, también una función que recibe el id de la burbuja, para poner la descripción en un control
   * que no es el hijo directo (el input de un interruptor, dentro de su <label>).
   */
  children: ReactNode | ((describedBy: string) => ReactNode);
  /** Elemento que hace de disparador: un div para las casillas de estadísticas, un span para lo demás. */
  as?: 'span' | 'div';
  className?: string;
  /**
   * El disparador es un control con su propio foco (un botón, como único hijo): la burbuja sale al pasar el
   * ratón o al llegar con el teclado, el toque sigue siendo del control y la descripción va en el propio control.
   */
  control?: boolean;
  /**
   * Dónde sale si cabe: debajo (por defecto) o encima, cuando debajo taparía lo que explica (la etiqueta de un
   * selector, con sus opciones justo debajo). Si no cabe, al otro lado.
   */
  side?: 'below' | 'above';
  /**
   * Id de la burbuja, si lo pone quien la usa: un interruptor lo lleva también en su input, como descripción,
   * aunque el disparador sea el término de su etiqueta (ToggleTerm).
   */
  id?: string;
}

/** Margen con los bordes de la ventana y separación con el dato (deja sitio a la flecha). */
const EDGE = 8;
const GAP = 10;
/** La flecha no se acerca más que esto a las esquinas: con el radio mayor (16px) y su media base, en lo recto. */
const ARROW_INSET = 24;
/** Espera al pasar el ratón antes de abrirla (con teclado y al tocar se abre al momento). */
const HOVER_DELAY = 400;
/**
 * Margen al salir del dato con el ratón antes de cerrarla: da tiempo a cruzar el hueco hasta la burbuja, que se
 * puede recorrer (WCAG 1.4.13: quien usa lupa tiene que poder mover el puntero encima para leerla).
 */
const LEAVE_GRACE = 150;

/**
 * Explicación de un dato que se abre en todos los dispositivos (el `title` solo sale con el ratón):
 * - Ratón: al pasar por encima, tras un momento (HOVER_DELAY); sigue abierta con el puntero sobre la burbuja.
 * - Teclado: al enfocar el dato (es enfocable); Esc la cierra.
 * - Táctil: al tocar el dato; se cierra al volver a tocarlo o al tocar fuera.
 * Para los lectores de pantalla el texto es la descripción del dato (aria-describedby), siempre presente.
 * La burbuja va en un portal, fija bajo el dato (o encima si no cabe), para que ninguna tarjeta la recorte.
 */
export function Tip({
  content,
  children,
  as: Tag = 'span',
  className,
  control,
  side = 'below',
  id: givenId,
}: Props) {
  const ownId = useId();
  const id = givenId ?? ownId;
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  // Cerrada pero aún fundiéndose (como el popover de la galería): sigue a la vista hasta que acaba la animación.
  const [leaving, setLeaving] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' });
  // Encima del dato cuando no cabe debajo: la flecha pasa abajo, apuntando hacia él.
  const [above, setAbove] = useState(false);
  // Un toque también enfoca: ese foco no la abre, para que el clic del mismo toque no la cierre enseguida.
  const lastTouch = useRef(0);
  const byTouch = () => Date.now() - lastTouch.current < 800;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) return;
      const r = trigger.getBoundingClientRect();
      const { width, height } = bubble.getBoundingClientRect();
      const left = Math.min(Math.max(EDGE, r.left + r.width / 2 - width / 2), window.innerWidth - width - EDGE);
      const fitsBelow = r.bottom + GAP + height <= window.innerHeight - EDGE;
      const fitsAbove = r.top - GAP - height >= EDGE;
      const below = side === 'above' ? !fitsAbove && fitsBelow : fitsBelow || !fitsAbove;
      // La flecha, bajo el centro del dato aunque la burbuja se haya corrido para caber en la ventana.
      const arrowX = Math.max(ARROW_INSET, Math.min(r.left + r.width / 2 - left, width - ARROW_INSET));
      setPos({
        left,
        top: below ? r.bottom + GAP : Math.max(EDGE, r.top - GAP - height),
        '--arrow-x': `${arrowX}px`,
      } as CSSProperties);
      setAbove(!below);
    };
    place();
    // También si cambia de tamaño mientras está abierta (su contenido se recalcula: la cuenta del balance).
    const resize = new ResizeObserver(place);
    if (bubbleRef.current) resize.observe(bubbleRef.current);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      resize.disconnect();
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, side]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !bubbleRef.current?.contains(target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  // Ya abierta (el ratón encima y luego el foco del clic), no se vuelve a esconder para recolocarla.
  // Con una ref y no con `open`: el retraso del ratón la llama después, con el valor de entonces.
  const openRef = useRef(open);
  openRef.current = open;
  const show = () => {
    if (openRef.current) return;
    setPos({ visibility: 'hidden' });
    setOpen(true);
    setLeaving(false);
  };
  // Con movimiento reducido no hay animación de salida (ni su animationend): se oculta al momento.
  const close = () => {
    if (!openRef.current) return;
    setOpen(false);
    if (!reducedMotion()) setLeaving(true);
  };
  // Con el ratón espera un poco: al cruzar por encima de varios datos no van saltando burbujas.
  const hoverTimer = useRef<number | undefined>(undefined);
  const cancelHover = () => window.clearTimeout(hoverTimer.current);
  // Al salir (del dato o de la burbuja), se cierra tras LEAVE_GRACE salvo que el puntero entre en el otro.
  const leaveTimer = useRef<number | undefined>(undefined);
  const cancelLeave = () => window.clearTimeout(leaveTimer.current);
  const closeSoon = () => {
    cancelLeave();
    leaveTimer.current = window.setTimeout(close, LEAVE_GRACE);
  };
  useEffect(
    () => () => {
      cancelHover();
      cancelLeave();
    },
    [],
  );

  return (
    <>
      <Tag
        ref={(el: HTMLElement | null) => {
          triggerRef.current = el;
        }}
        className={control ? className : className ? `tip-trigger ${className}` : 'tip-trigger'}
        tabIndex={control ? undefined : 0}
        aria-describedby={control ? undefined : id}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') lastTouch.current = Date.now();
        }}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return;
          cancelHover();
          cancelLeave();
          hoverTimer.current = window.setTimeout(show, HOVER_DELAY);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return;
          cancelHover();
          closeSoon();
        }}
        onFocus={(e) => {
          // En un control, el clic del ratón también lo enfoca: solo se abre al llegar con el teclado.
          if (control ? e.target.matches(':focus-visible') : !byTouch()) show();
        }}
        onBlur={close}
        onClick={(e) => {
          // Con el ratón no hace nada (abre el hover): dentro de un <label>, el clic sigue enfocando su campo.
          if (!byTouch()) return;
          // Un control, al tocarlo, cambia como siempre y además se explica (en el móvil no hay hover); se
          // cierra al tocar fuera. Sin preventDefault: el toque sigue siendo del control.
          if (control) {
            show();
            return;
          }
          // Al tocar, abre o cierra; dentro de un <label>, sin enfocar el campo (no saca el teclado).
          e.preventDefault();
          if (open) close();
          else show();
        }}
      >
        {typeof children === 'function'
          ? children(id)
          : control
            ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': id })
            : children}
      </Tag>
      {createPortal(
        <span
          ref={bubbleRef}
          id={id}
          role="tooltip"
          className={`tip${above ? ' tip-above' : ''}${open ? '' : ' is-leaving'}`}
          hidden={!open && !leaving}
          style={pos}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') cancelLeave();
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') closeSoon();
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === 'dupe-pop-out') setLeaving(false);
          }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}

/**
 * Título de una explicación, como una entrada de glosario: el término en la letra de los títulos de tarjeta
 * (corto: la de naipe solo tiene mayúsculas) y la explicación debajo, en texto normal. El punto, solo para los
 * lectores, para que no lo junten con lo que sigue.
 */
export function TipTitle({ children }: { children: ReactNode }) {
  return (
    <span className="tip-title">
      {children}
      <span className="sr-only">. </span>
    </span>
  );
}
