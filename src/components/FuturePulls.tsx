import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import {
  FOUR_STAR_RATE,
  planPulls,
  PULLS_PER_4_STAR,
  STARLIGHT_PER_4_STAR,
  STARLIGHT_PER_5_STAR,
  STARLIGHT_PER_5_STAR_E6,
  STARLIGHT_PER_AVERAGE_4_STAR,
  STARLIGHT_PER_PASS,
  type PlannedPullResult,
} from '../engine/pulls';
import type { AppState, PlannedPull, PullKind } from '../engine/types';
import { fmtInt } from './format';
import { Icon } from './Icon';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  result: Result;
  onChange: (update: (s: AppState) => AppState) => void;
}

const KIND_LABEL: Record<PullKind, string> = { character: 'Personaje', lightCone: 'Cono de luz' };
/** Etiquetas cortas para el selector, para que cada tirada quepa en una sola línea. */
const KIND_SHORT: Record<PullKind, string> = { character: 'Personaje', lightCone: 'Cono de Luz' };

const pct = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const dec = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const dec1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const newId = () => `pull-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function FuturePulls({ state, result, onChange }: Props) {
  const plan = state.plannedPulls;
  const countStarlight = state.settings.countStarlight;
  const rows = planPulls(plan, state.pity, result.wholeSingles, result.timeline, {
    countStarlight,
    hardPity: state.settings.hardPity,
    guaranteed: state.guaranteed,
    initialStarlight: result.starlightLeftover,
  });
  const total = rows.at(-1)?.cumulative ?? 0;
  const left = result.wholeSingles - total;

  const setPlan = (update: (p: PlannedPull[]) => PlannedPull[]) =>
    onChange((s) => ({ ...s, plannedPulls: update(s.plannedPulls) }));
  const updatePull = (id: string, patch: Partial<PlannedPull>) =>
    setPlan((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = (kind: PullKind) =>
    setPlan((p) => [...p, { id: newId(), name: '', kind, winsFiftyFifty: false }]);

  const sensors = useSensors(
    // Un pequeño margen para que un clic en el asa no cuente como arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
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
    onDragStart: ({ active }) => `Has cogido ${nameOf(active.id)}, en la posición ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} se movería a la posición ${position(over.id)}.` : `${nameOf(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} se ha movido a la posición ${position(over.id)}.` : `${nameOf(active.id)} se ha soltado.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
  };

  return (
    <section className="card">
      <header className="card-header">
        <h2>Planificación de tiradas</h2>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => add('character')}>
            + Personaje
          </button>
          <button type="button" className="btn" onClick={() => add('lightCone')}>
            + Cono de luz
          </button>
        </div>
      </header>

      {plan.length === 0 ? (
        <p className="muted">Añade, en orden, los personajes y conos de luz que quieras sacar.</p>
      ) : (
        <div className="pull-list">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  'Para mover una tirada, pulsa espacio o intro, usa las flechas arriba y abajo y vuelve a pulsar espacio o intro para soltarla. Escape cancela.',
              },
            }}
          >
            <SortableContext items={plan.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {plan.map((pull, i) => (
                <SortablePullRow
                  key={pull.id}
                  pull={pull}
                  row={rows[i]}
                  countStarlight={countStarlight}
                  onUpdate={(patch) => updatePull(pull.id, patch)}
                  onRemove={() => setPlan((p) => p.filter((x) => x.id !== pull.id))}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Casilla de la Cosmiluz a la izquierda y balance a la derecha, alineado con los costes. */}
          <div className="pull-summary">
            <Toggle
              checked={countStarlight}
              onChange={(countStarlight) => onChange((s) => ({ ...s, settings: { ...s.settings, countStarlight } }))}
              title={[
                'Cosmiluz que devuelven las tiradas del plan (la de Recursos actuales ya está sumada)',
                '',
                `4★ = ${STARLIGHT_PER_4_STAR.character} Cosmiluz`,
                `5★ = ${STARLIGHT_PER_5_STAR} Cosmiluz`,
                `5★ E6 = ${STARLIGHT_PER_5_STAR_E6} Cosmiluz`,
                `Cono 4★ = ${STARLIGHT_PER_4_STAR.lightCone} Cosmiluz`,
                `Cono 5★ = ${STARLIGHT_PER_5_STAR} Cosmiluz`,
                `${STARLIGHT_PER_PASS} Cosmiluz = 1 single`,
                '',
                `4★: ${pct.format(FOUR_STAR_RATE)} por tirada con el garantizado`,
                `(1 cada ${dec.format(PULLS_PER_4_STAR)} tiradas; de media ${dec1.format(STARLIGHT_PER_AVERAGE_4_STAR.character)}`,
                `de Cosmiluz por 4★ en el banner de personaje y ${dec1.format(STARLIGHT_PER_AVERAGE_4_STAR.lightCone)} en el de conos)`,
              ].join('\n')}
            >
              <Icon kind="starlight" size={20} decorative />
              Contar Cosmiluz de las tiradas
            </Toggle>
            <div
              className={`pull-cost ${left >= 0 ? 'status-ok' : 'status-short'}`}
              title={`${fmtInt(result.wholeSingles)} singles el ${formatDate(result.targetDate)} − ${fmtInt(total)} de las tiradas`}
            >
              <Icon kind="pass" size={26} decorative />
              <strong>
                <span className="sr-only">Balance: </span>
                {left > 0 ? '+' : left < 0 ? '−' : ''}
                {fmtInt(Math.abs(left))}
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface RowProps {
  pull: PlannedPull;
  row: PlannedPullResult;
  countStarlight: boolean;
  onUpdate: (patch: Partial<PlannedPull>) => void;
  onRemove: () => void;
}

function SortablePullRow({ pull, row, countStarlight, onUpdate, onRemove }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: pull.id,
  });
  const label = pull.name || KIND_LABEL[pull.kind];

  return (
    <div
      ref={setNodeRef}
      className={`pull-row ${row.affordable ? '' : 'is-short'} ${isDragging ? 'is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="btn btn-ghost btn-icon drag-handle"
        title="Arrastra para cambiar el orden"
        {...attributes}
        {...listeners}
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

      <input
        type="text"
        className="pull-name"
        value={pull.name}
        placeholder={pull.kind === 'character' ? 'Nombre del personaje' : 'Nombre del cono de luz'}
        aria-label="Nombre"
        onChange={(e) => onUpdate({ name: e.target.value })}
      />

      <select
        className="pull-kind"
        value={pull.kind}
        aria-label="Tipo"
        onChange={(e) => onUpdate({ kind: e.target.value as PullKind })}
      >
        {(Object.keys(KIND_LABEL) as PullKind[]).map((k) => (
          <option key={k} value={k}>
            {KIND_SHORT[k]}
          </option>
        ))}
      </select>

      {/* Con el garantizado, la primera fila de ese banner se gana seguro: la casilla queda fija. */}
      <label
        className="check pull-win"
        title={row.guaranteed ? 'Tienes el garantizado: se gana seguro' : 'Gana el 50/50 (si no, cuenta el doble)'}
      >
        <input
          type="checkbox"
          checked={row.guaranteed || pull.winsFiftyFifty}
          disabled={row.guaranteed}
          onChange={(e) => onUpdate({ winsFiftyFifty: e.target.checked })}
        />
        50/50
      </label>

      <div
        className="pull-cost"
        title={[
          `${row.costDetail} = ${fmtInt(row.cost)} tiradas${row.usesPity ? ' (descuenta tu pity actual)' : ''}`,
          countStarlight
            ? `+${fmtInt(row.starlight)} de Cosmiluz Inextinguible: ${fmtInt(row.cost - row.netCost)} singles de vuelta`
            : 'Sin contar la Cosmiluz Inextinguible',
          `Coste neto: ${fmtInt(row.netCost)} · acumulado ${fmtInt(row.cumulative)}`,
        ].join('\n')}
      >
        <Icon kind="pass" size={26} decorative />
        <strong>{fmtInt(row.netCost)}</strong>
      </div>

      <button type="button" className="btn btn-ghost btn-icon" aria-label={`Quitar ${label}`} onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
