import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import type { AppState } from '../engine/types';

/** Lo que tarda en irse solo. Se para mientras el ratón o el foco están encima (WCAG 2.2.1). */
export const TOAST_MS = 5000;

/** Aviso abajo de la pantalla. Con `undo`, ofrece volver a ese estado (el de antes de un borrado o una importación). */
export interface ToastMessage {
  /** Distinto en cada aviso: reinicia la cuenta atrás aunque el texto se repita. */
  id: number;
  text: string;
  undo?: AppState;
  error?: boolean;
}

interface Props {
  message: ToastMessage | null;
  onUndo: () => void;
  onClose: () => void;
}

/**
 * El texto va siempre en una línea. Si no cabe, se recorta con "…" solo el nombre entre «», y lo de
 * alrededor ("Evento", "eliminado.") se ve entero, igual que el dupe al final del nombre («Kafka E2»).
 * El lector de pantalla lee el texto completo.
 */
function ToastText({ text }: { text: string }) {
  const match = /^(.*«)(.+?)((?: E\d)?».*)$/.exec(text);
  if (!match) return <span className="toast-text">{text}</span>;
  return (
    <span className="toast-text">
      <span className="sr-only">{text}</span>
      <span className="toast-fixed" aria-hidden="true">
        {match[1]}
      </span>
      <ToastName name={match[2]} />
      <span className="toast-fixed" aria-hidden="true">
        {match[3]}
      </span>
    </span>
  );
}

/**
 * El nombre, recortado a mano en vez de con text-overflow: así el "…" nunca queda detrás de un espacio
 * ("Permansor …  E1"). Busca el trozo más largo que cabe midiendo el propio span: sin recortar mide lo que
 * deja libre el resto del aviso, y con un texto que cabe, lo que ocupa ese texto.
 */
function ToastName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(name);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const cut = (n: number) => `${name.slice(0, n).trimEnd()}…`;
    const fits = (n: number) => {
      el.textContent = cut(n);
      return el.scrollWidth <= el.clientWidth;
    };
    let lo = 0;
    let hi = name.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (fits(mid)) lo = mid;
      else hi = mid - 1;
    }
    el.textContent = cut(lo);
    setShown(cut(lo));
  }, [name]);
  return (
    <span ref={ref} className="toast-name" aria-hidden="true">
      {shown}
    </span>
  );
}

const reducedMotion = () =>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Toast con fundido de entrada y de salida. La región (role="status") está siempre montada para que los
 * lectores de pantalla anuncien cada aviso nuevo. El estado de pausa y salida va por id: al llegar un aviso
 * nuevo, el anterior no le pasa ni su pausa ni su salida.
 */
export function Toast({ message, onUndo, onClose }: Props) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const id = message?.id ?? null;
  const paused = id !== null && (hoverId === id || focusId === id);
  const leaving = id !== null && leavingId === id;

  const leave = () => {
    if (id === null) return;
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

  // El foco que pasa de un botón a otro del toast no cuenta como salir.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocusId(null);
  };

  return (
    <div className="toast-region" role="status">
      {message && (
        <div
          key={message.id}
          className={`toast${message.error ? ' is-error' : ''}${leaving ? ' is-leaving' : ''}`}
          onPointerEnter={() => setHoverId(message.id)}
          onPointerLeave={() => setHoverId(null)}
          onFocus={() => setFocusId(message.id)}
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
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
