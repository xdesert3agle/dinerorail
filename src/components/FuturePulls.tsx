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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
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
import type { AppState, PlannedPull, PullKind } from '../engine/types';
import { newId } from '../engine/util';
import { withSettings, type ChangeState } from '../state/store';
import { fmtDayMonth, fmtInt } from './format';
import { Icon } from './Icon';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { reducedMotion } from './motion';
import { Toggle, ToggleTerm } from './Toggle';
import { NameCombobox } from './NameCombobox';
import { StarlightDefinition } from './glossary';
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


const NO_SUGGESTIONS: CatalogEntry[] = [];

/** Los botones de añadir de la cabecera, en este orden. */
const ADD_KINDS: PullKind[] = ['character', 'lightCone'];

/** Cuánto dura el polvo de una fila quitada y hasta dónde se dispersan sus píxeles (px del desplazamiento). */
const DUST_MS = 600;
const DUST_SCALE = 70;

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
          ? `«${pull.name}${dupe === null ? '' : ` E${dupe}`}» quitado del plan.`
          : 'Fila quitada del plan.',
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
                  'Para mover una tirada, pulsa espacio o intro para cogerla, muévela con las flechas arriba y abajo y vuelve a pulsar espacio o intro para soltarla. Pulsa escape para cancelar.',
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
          <div className="pull-summary" ref={footRef}>
            <Toggle
              checked={countStarlight}
              onChange={(countStarlight) => onChange(withSettings({ countStarlight }))}
              tip={<StarlightDefinition />}
            >
              <span className="refund-label">
                {/*
                  El icono pegado a su palabra, como en «Convertir Esquirlas💠 en Jades💎» (tras el interruptor se
                  leía como parte del control); en el mismo bloque sin corte, para que no quede solo al partirse.
                */}
                <span>
                  Reinvertir{' '}
                  <span className="refund-word">
                    <ToggleTerm>Cosmiluz</ToggleTerm>
                    <Icon kind="starlight" size={20} decorative />
                  </span>{' '}
                  de las tiradas
                </span>
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
              content={
                <>
                  {/*
                    La cuenta del balance, como una cuenta escrita: concepto · signo · cifra, con los signos en su propia
                    columna (las operaciones se ven sin leer las cifras), la raya de la suma y el resultado. Con la Cosmiluz sin
                    reinvertir, su fila dice «—» (no aplica), en la columna de las cifras.
                  */}
                  <span className="tip-table tip-table-3" aria-hidden="true">
                    <TipSumRow label={`Tiradas el ${fmtDayMonth(result.targetDate)}`} value={result.wholeSingles} />
                    <TipSumRow label="Coste del plan" sign="−" value={grossTotal} />
                    <TipSumRow label="Cosmiluz reinvertida" sign="+" value={countStarlight ? refunded : null} />
                    <span className="tip-table-sum" />
                    <TipSumRow label={left < 0 ? 'Faltan' : 'Sobran'} value={Math.abs(left)} total />
                  </span>
                  <span className="sr-only">
                    {`${fmtInt(result.wholeSingles)} tiradas el ${formatDate(result.targetDate)}, menos ${fmtInt(grossTotal)} que cuesta el plan`}
                    {countStarlight ? `, más ${fmtInt(refunded)} de la Cosmiluz reinvertida` : ', sin reinvertir la Cosmiluz'}
                    {`: ${left < 0 ? 'faltan' : 'sobran'} ${fmtInt(Math.abs(left))}.`}
                  </span>
                </>
              }
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

/**
 * Una línea de una cuenta escrita (.tip-table-3): concepto · signo · cifra con su icono. Sin cifra (null), «—»
 * (no aplica), sin signo y con el hueco del icono reservado para que quede en la columna de las cifras.
 */
function TipSumRow({ label, sign, value, total }: { label: string; sign?: string; value: number | null; total?: boolean }) {
  return (
    <span className={total ? 'tip-table-row tip-table-total' : 'tip-table-row'}>
      <span>{label}</span>
      <span className="tip-table-sign">{value !== null && sign}</span>
      <span className="with-icon with-icon-tight tip-table-value">
        {value === null ? '—' : fmtInt(value)}
        <span className={value === null ? 'with-icon invisible' : 'with-icon'}>
          <Icon kind="pass" size={16} decorative />
        </span>
      </span>
    </span>
  );
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
        title="Arrastrar para cambiar el orden"
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
        sin nombre o si la imagen no carga. El tipo se elige al añadir la fila y no se cambia. Si la fila es un
        dupe, su Eidolón va en la esquina, como en la pestaña Cuenta (fuera del recorte de la miniatura).
      */}
      <span className="avatar">
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
        {dupe !== null && (
          <span className="eidolon-badge">E{dupe}</span>
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
          Con las probabilidades reales (no usa la casilla «50/50 ganado»).
        */}
        <span className="pull-chance">
          <span className="sr-only">Probabilidad: </span>
          {chance}
        </span>
        <NameCombobox
          inputClassName="pull-name"
          value={pull.name}
          entries={suggestions}
          aria-label={`Nombre (${KIND_LABEL[pull.kind].toLowerCase()})`}
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
            ? 'Con el garantizado, se gana seguro'
            : 'Marcada, el 50/50 se cuenta ganado; sin marcar, perdido (el doble de tiradas)'
        }
      >
        <input
          type="checkbox"
          checked={row.guaranteed || pull.winsFiftyFifty}
          disabled={row.guaranteed}
          aria-label={row.guaranteed ? `${label}: garantizado, se gana seguro` : `${label}: 50/50 ganado`}
          onChange={(e) => onUpdate({ winsFiftyFifty: e.target.checked })}
        />
        <span className="swap">
          <span className={row.guaranteed ? undefined : 'invisible'}>Garantizado</span>
          <span className={row.guaranteed ? 'invisible' : undefined}>50/50 ganado</span>
        </span>
      </label>

      <Tip
        as="div"
        className="pull-cost"
        content={
          <>
            {/*
              La cuenta del coste, como la del balance: el pity duro, menos el pity actual (solo en la primera fila
              de su tipo; en las demás «—», no aplica) y otra vez el pity duro si se pierde el 50/50.
            */}
            <span className="tip-table tip-table-3" aria-hidden="true">
              <TipSumRow label="Pity duro" value={row.hardPity} />
              <TipSumRow label="Pity actual" sign="−" value={row.usesPity ? row.pityDiscount : null} />
              <TipSumRow
                label={row.guaranteed ? 'Garantizado' : row.losesFiftyFifty ? '50/50 perdido' : '50/50 ganado'}
                sign="+"
                value={row.losesFiftyFifty ? row.hardPity : 0}
              />
              <span className="tip-table-sum" />
              <TipSumRow label="Coste" value={row.cost} total />
            </span>
            <span className="sr-only">
              {`${fmtInt(row.hardPity)} del pity duro`}
              {row.usesPity && `, menos ${fmtInt(row.pityDiscount)} del pity actual`}
              {row.losesFiftyFifty
                ? `, más ${fmtInt(row.hardPity)} por perder el 50/50`
                : row.guaranteed
                  ? ', con el garantizado'
                  : ', con el 50/50 ganado'}
              {`: ${fmtInt(row.cost)} tiradas.`}
            </span>
          </>
        }
      >
        <Icon kind="pass" size={26} decorative />
        <strong>{fmtInt(row.cost)}</strong>
        {/* El borde rojo del nombre no llega a los lectores de pantalla: lo dicen aquí. */}
        {!row.affordable && <span className="sr-only">, sin tiradas suficientes</span>}
      </Tip>

      <button type="button" className="btn btn-ghost btn-remove" aria-label={`Quitar ${label}`} onClick={onRemove}>
        <RemoveGlyph />
      </button>
    </div>
  );
}
