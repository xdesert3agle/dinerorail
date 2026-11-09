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
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { reducedMotion } from './motion';

/*
 * Filas que se reordenan arrastrando su asa y que se deshacen en polvo al quitarlas: las del plan y las de los
 * eventos. La fila lleva la clase .sortable-row (ver styles.css) y lo que le da useSortableRow.
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
 */
export function useDustRemoval() {
  const [leaving, setLeaving] = useState<string[]>([]);
  const removeLater = (id: string, commit: () => void) => {
    if (reducedMotion()) return commit();
    if (leaving.includes(id)) return;
    setLeaving((l) => [...l, id]);
    window.setTimeout(() => {
      commit();
      setLeaving((l) => l.filter((x) => x !== id));
    }, DUST_MS);
  };
  return { leaving, removeLater };
}

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

  // Al cruzar a otro puesto, un toque corto en el móvil (Android; iOS no deja vibrar desde la web): el «clic»
  // de cambiar de hueco, como los selectores del sistema.
  const lastOver = useRef<UniqueIdentifier | null>(null);
  const onDragOver = ({ over }: DragOverEvent) => {
    if (!over || over.id === lastOver.current) return;
    lastOver.current = over.id;
    navigator.vibrate?.(8);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    lastOver.current = null;
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  // Avisos para lectores de pantalla, en español.
  const nameOf = (id: UniqueIdentifier) => items.find((x) => x.id === id)?.name ?? 'la fila';
  const position = (id: UniqueIdentifier) => items.findIndex((x) => x.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Se ha cogido ${nameOf(active.id)}, en la posición ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} se movería a la posición ${position(over.id)}.` : `${nameOf(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} se ha movido a la posición ${position(over.id)}.` : `${nameOf(active.id)} se ha soltado.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragStart={({ active }) => (lastOver.current = active.id)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => (lastOver.current = null)}
      accessibility={{
        announcements,
        // Instrucción de teclado solo para lectores: en imperativo y con las teclas en minúscula, como las
        // pistas del propio lector (norma de voz); los avisos de estado, de arriba, van en impersonal.
        screenReaderInstructions: {
          draggable:
            'Para cambiar el orden, pulsa espacio o intro para coger la fila, muévela con las flechas arriba y abajo y vuelve a pulsar espacio o intro para soltarla. Pulsa escape para cancelar.',
        },
      }}
    >
      <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
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
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    filter: leaving ? `url(#${dustId(id)})` : undefined,
    '--dust-ms': `${DUST_MS}ms`,
  };
  return {
    setNodeRef,
    className: `sortable-row${isDragging ? ' is-dragging' : ''}${leaving ? ' is-leaving' : ''}`,
    style,
    handle: { ref: setActivatorNodeRef, attributes, listeners },
  };
}

type Handle = ReturnType<typeof useSortableRow>['handle'];

/** El asa de la fila: seis puntos, sin acción de clic (con el teclado, espacio o intro la coge). */
export function DragHandle({ handle, label }: { handle: Handle; label: string }) {
  return (
    <button
      type="button"
      ref={handle.ref}
      className="btn btn-ghost drag-handle"
      title="Arrastrar para cambiar el orden"
      {...handle.attributes}
      {...handle.listeners}
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
