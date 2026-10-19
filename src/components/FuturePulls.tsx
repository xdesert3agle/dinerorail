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
import { useState } from 'react';
import type { Result } from '../engine/calculate';
import type { Catalog, CatalogEntry } from '../engine/catalog';
import { characterPortraitUrl, dupeOf, lightConeImageUrl, resolve, type RowCopy } from '../engine/dupes';
import { formatDate } from '../engine/dates';
import { planPulls, type PlannedPullResult } from '../engine/pulls';
import {
  FOUR_STAR_RATE,
  PULLS_PER_4_STAR,
  STARLIGHT_PER_4_STAR,
  STARLIGHT_PER_5_STAR,
  STARLIGHT_PER_5_STAR_E6,
  STARLIGHT_PER_AVERAGE_4_STAR,
  STARLIGHT_PER_PASS,
} from '../engine/rules';
import type { AppState, PlannedPull, PullKind } from '../engine/types';
import { newId } from '../engine/util';
import { withSettings } from '../state/store';
import { DupeBadge } from './DupeBadge';
import { fmtInt } from './format';
import { Icon } from './Icon';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { Toggle } from './Toggle';
import { NameCombobox } from './NameCombobox';

interface Props {
  state: AppState;
  result: Result;
  /** Personajes y conos 5★ sincronizados, para sugerir nombres (null si aún no se ha sincronizado). */
  catalog: Catalog | null;
  /** Qué copia es cada fila del plan, para mostrar su dupe. */
  copies: (RowCopy | null)[];
  onChange: (update: (s: AppState) => AppState) => void;
}


const pct = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const dec = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const dec1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const NO_SUGGESTIONS: CatalogEntry[] = [];

export function FuturePulls({ state, result, catalog, copies, onChange }: Props) {
  const plan = state.plannedPulls;
  const countStarlight = state.settings.countStarlight;
  const rows = planPulls(plan, state.pity, result.wholeSingles, {
    countStarlight,
    hardPity: state.settings.hardPity,
    guaranteed: state.guaranteed,
    initialStarlight: result.starlightLeftover,
  });
  // Las filas muestran el coste sin Cosmiluz; lo que devuelve solo se descuenta del total.
  const total = rows.at(-1)?.cumulative ?? 0;
  const grossTotal = rows.reduce((sum, r) => sum + r.cost, 0);
  const refunded = grossTotal - total;
  const left = result.wholeSingles - total;

  const setPlan = (update: (p: PlannedPull[]) => PlannedPull[]) =>
    onChange((s) => ({ ...s, plannedPulls: update(s.plannedPulls) }));
  const updatePull = (id: string, patch: Partial<PlannedPull>) =>
    setPlan((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  // El nombre es solo el del catálogo: el dupe de cada fila se calcula aparte (ver planCopies).
  const remove = (id: string) => setPlan((p) => p.filter((x) => x.id !== id));
  // Miniatura de cada fila: el retrato del personaje o el icono del cono (null si no está en el catálogo).
  const portraitOf = (pull: PlannedPull) => {
    const entry = catalog ? resolve(pull.name, catalog[pull.kind]) : null;
    if (!entry) return null;
    return pull.kind === 'character' ? characterPortraitUrl(entry.id) : lightConeImageUrl(entry.id);
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
          {/* "+" y el icono del tipo; el nombre va en el tooltip y para lectores de pantalla. */}
          <button
            type="button"
            className="btn btn-add-pull"
            title="Añadir personaje"
            aria-label="Añadir personaje"
            onClick={() => add('character')}
          >
            +<span className={`glyph ${KIND_GLYPH.character}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-add-pull"
            title="Añadir cono de luz"
            aria-label="Añadir cono de luz"
            onClick={() => add('lightCone')}
          >
            +<span className={`glyph ${KIND_GLYPH.lightCone}`} aria-hidden="true" />
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
                  suggestions={catalog?.[pull.kind] ?? NO_SUGGESTIONS}
                  dupe={dupeOf(copies[i] ?? null)}
                  portrait={portraitOf(pull)}
                  onUpdate={(patch) => updatePull(pull.id, patch)}
                  autoFocus={pull.id === focusId}
                  onRemove={() => remove(pull.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Casilla de la Cosmiluz a la izquierda y balance a la derecha, alineado con los costes. */}
          <div className="pull-summary">
            <Toggle
              checked={countStarlight}
              onChange={(countStarlight) => onChange(withSettings({ countStarlight }))}
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
              title={[
                `${fmtInt(result.wholeSingles)} singles el ${formatDate(result.targetDate)} − ${fmtInt(grossTotal)} de las tiradas`,
                countStarlight
                  ? `+ ${fmtInt(refunded)} de vuelta por la Cosmiluz Inextinguible`
                  : 'Sin contar la Cosmiluz Inextinguible',
              ].join('\n')}
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
  suggestions: CatalogEntry[];
  /** Eidolón que da esta fila (1…6), o null si no es un dupe. */
  dupe: number | null;
  /** URL de la miniatura, o null si la fila no tiene nombre del catálogo. */
  portrait: string | null;
  autoFocus: boolean;
  onUpdate: (patch: Partial<PlannedPull>) => void;
  onRemove: () => void;
}

function SortablePullRow({ pull, row, suggestions, dupe, portrait, onUpdate, autoFocus, onRemove }: RowProps) {
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

      {/*
        Miniatura: el retrato (o el icono del cono) tapa el icono del tipo, que queda debajo para las filas
        sin nombre o si la imagen no carga. El tipo se elige al añadir la fila y no se cambia.
      */}
      <span className={`pull-portrait pull-portrait-${pull.kind}`} aria-hidden="true">
        <span className={`glyph ${KIND_GLYPH[pull.kind]}`} />
        {portrait && (
          <img
            key={portrait}
            src={portrait}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
        )}
      </span>

      {/*
        El tipo, dentro del recuadro del nombre: hace de placeholder y sube al escribir o con nombre
        (ver .pull-field en styles.css).
      */}
      <div className={`field pull-field${pull.name ? ' has-value' : ''}`}>
        <span className="field-label" aria-hidden="true">
          {KIND_LABEL[pull.kind]}
        </span>
        <NameCombobox
          inputClassName="pull-name"
          value={pull.name}
          entries={suggestions}
          aria-label={`Nombre (${KIND_LABEL[pull.kind].toLowerCase()})`}
          badge={dupe !== null && <DupeBadge eidolon={dupe} />}
          onChange={(name) => onUpdate({ name })}
          autoFocus={autoFocus}
        />
      </div>

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
        title={`${row.costDetail} = ${fmtInt(row.cost)} tiradas${row.usesPity ? ' (descuenta tu pity actual)' : ''}`}
      >
        <Icon kind="pass" size={26} decorative />
        <strong>{fmtInt(row.cost)}</strong>
      </div>

      <button type="button" className="btn btn-ghost btn-icon pull-remove" aria-label={`Quitar ${label}`} onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
