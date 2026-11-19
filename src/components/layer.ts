import { useSyncExternalStore } from 'react';

/*
 * Dónde se pintan las piezas flotantes (burbujas, calendario, aviso de deshacer, avisos para lectores de
 * pantalla): en <body> o, con un diálogo modal abierto, dentro de él. Un modal deja inerte y por debajo todo lo
 * que queda fuera de él, así que lo que flota fuera no se vería ni se podría usar, y los lectores no anunciarían
 * sus avisos. Solo hay un modal a la vez (EditDialog).
 */

let modal: HTMLElement | null = null;
const listeners = new Set<() => void>();

/** El modal abierto, o null. Lo llama EditDialog al abrirse y al cerrarse. */
export function setModalLayer(el: HTMLElement | null) {
  modal = el;
  listeners.forEach((listener) => listener());
}

/** El modal abierto, o null (sin modal, cada pieza usa su sitio de siempre). */
export const modalLayer = () => modal;

const layer = () => modal ?? document.body;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Dónde poner un portal: el modal abierto o <body>. Cambia (y vuelve a pintar) al abrirse o cerrarse. */
export function useLayer() {
  return useSyncExternalStore(subscribe, layer);
}
