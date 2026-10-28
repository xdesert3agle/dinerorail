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
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useRef, useState, type RefObject } from 'react';
import type { Result } from '../engine/calculate';
import type { Catalog, CatalogEntry } from '../engine/catalog';
import {
  characterPortraitUrl,
  dupeOf,
  lightConeIconUrl,
  lightConeImageUrl,
  resolve,
  type RowCopy,
} from '../engine/dupes';
import { planBalance, planPulls } from '../engine/pulls';
import type { AppState, PlannedPull, PullKind } from '../engine/types';
import { newId } from '../engine/util';
import type { ChangeState, Notice } from '../state/store';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { PlanFooter } from './PlanFooter';
import { PullRow, useDustRemoval } from './PullRow';

interface Props {
  state: AppState;
  result: Result;
  /** Personajes y conos 5★ sincronizados, para sugerir nombres (null si aún no se ha sincronizado). */
  catalog: Catalog | null;
  /** Qué copia es cada fila del plan, para mostrar su dupe. */
  copies: (RowCopy | null)[];
  /** Probabilidad de cada fila (junto con las anteriores), ya escrita; la calcula App con la previsión. */
  chances: string[];
  onChange: ChangeState;
}

const NO_SUGGESTIONS: CatalogEntry[] = [];

/** Los botones de añadir de la cabecera, en este orden. */
const ADD_KINDS: PullKind[] = ['character', 'lightCone'];

/**
 * Deja la fila arrastrada entre la primera y la última fila, sin entrar en el pie de la Cosmiluz, que va en la
 * misma lista (con restrictToParentElement bajaba hasta el final de la tarjeta). El tope de abajo es el borde
 * de arriba del pie, tomado como distancia al final de la lista para que no dependa del scroll, más su margen
 * (el aire sobre su línea): el hueco de la última fila acaba ahí.
 */
const restrictToRows =
  (foot: RefObject<HTMLDivElement | null>): Modifier =>
  ({ transform, draggingNodeRect, containerNodeRect }) => {
    const list = foot.current?.parentElement;
    if (!draggingNodeRect || !containerNodeRect || !foot.current || !list) return transform;
    const footH =
      list.getBoundingClientRect().bottom -
      foot.current.getBoundingClientRect().top +
      parseFloat(getComputedStyle(foot.current).marginTop);
    const min = containerNodeRect.top - draggingNodeRect.top;
    const max = containerNodeRect.bottom - footH - draggingNodeRect.bottom;
    return { ...transform, y: Math.min(Math.max(transform.y, min), max) };
  };

/** Plan de tiradas: la cabecera con los botones de añadir, las filas (que se reordenan arrastrando) y el pie. */
export function FuturePulls({ state, result, catalog, copies, chances, onChange }: Props) {
  const plan = state.plannedPulls;
  const countStarlight = state.settings.countStarlight;
  const rows = planPulls(plan, state.pity, result.wholeSingles, {
    countStarlight,
    hardPity: state.settings.hardPity,
    guaranteed: state.guaranteed,
    initialStarlight: result.starlightLeftover,
  });
  // Las filas muestran el coste sin Cosmiluz; lo que devuelve solo se descuenta del total.
  const balance = planBalance(rows, result.wholeSingles);

  const setPlan = (update: (p: PlannedPull[]) => PlannedPull[], undo?: Notice) =>
    onChange((s) => ({ ...s, plannedPulls: update(s.plannedPulls) }), undo);
  const updatePull = (id: string, patch: Partial<PlannedPull>) =>
    setPlan((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  // Al quitar una fila, se deshace en polvo y luego sale del plan (useDustRemoval). El aviso pone el dupe tras
  // el nombre («Kafka E2»), fuera de lo que se recorta si el nombre es largo.
  const { leaving, removeLater } = useDustRemoval();
  const remove = (pull: PlannedPull, dupe: number | null) =>
    removeLater(pull.id, () =>
      setPlan(
        (p) => p.filter((x) => x.id !== pull.id),
        pull.name
          ? { before: '«', name: pull.name, after: `${dupe === null ? '' : ` E${dupe}`}» quitado del plan.` }
          : 'Fila quitada del plan.',
      ),
    );
  // Miniatura de cada fila: el retrato del personaje o el icono del cono (null si no está en el catálogo).
  // Del cono, primero el de StarRailRes y, si no lo tiene, el de nanoka.
  const portraitOf = (pull: PlannedPull) => {
    const entry = catalog ? resolve(pull.name, catalog[pull.kind]) : null;
    if (!entry) return null;
    return pull.kind === 'character'
      ? [characterPortraitUrl(entry.id)]
      : [lightConeIconUrl(entry.id), lightConeImageUrl(entry.id)];
  };
  // La fila recién añadida enfoca su nombre para poder escribir directamente.
  const [focusId, setFocusId] = useState<string | null>(null);
  const add = (kind: PullKind) => {
    const id = newId('pull');
    setFocusId(id);
    setPlan((p) => [...p, { id, name: '', kind, winsFiftyFifty: false }]);
  };

  const sensors = useSensors(
    // Un pequeño margen para que un clic en el asa no cuente como arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Al cruzar a otro puesto, un toque corto en el móvil (Android; iOS no deja vibrar desde la web): el «clic»
  // de cambiar de hueco, como los selectores del sistema.
  const lastOver = useRef<UniqueIdentifier | null>(null);

  // En vertical y sin salir de las filas (ver restrictToRows).
  const footRef = useRef<HTMLDivElement>(null);
  const modifiers = useMemo(() => [restrictToVerticalAxis, restrictToRows(footRef)], []);
  const onDragOver = ({ over }: DragOverEvent) => {
    if (!over || over.id === lastOver.current) return;
    lastOver.current = over.id;
    navigator.vibrate?.(8);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    lastOver.current = null;
    if (!over || active.id === over.id) return;
    setPlan((p) => {
      const from = p.findIndex((x) => x.id === active.id);
      const to = p.findIndex((x) => x.id === over.id);
      return from < 0 || to < 0 ? p : arrayMove(p, from, to);
    });
  };

  // Avisos para lectores de pantalla, en español.
  const nameOf = (id: string | number) => {
    const pull = plan.find((x) => x.id === id);
    return pull ? pull.name || KIND_LABEL[pull.kind] : 'la tirada';
  };
  const position = (id: string | number) => plan.findIndex((x) => x.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Se ha cogido ${nameOf(active.id)}, en la posición ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} se movería a la posición ${position(over.id)}.` : `${nameOf(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} se ha movido a la posición ${position(over.id)}.` : `${nameOf(active.id)} se ha soltado.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
  };

  return (
    <section className="card card-plan">
      <header className="card-header">
        <h2>Plan de tiradas</h2>
        <div className="header-actions">
          {/*
            "+", el icono del tipo y su nombre. En una tarjeta estrecha (móvil) el nombre se oculta y quedan "+" e
            icono, que el texto de escritorio ya ha enseñado; el nombre completo va siempre en aria-label.
          */}
          {ADD_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="btn btn-add-pull"
              aria-label={`Añadir ${KIND_LABEL[kind].toLowerCase()}`}
              onClick={() => add(kind)}
            >
              +<span className={`glyph ${KIND_GLYPH[kind]}`} aria-hidden="true" />
              <span className="add-pull-text">{KIND_LABEL[kind]}</span>
            </button>
          ))}
        </div>
      </header>

      {plan.length === 0 ? (
        <p className="muted">Aún no hay nada planificado. Los personajes y conos de luz se añaden en el orden en que se quieren sacar.</p>
      ) : (
        <div className="pull-list">
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
              screenReaderInstructions: {
                draggable:
                  'Para mover una tirada: Espacio o Intro para cogerla, flechas arriba y abajo para moverla y otra vez Espacio o Intro para soltarla. Escape cancela.',
              },
            }}
          >
            <SortableContext items={plan.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {plan.map((pull, i) => (
                <PullRow
                  key={pull.id}
                  pull={pull}
                  row={rows[i]}
                  suggestions={catalog?.[pull.kind] ?? NO_SUGGESTIONS}
                  dupe={dupeOf(copies[i] ?? null)}
                  chance={chances[i] ?? ''}
                  portrait={portraitOf(pull)}
                  onUpdate={(patch) => updatePull(pull.id, patch)}
                  autoFocus={pull.id === focusId}
                  leaving={leaving.includes(pull.id)}
                  onRemove={() => remove(pull, dupeOf(copies[i] ?? null))}
                />
              ))}
            </SortableContext>
          </DndContext>

          <PlanFooter
            result={result}
            countStarlight={countStarlight}
            balance={balance}
            onChange={onChange}
            footRef={footRef}
          />
        </div>
      )}
    </section>
  );
}
