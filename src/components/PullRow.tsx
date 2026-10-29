import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { CatalogEntry } from '../engine/catalog';
import type { PlannedPullResult } from '../engine/pulls';
import type { PlannedPull } from '../engine/types';
import { fmtInt } from './format';
import { Icon } from './Icon';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { reducedMotion } from './motion';
import { NameCombobox } from './NameCombobox';
import { RemoveGlyph } from './RemoveGlyph';
import { Tip } from './Tip';
import { TipSumRow } from './TipSumRow';

/** Cuánto dura el polvo de una fila quitada y hasta dónde se dispersan sus píxeles (px del desplazamiento). */
const DUST_MS = 600;
const DUST_SCALE = 70;

/** Cómo encaja una fila desplazada en su nuevo hueco al reordenar: rápida y con un rebote leve al llegar. */
const SNAP_TRANSITION = { duration: 180, easing: 'cubic-bezier(0.3, 1.35, 0.5, 1)' };

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

interface Props {
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

export function PullRow({
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
}: Props) {
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
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        filter: leaving ? `url(#${dustId})` : undefined,
        '--dust-ms': `${DUST_MS}ms`,
      }}
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
          onChange={(name, entry) => onUpdate({ name, entryId: entry?.id })}
          autoFocus={autoFocus}
        />
      </div>

      {/*
        Con el garantizado, la primera fila de ese banner se gana seguro: la casilla queda fija y dice
        «Garantizado». Los dos textos ocupan el mismo hueco para que la columna no cambie de ancho. Lo que cuesta
        cada caso lo dice la cuenta del coste, al lado («50/50 perdido + 80»), sin otra explicación aquí.
      */}
      <label className="check pull-win">
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
