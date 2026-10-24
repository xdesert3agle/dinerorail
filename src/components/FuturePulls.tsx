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
  type UniqueIdentifier,
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
import { useEffect, useRef, useState } from 'react';
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
import { withSettings, type ChangeState } from '../state/store';
import { DupeBadge } from './DupeBadge';
import { fmtInt } from './format';
import { Icon } from './Icon';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { reducedMotion } from './motion';
import { Toggle } from './Toggle';
import { NameCombobox } from './NameCombobox';
import { Tip } from './Tip';
import { RemoveGlyph } from './RemoveGlyph';

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


const pct = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const dec = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const dec1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const NO_SUGGESTIONS: CatalogEntry[] = [];

/** Cuánto dura el polvo de una fila quitada y hasta dónde se dispersan sus píxeles (px del desplazamiento). */
const DUST_MS = 600;
const DUST_SCALE = 70;

/** Cómo encaja una fila desplazada en su nuevo hueco al reordenar: rápida y con un rebote leve al llegar. */
const SNAP_TRANSITION = { duration: 180, easing: 'cubic-bezier(0.3, 1.35, 0.5, 1)' };

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
  const total = rows.at(-1)?.cumulative ?? 0;
  const grossTotal = rows.reduce((sum, r) => sum + r.cost, 0);
  const refunded = grossTotal - total;
  const left = result.wholeSingles - total;

  const setPlan = (update: (p: PlannedPull[]) => PlannedPull[], undo?: string) =>
    onChange((s) => ({ ...s, plannedPulls: update(s.plannedPulls) }), undo);
  const updatePull = (id: string, patch: Partial<PlannedPull>) =>
    setPlan((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  // El nombre es solo el del catálogo: el dupe de cada fila se calcula aparte (ver planCopies). El aviso lo
  // pone al final del nombre, «Kafka E2», y el toast lo deja fuera del recorte de los nombres largos.
  // Al quitar una fila, se deshace en polvo (DUST_MS) y luego sale del plan; sin animación si se pide menos movimiento.
  const [leaving, setLeaving] = useState<string[]>([]);
  const remove = (pull: PlannedPull, dupe: number | null) => {
    const commit = () =>
      setPlan(
        (p) => p.filter((x) => x.id !== pull.id),
        pull.name
          ? `«${pull.name}${dupe === null ? '' : ` E${dupe}`}» quitado de la planificación.`
          : 'Fila quitada de la planificación.',
      );
    if (reducedMotion()) return commit();
    setLeaving((l) => [...l, pull.id]);
    window.setTimeout(() => {
      commit();
      setLeaving((l) => l.filter((id) => id !== pull.id));
    }, DUST_MS);
  };
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
    onDragStart: ({ active }) => `Has cogido ${nameOf(active.id)}, en la posición ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} se movería a la posición ${position(over.id)}.` : `${nameOf(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} se ha movido a la posición ${position(over.id)}.` : `${nameOf(active.id)} se ha soltado.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su sitio.`,
  };

  return (
    <section className="card card-plan">
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
            onDragStart={({ active }) => (lastOver.current = active.id)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={() => (lastOver.current = null)}
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

          {/*
            Pie: el interruptor de la Cosmiluz con lo que devuelve pegado a su texto («+35», así se ve de quién es)
            y el balance a la derecha, alineado con los costes. La cuenta se sigue a la vista: costes − Cosmiluz
            frente a las tiradas del Resumen.
          */}
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
                `${STARLIGHT_PER_PASS} Cosmiluz = 1 tirada`,
                '',
                `4★: ${pct.format(FOUR_STAR_RATE)} por tirada con el garantizado`,
                `(1 cada ${dec.format(PULLS_PER_4_STAR)} tiradas; de media ${dec1.format(STARLIGHT_PER_AVERAGE_4_STAR.character)}`,
                `de Cosmiluz por 4★ en el banner de personaje y ${dec1.format(STARLIGHT_PER_AVERAGE_4_STAR.lightCone)} en el de conos)`,
              ].join('\n')}
            >
              <Icon kind="starlight" size={20} decorative />
              <span className="refund-label">
                Contar Cosmiluz de las tiradas
                {/* Apagada, el hueco se reserva (nada se mueve al encenderla); en palabras para los lectores. */}
                <span className={`pull-refund with-icon with-icon-tight${countStarlight ? '' : ' invisible'}`}>
                  <Icon kind="pass" size={16} decorative />
                  <span className="pull-refund-num" aria-hidden="true">
                    +{fmtInt(refunded)}
                  </span>
                  {countStarlight && <span className="sr-only">(devuelve {fmtInt(refunded)} tiradas)</span>}
                </span>
              </span>
            </Toggle>
            {/* El balance dice con palabras si llega; el signo sobraba. */}
            <Tip
              as="div"
              // Solo en rojo si faltan; si sobran, en el color de las cifras de encima (es lo normal, no un aviso).
              className={left < 0 ? 'pull-cost pull-balance status-short' : 'pull-cost pull-balance'}
              content={[
                `${fmtInt(result.wholeSingles)} tiradas el ${formatDate(result.targetDate)} − ${fmtInt(grossTotal)} que cuesta el plan`,
                countStarlight
                  ? `+ ${fmtInt(refunded)} de vuelta por la Cosmiluz Inextinguible`
                  : 'Sin contar la Cosmiluz Inextinguible',
              ].join('\n')}
            >
              <span className="pull-balance-label">{left < 0 ? 'Faltan' : 'Sobran'}</span>
              <Icon kind="pass" size={26} decorative />
              <strong>{fmtInt(Math.abs(left))}</strong>
            </Tip>
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
  /** Probabilidad de tenerla junto con las anteriores ("21 %"). */
  chance: string;
  /** URLs de la miniatura, por orden de preferencia, o null si la fila no tiene nombre del catálogo. */
  portrait: string[] | null;
  autoFocus: boolean;
  /** Se está quitando: se deshace en polvo antes de salir del plan. */
  leaving: boolean;
  onUpdate: (patch: Partial<PlannedPull>) => void;
  onRemove: () => void;
}

function SortablePullRow({
  pull,
  row,
  suggestions,
  dupe,
  chance,
  portrait,
  onUpdate,
  autoFocus,
  leaving,
  onRemove,
}: RowProps) {
  // El polvo: un filtro de ruido que desplaza los píxeles de la fila cada vez más (de 0 a DUST_SCALE) mientras se
  // desvanece. El filtro es de cada fila, así dos que se quitan a la vez no se pisan.
  const dustId = `dust-${pull.id}`;
  const dustRef = useRef<SVGAnimateElement>(null);
  useEffect(() => {
    if (leaving) dustRef.current?.beginElement();
  }, [leaving]);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: pull.id,
    // Encaje seco al cambiar de puesto (180ms con un leve rebote, en vez de 250ms suaves); sin movimiento si se pide.
    transition: reducedMotion() ? null : SNAP_TRANSITION,
  });
  const label = pull.name || KIND_LABEL[pull.kind];

  return (
    <div
      ref={setNodeRef}
      className={`pull-row ${row.affordable ? '' : 'is-short'} ${isDragging ? 'is-dragging' : ''} ${leaving ? 'is-leaving' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition, filter: leaving ? `url(#${dustId})` : undefined }}
    >
      {leaving && (
        <svg className="dust-filter" width="0" height="0" aria-hidden="true">
          <filter id={dustId} x="-20%" y="-50%" width="140%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G">
              <animate
                ref={dustRef}
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
      )}
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
            key={portrait.join(' ')}
            src={portrait[0]}
            alt=""
            // Como en la galería (que la pide en modo CORS por la máscara): el icono del cono se descarga una vez.
            crossOrigin="anonymous"
            // El tamaño lo pone el CSS (el hueco de la miniatura); estos evitan saltos al cargar.
            width={54}
            height={54}
            loading="lazy"
            decoding="async"
            draggable={false}
            // Cargada: el cono quita entonces su fondo (ver .pull-portrait-lightCone en styles.css).
            onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
            // Si falla, prueba la siguiente URL; agotadas, se oculta y deja ver el icono del tipo.
            onError={(e) => {
              const img = e.currentTarget;
              const next = Number(img.dataset.fallback ?? 0) + 1;
              if (next < portrait.length) {
                img.dataset.fallback = String(next);
                img.src = portrait[next];
              } else {
                img.style.visibility = 'hidden';
              }
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
        {/*
          Su probabilidad, en la línea del tipo, a la derecha: la respuesta a «¿llego?» junto al objetivo.
          Con las probabilidades reales (no usa la casilla «Gano 50/50»).
        */}
        <Tip className="pull-chance" content="Probabilidad de tenerlo, junto con todos los anteriores">
          <span className="sr-only">Probabilidad: </span>
          {chance}
        </Tip>
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

      {/*
        Con el garantizado, la primera fila de ese banner se gana seguro: la casilla queda fija y dice
        «Garantizado». Los dos textos ocupan el mismo hueco para que la columna no cambie de ancho.
      */}
      <label
        className="check pull-win"
        title={
          row.guaranteed
            ? 'Tienes el garantizado: se gana seguro'
            : 'Márcala si cuentas con ganar el 50/50; si no, se cuenta perdido (el doble de tiradas)'
        }
      >
        <input
          type="checkbox"
          checked={row.guaranteed || pull.winsFiftyFifty}
          disabled={row.guaranteed}
          aria-label={row.guaranteed ? `${label}: garantizado, se gana seguro` : `${label}: gano el 50/50`}
          onChange={(e) => onUpdate({ winsFiftyFifty: e.target.checked })}
        />
        <span className="swap">
          <span className={row.guaranteed ? undefined : 'invisible'}>Garantizado</span>
          <span className={row.guaranteed ? 'invisible' : undefined}>Gano 50/50</span>
        </span>
      </label>

      <Tip
        as="div"
        className="pull-cost"
        content={`${row.costDetail} = ${fmtInt(row.cost)} tiradas${row.usesPity ? ' (descuenta tu pity actual)' : ''}`}
      >
        <Icon kind="pass" size={26} decorative />
        <strong>{fmtInt(row.cost)}</strong>
        {/* El borde rojo del nombre no llega a los lectores de pantalla: lo dicen aquí. */}
        {!row.affordable && <span className="sr-only">, no llega con lo que tendrás</span>}
      </Tip>

      <button type="button" className="btn btn-ghost btn-remove" aria-label={`Quitar ${label}`} onClick={onRemove}>
        <RemoveGlyph />
      </button>
    </div>
  );
}
