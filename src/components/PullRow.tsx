import type { CatalogEntry } from '../engine/catalog';
import type { PlannedPullResult } from '../engine/pulls';
import { fiftyFiftyName } from '../engine/rules';
import type { PlannedPull } from '../engine/types';
import { fmtInt } from './format';
import { Icon } from './Icon';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { NameCombobox } from './NameCombobox';
import { RemoveGlyph } from './RemoveGlyph';
import { DragHandle, DustFilter, useSortableRow } from './SortableRows';
import { Tip } from './Tip';
import { TipSumRow } from './TipSumRow';

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
  /** Se reinvierte la Cosmiluz: la fila enseña la que se espera obtener. */
  countStarlight: boolean;
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
  countStarlight,
  onUpdate,
  autoFocus,
  leaving,
  onRemove,
}: Props) {
  const sortable = useSortableRow(pull.id, leaving);
  const label = pull.name || KIND_LABEL[pull.kind];
  // «50/50» o «75/25», el de su banner; mismo ancho, así la columna no cambia entre filas.
  const bet = fiftyFiftyName(pull.kind);
  // Cómo acaba la apuesta en el peor caso; lo dicen la cuenta del coste y la de la Cosmiluz.
  const betLabel = row.guaranteed ? 'Garantizado' : `${bet} ${row.losesFiftyFifty ? 'perdido' : 'ganado'}`;
  // La Cosmiluz esperada, en enteros: solo la de los 4★ lleva decimales, así que la suma redondeada cuadra.
  const fourStarStarlight = Math.round(row.fourStarStarlight);
  const starlight = fourStarStarlight + row.lostStarlight + row.targetStarlight;

  return (
    <div
      ref={sortable.setNodeRef}
      className={`pull-row ${sortable.className}${row.affordable ? '' : ' is-short'}`}
      style={sortable.style}
    >
      <DustFilter id={pull.id} leaving={leaving} />
      <DragHandle handle={sortable.handle} label={label} />

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
          Con las probabilidades reales (no usa la casilla «50/50 ganado» o «75/25 ganado»).
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
          aria-label={row.guaranteed ? `${label}: garantizado` : `${label}: ${bet} ganado`}
          onChange={(e) => onUpdate({ winsFiftyFifty: e.target.checked })}
        />
        <span className="swap">
          <span className={row.guaranteed ? undefined : 'invisible'}>Garantizado</span>
          <span className={row.guaranteed ? 'invisible' : undefined}>{bet} ganado</span>
        </span>
      </label>

      {/*
        La Cosmiluz que se espera obtener en la fila, en la misma pastilla que lo que devuelve en el pie. Sin
        reinvertirla, el hueco se reserva (nada se mueve al encender el interruptor).
      */}
      <Tip
        className={`pull-starlight data-pill with-icon with-icon-tight${countStarlight ? '' : ' invisible'}`}
        content={
          <>
            {/*
              La cuenta de la Cosmiluz, como la del coste: la de los 4★ esperados en sus tiradas, la del 5★ que
              sale al perder el 50/50 (o el 75/25) y la del 5★ buscado, según su copia.
            */}
            <span className="tip-table tip-table-3" aria-hidden="true">
              <TipSumRow icon="starlight" label="4★ esperados" value={fourStarStarlight} />
              <TipSumRow icon="starlight" label={betLabel} sign="+" value={row.lostStarlight} />
              <TipSumRow icon="starlight" label="5★ buscado" sign="+" value={row.targetStarlight} />
              <span className="tip-table-sum" />
              <TipSumRow icon="starlight" label="Cosmiluz esperada" value={starlight} total />
            </span>
            <span className="sr-only">
              {`${fmtInt(fourStarStarlight)} de los 4★ esperados`}
              {row.losesFiftyFifty && `, más ${fmtInt(row.lostStarlight)} del 5★ del ${bet} perdido`}
              {`, más ${fmtInt(row.targetStarlight)} del 5★ buscado: ${fmtInt(starlight)} de Cosmiluz.`}
            </span>
          </>
        }
      >
        <Icon kind="starlight" size={16} decorative />
        <span className="data-pill-num" aria-hidden="true">
          +{fmtInt(starlight)}
        </span>
        <span className="sr-only">{`${fmtInt(starlight)} de Cosmiluz esperada`}</span>
      </Tip>

      <Tip
        as="div"
        className="pull-cost"
        content={
          <>
            {/*
              La cuenta del coste, como la del balance: el límite de pity (el de Configuración; el del juego va en
              la previsión), menos el pity actual (solo en la primera fila de su tipo; en las demás
              «—», no aplica) y otra vez el límite si se pierde el 50/50 (o el 75/25).
            */}
            <span className="tip-table tip-table-3" aria-hidden="true">
              <TipSumRow label="Límite de pity" value={row.hardPity} />
              <TipSumRow label="Pity actual" sign="−" value={row.usesPity ? row.pityDiscount : null} />
              <TipSumRow label={betLabel} sign="+" value={row.losesFiftyFifty ? row.hardPity : 0} />
              <span className="tip-table-sum" />
              <TipSumRow label="Coste" value={row.cost} total />
            </span>
            <span className="sr-only">
              {`${fmtInt(row.hardPity)} del límite de pity`}
              {row.usesPity && `, menos ${fmtInt(row.pityDiscount)} del pity actual`}
              {row.losesFiftyFifty
                ? `, más ${fmtInt(row.hardPity)} por perder el ${bet}`
                : row.guaranteed
                  ? ', con el garantizado'
                  : `, con el ${bet} ganado`}
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
