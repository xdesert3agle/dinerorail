import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type Modifiers,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useLayer } from './layer';
import { reducedMotion } from './motion';

/*
 * Filas que se reordenan arrastrando su asa (o con su menú «Subir / Bajar», sin arrastrar) y que se deshacen en
 * polvo al quitarlas: las del plan y las de los eventos. La fila lleva la clase .sortable-row (ver styles.css) y
 * lo que le da useSortableRow.
 */

/** Cuánto dura el polvo de una fila quitada y hasta dónde se dispersan sus píxeles (px del desplazamiento). */
const DUST_MS = 600;
const DUST_SCALE = 70;

/** Cómo encaja una fila desplazada en su nuevo hueco al reordenar: rápida y con un rebote leve al llegar. */
const SNAP_TRANSITION = { duration: 180, easing: 'cubic-bezier(0.3, 1.35, 0.5, 1)' };

/** Lleva la fila `activeId` al puesto de `overId`, como la deja dnd-kit al soltar; igual si falta alguna. */
export function moveById<T extends { id: string }>(list: T[], activeId: string, overId: string): T[] {
  const from = list.findIndex((x) => x.id === activeId);
  const to = list.findIndex((x) => x.id === overId);
  return from < 0 || to < 0 ? list : arrayMove(list, from, to);
}

/**
 * Quitar filas con el polvo: cada una se marca como «saliendo» durante DUST_MS y luego se llama a su `commit`;
 * sin animación si se pide menos movimiento. Una que ya se está yendo no se quita dos veces (un segundo Intro
 * sobre su ✕, que sigue con el foco).
 * Si el foco sigue en la fila al quitarla, pasa a la ✕ de la siguiente (o de la anterior, si era la última) y,
 * sin más filas, a lo que dé `fallback` (el botón de añadir): si no, caería al <body>.
 */
export function useDustRemoval() {
  const [leaving, setLeaving] = useState<string[]>([]);
  const removeLater = (id: string, commit: () => void, fallback?: (row: HTMLElement) => HTMLElement | null) => {
    const finish = () => {
      const row = document.querySelector<HTMLElement>(`[data-sortable-row="${window.CSS.escape(id)}"]`);
      const next = row?.contains(document.activeElement) ? focusAfterRemoval(row, fallback) : null;
      commit();
      next?.focus();
    };
    if (reducedMotion()) return finish();
    if (leaving.includes(id)) return;
    setLeaving((l) => [...l, id]);
    window.setTimeout(() => {
      finish();
      setLeaving((l) => l.filter((x) => x !== id));
    }, DUST_MS);
  };
  return { leaving, removeLater };
}

/** Dónde poner el foco al quitar `row`: la ✕ de la fila de al lado que se queda, o `fallback`. */
function focusAfterRemoval(row: HTMLElement, fallback?: (row: HTMLElement) => HTMLElement | null) {
  const stays = (el: Element) => el instanceof HTMLElement && !!el.dataset.sortableRow && !el.classList.contains('is-leaving');
  for (const step of ['nextElementSibling', 'previousElementSibling'] as const) {
    let el = row[step];
    while (el && !stays(el)) el = el[step];
    const remove = el?.querySelector<HTMLElement>('.btn-remove');
    if (remove) return remove;
  }
  return fallback?.(row) ?? null;
}

/** El menú «Subir / Bajar» de las asas de una lista: cuál está abierto y cómo mover una fila un puesto. */
interface MoveMenuApi {
  openId: string | null;
  close: () => void;
  canMove: (id: string, step: -1 | 1) => boolean;
  move: (id: string, step: -1 | 1) => void;
}

const MoveMenuContext = createContext<MoveMenuApi | null>(null);

interface ListProps {
  /** Las filas, en orden, con el nombre que leen los avisos para lectores de pantalla. */
  items: { id: string; name: string }[];
  /** Hasta dónde se puede llevar la fila arrastrada. */
  modifiers: Modifiers;
  onMove: (activeId: string, overId: string) => void;
  children: ReactNode;
}

/** La lista que se reordena: las filas (con useSortableRow) van dentro, en el orden de `items`. */
export function SortableList({ items, modifiers, onMove, children }: ListProps) {
  const sensors = useSensors(
    // Sin margen: la fila se coge (y flota) nada más pulsar el asa, sin esperar a moverla. El asa no tiene
    // acción de clic, y soltar sin moverse deja el orden igual.
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // El menú «Subir / Bajar»: la alternativa a arrastrar con un solo toque (WCAG 2.5.7). Lo abre un toque en el asa
  // que no la mueve (ver onDragEnd); con el teclado no hace falta, porque espacio o intro ya cogen la fila.
  const [menuId, setMenuId] = useState<string | null>(null);
  // Aviso para lectores de pantalla al mover con el menú (los de arrastrar los pone dnd-kit).
  const [moved, setMoved] = useState('');
  // Los avisos, en <body> o en el diálogo abierto: fuera de un modal, los lectores no los anunciarían.
  const layer = useLayer();
  const indexOf = (id: string) => items.findIndex((x) => x.id === id);
  // Estable: el menú abierto se suscribe con ella a los toques de fuera.
  const close = useCallback(() => setMenuId(null), []);
  const menu: MoveMenuApi = {
    openId: menuId,
    close,
    canMove: (id, step) => {
      const i = indexOf(id);
      return i >= 0 && i + step >= 0 && i + step < items.length;
    },
    move: (id, step) => {
      const i = indexOf(id);
      const target = items[i + step];
      if (i < 0 || !target) return;
      onMove(id, target.id);
      setMoved(`${items[i].name} se ha movido a la posición ${i + step + 1}.`);
    },
  };

  // Al cruzar a otro puesto, un toque corto en el móvil (Android; iOS no deja vibrar desde la web): el «clic»
  // de cambiar de hueco, como los selectores del sistema.
  const lastOver = useRef<UniqueIdentifier | null>(null);
  const onDragOver = ({ over }: DragOverEvent) => {
    if (!over || over.id === lastOver.current) return;
    lastOver.current = over.id;
    navigator.vibrate?.(8);
  };
  const onDragEnd = ({ active, over, delta, activatorEvent }: DragEndEvent) => {
    lastOver.current = null;
    // Un toque o clic en el asa, sin moverla (la fila se coge nada más pulsar): abre o cierra su menú.
    if (!(activatorEvent instanceof globalThis.KeyboardEvent) && Math.hypot(delta.x, delta.y) < 4) {
      const id = String(active.id);
      if (items.length > 1) setMenuId((open) => (open === id ? null : id));
      return;
    }
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  // Avisos para lectores de pantalla, en español.
  const nameOf = (id: UniqueIdentifier) => items.find((x) => x.id === id)?.name ?? 'la fila';
  const position = (id: UniqueIdentifier) => items.findIndex((x) => x.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Se ha cogido ${nameOf(active.id)}, en la posición ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} se movería a la posición ${position(over.id)}.` : `${nameOf(active.id)} está fuera de la lista.`,
    // Soltada en su sitio (también un toque en el asa, que abre su menú): no se ha movido.
    onDragEnd: ({ active, over }) =>
      !over
        ? `${nameOf(active.id)} se ha soltado.`
        : over.id === active.id
          ? `${nameOf(active.id)} se queda en la posición ${position(active.id)}.`
          : `${nameOf(active.id)} se ha movido a la posición ${position(over.id)}.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragStart={({ active }) => {
        lastOver.current = active.id;
        setMenuId(null);
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => (lastOver.current = null)}
      accessibility={{
        announcements,
        container: layer,
        // Instrucción de teclado solo para lectores: en imperativo y con las teclas en minúscula, como las
        // pistas del propio lector (norma de voz); los avisos de estado, de arriba, van en impersonal.
        screenReaderInstructions: {
          draggable:
            'Para cambiar el orden, pulsa espacio o intro para coger la fila, muévela con las flechas arriba y abajo y vuelve a pulsar espacio o intro para soltarla. Pulsa escape para cancelar.',
        },
      }}
    >
      <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        <MoveMenuContext.Provider value={menu}>{children}</MoveMenuContext.Provider>
      </SortableContext>
      {/* Junto a los avisos de dnd-kit: dentro de la lista ocuparía una celda de su rejilla. */}
      {createPortal(
        <div className="sr-only" role="status">
          {moved}
        </div>,
        layer,
      )}
    </DndContext>
  );
}

/**
 * Lo que necesita cada fila de una SortableList: su ref, su clase (.sortable-row, arrastrada o saliendo), su
 * estilo (el desplazamiento al reordenar y el filtro del polvo) y lo que lleva su asa (DragHandle).
 */
export function useSortableRow(id: string, leaving: boolean) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    // Encaje seco al cambiar de puesto (180ms con un leve rebote, en vez de 250ms suaves); sin movimiento si se pide.
    transition: reducedMotion() ? null : SNAP_TRANSITION,
  });
  // La marca de la fila en la página: la usa useDustRemoval para saber si tiene el foco y a qué fila pasarlo.
  const ref = useCallback(
    (el: HTMLElement | null) => {
      setNodeRef(el);
      if (el) el.dataset.sortableRow = id;
    },
    [setNodeRef, id],
  );
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    filter: leaving ? `url(#${dustId(id)})` : undefined,
    '--dust-ms': `${DUST_MS}ms`,
  };
  return {
    setNodeRef: ref,
    className: `sortable-row${isDragging ? ' is-dragging' : ''}${leaving ? ' is-leaving' : ''}`,
    style,
    handle: { id, ref: setActivatorNodeRef, attributes, listeners },
  };
}

type Handle = ReturnType<typeof useSortableRow>['handle'];

/**
 * El asa de la fila: seis puntos. Se arrastra; con el teclado, espacio o intro la coge. Un toque sin moverla
 * abre su menú «Subir / Bajar» (MoveMenu), y la flecha abajo entra en él.
 */
export function DragHandle({ handle, label }: { handle: Handle; label: string }) {
  const menu = useContext(MoveMenuContext);
  const open = menu?.openId === handle.id;
  const button = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (open && e.key === 'ArrowDown') {
      e.preventDefault();
      menuItems(menuRef.current)[0]?.focus();
      return;
    }
    // Con el menú abierto, Esc lo cierra a él y no al diálogo en el que esté la lista.
    if (open && e.key === 'Escape') {
      e.preventDefault();
      menu.close();
      return;
    }
    handle.listeners?.onKeyDown?.(e);
  };
  return (
    <>
      <button
        type="button"
        ref={(el) => {
          handle.ref(el);
          button.current = el;
        }}
        className="btn btn-ghost drag-handle"
        title="Arrastrar o pulsar para cambiar el orden"
        {...handle.attributes}
        {...handle.listeners}
        onKeyDown={onKeyDown}
        aria-label={`Mover ${label}`}
      >
        <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">
          {[3, 8, 13].map((y) => (
            <g key={y}>
              <circle cx="2.5" cy={y} r="1.4" />
              <circle cx="7.5" cy={y} r="1.4" />
            </g>
          ))}
        </svg>
      </button>
      {open && menu && <MoveMenu id={handle.id} label={label} api={menu} handle={button} menuRef={menuRef} />}
    </>
  );
}

/** Las opciones del menú que se pueden usar, en orden. */
const menuItems = (menu: HTMLElement | null) => [
  ...(menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []),
];

interface MoveMenuProps {
  id: string;
  label: string;
  api: MoveMenuApi;
  handle: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
}

/**
 * «Subir» y «Bajar», bajo la fila. Flechas, Inicio y Fin recorren las opciones; Escape cierra y vuelve al asa;
 * pulsar fuera o salir con el tabulador cierra. Elegir una opción mueve la fila, cierra y deja el foco en el asa
 * (sin anillo si fue con el ratón).
 */
function MoveMenu({ id, label, api, handle, menuRef }: MoveMenuProps) {
  const { close } = api;
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // El asa no cuenta: su toque ya abre y cierra el menú.
      if (!menuRef.current?.contains(target) && !handle.current?.contains(target)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [close, handle, menuRef]);

  const closeToHandle = (focusVisible: boolean) => {
    handle.current?.focus({ focusVisible });
    close();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems(menuRef.current);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? -1 : null;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeToHandle(true);
    } else if (next !== null && items.length > 0) {
      e.preventDefault();
      items[(next + items.length) % items.length].focus();
    }
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const to = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(to) && !handle.current?.contains(to)) close();
  };
  const option = (step: -1 | 1, text: string) => (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={!api.canMove(id, step)}
      onClick={(e: MouseEvent) => {
        api.move(id, step);
        // detail 0: elegida con el teclado, que conserva el anillo.
        closeToHandle(e.detail === 0);
      }}
    >
      {text}
    </button>
  );
  return (
    <div ref={menuRef} className="move-menu" role="menu" aria-label={`Mover ${label}`} onKeyDown={onKeyDown} onBlur={onBlur}>
      {option(-1, 'Subir')}
      {option(1, 'Bajar')}
    </div>
  );
}

const dustId = (id: string) => `dust-${id}`;

/**
 * El polvo: un filtro de ruido que desplaza los píxeles de la fila cada vez más (de 0 a DUST_SCALE) mientras se
 * desvanece. El filtro es de cada fila, así dos que se quitan a la vez no se pisan. Solo existe mientras sale.
 */
export function DustFilter({ id, leaving }: { id: string; leaving: boolean }) {
  const ref = useRef<SVGAnimateElement>(null);
  useEffect(() => {
    if (leaving) ref.current?.beginElement();
  }, [leaving]);
  if (!leaving) return null;
  return (
    <svg className="dust-filter" width="0" height="0" aria-hidden="true">
      <filter id={dustId(id)} x="-20%" y="-50%" width="140%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G">
          <animate
            ref={ref}
            attributeName="scale"
            from="0"
            to={DUST_SCALE}
            dur={`${DUST_MS}ms`}
            begin="indefinite"
            fill="freeze"
          />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}
