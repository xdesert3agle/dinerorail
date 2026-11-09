import type { Modifier } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useMemo, useRef, type RefObject } from 'react';
import type { Result } from '../engine/calculate';
import { entryOf, type Catalog, type CatalogEntry } from '../engine/catalog';
import { dupeOf, type RowCopy } from '../engine/dupes';
import { planBalance, planPulls } from '../engine/pulls';
import type { AppState, PlannedPull, PullKind } from '../engine/types';
import { characterPortraitUrl, lightConeIconUrl, lightConeImageUrl } from '../engine/urls';
import { newId } from '../engine/util';
import type { ChangeState, Notice } from '../state/store';
import { KIND_GLYPH, KIND_LABEL } from './kinds';
import { PlanFooter } from './PlanFooter';
import { PullRow } from './PullRow';
import { moveById, SortableList, useDustRemoval } from './SortableRows';
import { useFocusNew } from './useFocusNew';

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
    copies,
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
          ? { before: '«', name: pull.name, after: `${dupe === null ? '' : ` E${dupe}`}» eliminado del plan.` }
          : 'Fila eliminada del plan.',
      ),
    );
  // Miniatura de cada fila: el retrato del personaje o el icono del cono (null si no está en el catálogo).
  // Del cono, primero el de StarRailRes y, si no lo tiene, el de nanoka.
  const portraitOf = (pull: PlannedPull) => {
    const entry = catalog ? entryOf(pull, catalog[pull.kind]) : null;
    if (!entry) return null;
    return pull.kind === 'character'
      ? [characterPortraitUrl(entry.id)]
      : [lightConeIconUrl(entry.id), lightConeImageUrl(entry.id)];
  };
  // La fila recién añadida enfoca su nombre para poder escribir directamente (una sola vez, ver useFocusNew).
  const [focusId, setFocusId] = useFocusNew(plan.map((p) => p.id));
  const add = (kind: PullKind) => {
    const id = newId('pull');
    setFocusId(id);
    setPlan((p) => [...p, { id, name: '', kind, winsFiftyFifty: false }]);
  };

  // En vertical y sin salir de las filas (ver restrictToRows).
  const footRef = useRef<HTMLDivElement>(null);
  const modifiers = useMemo(() => [restrictToVerticalAxis, restrictToRows(footRef)], []);

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
        <p className="muted">Aún no hay nada planificado. Los personajes y conos de luz se añaden en el orden en que se quieren conseguir.</p>
      ) : (
        <div className="pull-list">
          <SortableList
            items={plan.map((p) => ({ id: p.id, name: p.name || KIND_LABEL[p.kind] }))}
            modifiers={modifiers}
            onMove={(activeId, overId) => setPlan((p) => moveById(p, activeId, overId))}
          >
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
          </SortableList>

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
