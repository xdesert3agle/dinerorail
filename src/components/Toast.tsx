import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import type { AppState } from '../engine/types';
import { noticeText, type Notice } from '../state/store';
import { useLayer } from './layer';
import { reducedMotion } from './motion';
import { RemoveGlyph } from './RemoveGlyph';

/**
 * Lo que tarda en irse solo: 10 s, para que dé tiempo a llegar a «Deshacer». Se para mientras el ratón o el foco
 * están encima (WCAG 2.2.1). Se descartó que no se fuera solo (ver docs/decisiones.md).
 */
export const TOAST_MS = 10_000;

/** Aviso abajo de la pantalla. Con `undo`, ofrece volver a ese estado (el de antes de un borrado o de cargar un perfil). */
export interface ToastMessage {
  /** Distinto en cada aviso: reinicia la cuenta atrás aunque el texto se repita. */
  id: number;
  text: Notice;
  undo?: AppState;
}

interface Props {
  message: ToastMessage | null;
  onUndo: () => void;
  onClose: () => void;
}

/**
 * El texto va siempre en una línea. Si no cabe, el CSS recorta con "…" solo el nombre (Notice), y lo de alrededor
 * ("Evento «", "» eliminado.", el dupe de «Kafka E2») se ve entero. El texto sigue entero en la página: el lector,
 * copiar y buscar lo ven completo.
 */
function ToastText({ text }: { text: Notice }) {
  if (typeof text === 'string') return <span className="toast-text">{text}</span>;
  return (
    <span className="toast-text">
      <span className="toast-fixed">{text.before}</span>
      <span className="toast-name">{text.name}</span>
      <span className="toast-fixed">{text.after}</span>
    </span>
  );
}

/**
 * Toast con fundido de entrada y de salida. Dos piezas siempre montadas:
 * - el anuncio (role="status", oculto), con solo el texto del aviso y, si se puede deshacer, «Acciones
 *   disponibles»: si la región viva incluyera los botones, el lector leería también sus nombres;
 * - la región «Avisos», donde se ve el aviso y a la que se puede saltar con el lector.
 * El estado de pausa y salida va por id: al llegar un aviso nuevo, el anterior no le pasa ni su pausa ni su salida.
 * Con un diálogo abierto, las dos pasan dentro de él (layer.ts): borrar un evento en el diálogo también se puede
 * deshacer. Si no, van donde las pone App, tras las pestañas.
 */
export function Toast({ message, onUndo, onClose }: Props) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const layer = useLayer();
  // Dónde estaba el foco antes de entrar en el aviso, para devolverlo al cerrarlo.
  const returnFocus = useRef<HTMLElement | null>(null);
  const id = message?.id ?? null;
  const paused = id !== null && (hoverId === id || focusId === id);
  const leaving = id !== null && leavingId === id;

  const leave = () => {
    if (id === null) return;
    // Con el foco en el aviso, vuelve a donde estaba antes de entrar en él (o al contenido): el aviso se va y,
    // sin esto, el foco caería al <body>.
    if (toastRef.current?.contains(document.activeElement)) {
      const back = returnFocus.current?.isConnected ? returnFocus.current : document.querySelector('main');
      back?.focus({ preventScroll: true });
    }
    // Sin animaciones no llega el final del fundido: se quita directamente.
    if (reducedMotion()) onClose();
    else setLeavingId(id);
  };

  useEffect(() => {
    if (id === null || paused || leaving) return;
    const timer = window.setTimeout(leave, TOAST_MS);
    return () => window.clearTimeout(timer);
    // leave solo depende del id, que ya está en las dependencias.
  }, [id, paused, leaving]);

  // El foco que pasa de un botón a otro del toast no cuenta como entrar ni como salir.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (message) setFocusId(message.id);
    if (!e.currentTarget.contains(e.relatedTarget)) returnFocus.current = e.relatedTarget as HTMLElement | null;
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocusId(null);
  };

  const toast = (
    <>
      <div className="sr-only" role="status">
        {message && (
          <span key={message.id}>
            {noticeText(message.text)}
            {message.undo ? ' Acciones disponibles.' : ''}
          </span>
        )}
      </div>
      <div className="toast-region" role="region" aria-label="Avisos">
        {message && (
          <div
            key={message.id}
            ref={toastRef}
            className={`toast${leaving ? ' is-leaving' : ''}`}
            onPointerEnter={() => setHoverId(message.id)}
            onPointerLeave={() => setHoverId(null)}
            onFocus={onFocus}
            onBlur={onBlur}
            onAnimationEnd={(e) => {
              if (e.animationName === 'toast-out') onClose();
            }}
          >
            <ToastText text={message.text} />
            {message.undo && (
              <button
                type="button"
                className="btn btn-ghost toast-action"
                onClick={() => {
                  onUndo();
                  leave();
                }}
              >
                Deshacer
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-remove" aria-label="Cerrar aviso" onClick={leave}>
              <RemoveGlyph />
            </button>
          </div>
        )}
      </div>
    </>
  );
  return layer === document.body ? toast : createPortal(toast, layer);
}
