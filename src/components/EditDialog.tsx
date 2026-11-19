import { useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { setModalLayer } from './layer';
import { reducedMotion } from './motion';
import { RemoveGlyph } from './RemoveGlyph';

/**
 * Edición de un elemento de una lista (una fuente de ingresos, una versión) en un diálogo modal: la tarjeta
 * siempre se lee y el diálogo siempre se edita. Uno abierto a la vez; «Editar» lo abre y, al cerrarlo, el foco
 * vuelve a ese «Editar».
 */
export function useEditDialog() {
  const [openId, setOpenId] = useState<string | null>(null);
  const editButtons = useRef(new Map<string, HTMLButtonElement>());

  /** Lo que lleva el «Editar» de cada elemento; `label` lo nombra entero («Editar la versión 4.7»). */
  const editButton = (id: string, label: string) => ({
    ref: (el: HTMLButtonElement | null) => {
      if (el) editButtons.current.set(id, el);
      else editButtons.current.delete(id);
    },
    type: 'button' as const,
    className: 'btn btn-ghost',
    'aria-haspopup': 'dialog' as const,
    'aria-label': label,
    onClick: () => setOpenId(id),
  });

  /** Cierra el diálogo y devuelve el foco al «Editar» de lo editado (también si se acaba de crear). */
  const done = () => {
    const id = openId;
    flushSync(() => setOpenId(null));
    if (id) editButtons.current.get(id)?.focus();
  };

  /** El botón de añadir de la cabecera de la tarjeta («+ Versión», «+ Fuente personalizada»). */
  const addButton = useRef<HTMLButtonElement>(null);
  /**
   * Eliminar lo editado: primero se cierra el diálogo, así el aviso de deshacer que deja `commit` sale ya fuera
   * de él; luego el foco pasa al botón de añadir, porque el «Editar» de lo eliminado desaparece con ello.
   */
  const removed = (commit: () => void) => {
    flushSync(() => setOpenId(null));
    commit();
    addButton.current?.focus();
  };

  return { openId, open: setOpenId, editButton, done, addButton, removed };
}

interface Props {
  /** Lo que se edita, en la cabecera del diálogo y como su nombre accesible: «Versión 4.7», el de la fuente. */
  title: ReactNode;
  /**
   * Lo recién añadido: el foco empieza en su primer campo, que es lo primero que hay que escribir. Si no, en el
   * diálogo: el tabulador sigue por el primer campo, y en el móvil no se abre el teclado.
   */
  focusFirstField?: boolean;
  /** Ancho para filas de varias columnas (los eventos de una versión); sin él, para unos pocos campos (una fuente). */
  wide?: boolean;
  /** «Eliminar …», a la izquierda del pie. Sin él, lo editado no se puede eliminar (una fuente del juego). */
  remove?: { label: string; onClick: () => void };
  onDone: () => void;
  children: ReactNode;
}

/** Si el clic cae en el fondo del modal: en el propio <dialog>, pero fuera de su caja. */
const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
  if (e.target !== e.currentTarget) return false;
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

/**
 * El diálogo: una tarjeta sobre el resto de la página, con lo editado en la cabecera junto a la X de cerrar, los
 * campos y, al pie, sus acciones, como en un formulario: lo destructivo a la izquierda, sin borde, y la salida a la
 * derecha. Los cambios se guardan al escribir: «Terminar edición», la X, Esc o un clic fuera solo cierran.
 * «Terminar edición» repite la salida de la X a propósito: dice que lo escrito se queda, y una X sola podría
 * leerse como «cancelar». Va en <body> (el estilo de la tarjeta de la que sale no le llega) y, abierto, es la capa
 * de las piezas flotantes (layer.ts).
 */
export function EditDialog({ title, focusFirstField = false, wide = false, remove, onDone, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // El clic de fuera cuenta si también empezó fuera: soltar fuera un arrastre (una fila, una selección de texto)
  // da un clic en el <dialog>, y no debe cerrarlo.
  const pressedBackdrop = useRef(false);
  /*
   * El contenido se monta con el diálogo ya abierto: cerrado no tiene caja, y lo que se mide al montarse (la cifra
   * con punto de miles de NumberField) saldría a cero; el calendario de DateField, además, se crea ya dentro de un
   * modal. Va todo antes de pintar, así que no se ve el diálogo vacío.
   */
  const [shown, setShown] = useState(false);
  // Lo recién añadido se sabe al montar: cuando el contenido aparece, quien lo marcaba (useFocusNew) ya lo ha olvidado.
  const focusFirst = useRef(focusFirstField);
  /*
   * Al cerrarse (cualquier salida, también «Eliminar …»), primero se funde con su velo y, al acabar, hace lo que
   * toca: cerrar (`onDone`) o eliminar. Mientras se funde no reacciona a más clics. Sin animaciones, al momento.
   */
  const afterLeave = useRef<(() => void) | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leave = (then: () => void) => {
    if (afterLeave.current) return;
    if (reducedMotion()) return then();
    afterLeave.current = then;
    setLeaving(true);
  };
  const close = () => leave(onDone);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    setModalLayer(dialog);
    setShown(true);
    return () => {
      setModalLayer(null);
      dialog.close();
    };
  }, []);

  useLayoutEffect(() => {
    if (!shown) return;
    const dialog = ref.current;
    const first = focusFirst.current ? dialog?.querySelector<HTMLElement>('input, select') : null;
    (first ?? dialog)?.focus();
  }, [shown]);

  return createPortal(
    <dialog
      ref={ref}
      className={`card edit-dialog${wide ? ' edit-dialog-wide' : ''}${leaving ? ' is-leaving' : ''}`}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={(e) => {
        // Esc: lo cierra React, que es quien sabe que está abierto (y devuelve el foco a «Editar»).
        e.preventDefault();
        close();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = onBackdrop(e);
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && onBackdrop(e)) close();
      }}
      onAnimationEnd={(e) => {
        // La del propio diálogo (la del velo acaba a la vez).
        if (e.animationName === 'dialog-out' && !e.pseudoElement) afterLeave.current?.();
      }}
    >
      {shown && (
        <>
          <header className="card-header">
            <h2 id={titleId}>{title}</h2>
            {/* Como la del aviso; en Sparxie es la caja de cierre de la ventana. */}
            <button
              type="button"
              className="btn btn-ghost btn-remove edit-dialog-close"
              aria-label="Cerrar"
              onClick={close}
            >
              <RemoveGlyph />
            </button>
          </header>
          <div className="edit-dialog-body">{children}</div>
          <div className="edit-dialog-footer">
            {remove && (
              <button type="button" className="btn btn-ghost btn-danger" onClick={() => leave(remove.onClick)}>
                {remove.label}
              </button>
            )}
            <button type="button" className="btn" onClick={close}>
              Terminar edición
            </button>
          </div>
        </>
      )}
    </dialog>,
    document.body,
  );
}
