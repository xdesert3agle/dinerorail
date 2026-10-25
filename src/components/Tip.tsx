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

interface Props {
  /**
   * La explicación: un texto (los saltos de línea se respetan) o contenido con iconos. Si lleva iconos
   * decorativos, que incluya su texto para los lectores de pantalla (.sr-only).
   */
  content: ReactNode;
  children: ReactNode;
  /** Elemento que hace de disparador: un div para las casillas de estadísticas, un span para lo demás. */
  as?: 'span' | 'div';
  className?: string;
  /**
   * El disparador es un control con su propio foco (un botón, como único hijo): la burbuja sale al pasar el
   * ratón o al llegar con el teclado, el toque sigue siendo del control y la descripción va en el propio control.
   */
  control?: boolean;
}

/** Margen con los bordes de la ventana y separación con el dato. */
const EDGE = 8;
const GAP = 6;
/** Espera al pasar el ratón antes de abrirla (con teclado y al tocar se abre al momento). */
const HOVER_DELAY = 400;

/**
 * Explicación de un dato que se abre en todos los dispositivos (el `title` solo sale con el ratón):
 * - Ratón: al pasar por encima, tras un momento (HOVER_DELAY).
 * - Teclado: al enfocar el dato (es enfocable); Esc la cierra.
 * - Táctil: al tocar el dato; se cierra al volver a tocarlo o al tocar fuera.
 * Para los lectores de pantalla el texto es la descripción del dato (aria-describedby), siempre presente.
 * La burbuja va en un portal, fija bajo el dato (o encima si no cabe), para que ninguna tarjeta la recorte.
 */
export function Tip({ content, children, as: Tag = 'span', className, control }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' });
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
      const below = r.bottom + GAP + height <= window.innerHeight - EDGE;
      setPos({ left, top: below ? r.bottom + GAP : Math.max(EDGE, r.top - GAP - height) });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
    // Se recoloca si cambia el texto; con iconos (un elemento nuevo en cada render) se quedaría en bucle.
  }, [open, typeof content === 'string' ? content : null]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
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
  };
  // Con el ratón espera un poco: al cruzar por encima de varios datos no van saltando burbujas.
  const hoverTimer = useRef<number | undefined>(undefined);
  const cancelHover = () => window.clearTimeout(hoverTimer.current);
  useEffect(() => cancelHover, []);

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
          hoverTimer.current = window.setTimeout(show, HOVER_DELAY);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return;
          cancelHover();
          setOpen(false);
        }}
        onFocus={(e) => {
          // En un control, el clic del ratón también lo enfoca: solo se abre al llegar con el teclado.
          if (control ? e.target.matches(':focus-visible') : !byTouch()) show();
        }}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // Con el ratón no hace nada (abre el hover): dentro de un <label>, el clic sigue enfocando su campo.
          if (control || !byTouch()) return;
          // Al tocar, abre o cierra; dentro de un <label>, sin enfocar el campo (no saca el teclado).
          e.preventDefault();
          if (open) setOpen(false);
          else show();
        }}
      >
        {control ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': id }) : children}
      </Tag>
      {createPortal(
        <span ref={bubbleRef} id={id} role="tooltip" className="tip" hidden={!open} style={pos}>
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}
