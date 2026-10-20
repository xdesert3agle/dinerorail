import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Texto de la explicación; los saltos de línea se respetan. */
  content: string;
  children: ReactNode;
  /** Elemento que hace de disparador: un div para las casillas de estadísticas, un span para lo demás. */
  as?: 'span' | 'div';
  className?: string;
  /** Nombre accesible del disparador, si su texto no lo dice solo (p. ej. el (i)). */
  label?: string;
}

/** Margen con los bordes de la ventana y separación con el dato. */
const EDGE = 8;
const GAP = 6;

/**
 * Explicación de un dato que se abre en todos los dispositivos (el `title` solo sale con el ratón):
 * - Ratón: al pasar por encima.
 * - Teclado: al enfocar el dato (es enfocable); Esc la cierra.
 * - Táctil: al tocar el dato; se cierra al volver a tocarlo o al tocar fuera.
 * Para los lectores de pantalla el texto es la descripción del dato (aria-describedby), siempre presente.
 * La burbuja va en un portal, fija bajo el dato (o encima si no cabe), para que ninguna tarjeta la recorte.
 */
export function Tip({ content, children, as: Tag = 'span', className, label }: Props) {
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
  }, [open, content]);

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
  const show = () => {
    if (open) return;
    setPos({ visibility: 'hidden' });
    setOpen(true);
  };

  return (
    <>
      <Tag
        ref={(el: HTMLElement | null) => {
          triggerRef.current = el;
        }}
        className={className ? `tip-trigger ${className}` : 'tip-trigger'}
        tabIndex={0}
        aria-label={label}
        aria-describedby={id}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') lastTouch.current = Date.now();
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') show();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setOpen(false);
        }}
        onFocus={() => {
          if (!byTouch()) show();
        }}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // Dentro de un <label> (el (i) de los campos), el clic no debe pasar el foco al campo.
          e.preventDefault();
          if (!byTouch()) return;
          if (open) setOpen(false);
          else show();
        }}
      >
        {children}
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
