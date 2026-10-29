import { useRef, useState } from 'react';
import { byPath, fiveStarOnly, parseProfile, roster, withEidolon, type RosterEntry } from '../engine/account';
import { fold, type Catalog } from '../engine/catalog';
import { PATHS, type PathId } from '../engine/rules';
import type { AppState, OwnedCharacter } from '../engine/types';
import { characterPortraitUrl, pathIconUrl } from '../engine/urls';
import { namedNotice, type Notice, type ChangeState } from '../state/store';
import { EidolonShards } from './EidolonShards';
import { fmtInt, fmtMoment } from './format';
import { PLAIN_TEXT_INPUT } from './inputs';
import { KIND_GLYPH } from './kinds';
import { Tip } from './Tip';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  /** Personajes 5★ sincronizados: la lista para marcar a mano, y para quedarse solo con los 5★ al importar. */
  catalog: Catalog | null;
  onChange: ChangeState;
}

/** "1 personaje", "3 personajes". */
const countLabel = (n: number) => `${fmtInt(n)} ${n === 1 ? 'personaje' : 'personajes'}`;

/**
 * Pestaña Cuenta: los personajes 5★ que ya se tienen, con su Eidolón. Se marcan a mano en la lista de todos
 * los 5★ o se importan del profile.json del juego, que sustituye lo marcado. La planificación cuenta con
 * ellos para numerar los dupes.
 */
export function AccountPanel({ state, catalog, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  // Vías marcadas en el filtro; ninguna es todas.
  const [paths, setPaths] = useState<ReadonlySet<PathId>>(new Set());
  const entries = catalog?.character ?? null;
  const characters = fiveStarOnly(state.account.characters, entries);
  const { importedAt } = state.account;
  const all = roster(characters, entries);
  const shown = all.filter(
    (c) =>
      (!ownedOnly || c.eidolon !== null) &&
      (paths.size === 0 || (c.path !== undefined && paths.has(c.path))) &&
      fold(c.name).includes(fold(query.trim())),
  );
  const togglePath = (id: PathId) =>
    setPaths((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const groups = byPath(shown);
  // Cuántos se tienen de cada vía, de todos (no solo de los filtrados): el número no cambia al buscar.
  const ownedOf = (path: string | undefined) =>
    `${fmtInt(all.filter((c) => c.path === path && c.eidolon !== null).length)} de ${fmtInt(all.filter((c) => c.path === path).length)}`;
  const list = (characters: RosterEntry[]) => (
    <ul className="account-list">
      {characters.map((c) => (
        <AccountRow key={c.id} character={c} onSet={(e) => setEidolon(c, e)} />
      ))}
    </ul>
  );

  // Los dupes del plan salen de la cuenta al pintarlos: no hay que tocar el plan al cambiarla.
  const setCharacters = (update: (c: OwnedCharacter[]) => OwnedCharacter[], imported?: number, undo?: Notice) =>
    onChange(
      (s) => ({
        ...s,
        account: { characters: update(s.account.characters), importedAt: imported ?? s.account.importedAt },
      }),
      undo,
    );

  // Quitar uno que se tenía borra también su Eidolón: el aviso permite deshacerlo.
  const setEidolon = (c: RosterEntry, eidolon: number | null) =>
    setCharacters(
      (list) => withEidolon(list, c, eidolon),
      undefined,
      eidolon === null && c.eidolon !== null ? namedNotice('', c.name, ' eliminado de la cuenta.') : undefined,
    );

  // Sin backend: el archivo se lee aquí mismo, en el navegador, y no se envía a ningún sitio.
  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = fiveStarOnly(parseProfile(await file.text()), entries);
      const text = `${countLabel(imported.length)} ${imported.length === 1 ? 'importado' : 'importados'}.`;
      // Sustituye la lista (y lo marcado a mano): el aviso de abajo permite deshacerlo.
      setCharacters(() => imported, Date.now(), `Perfil importado: ${text}`);
      setMessage({ text, error: false });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'No se ha podido leer el archivo.', error: true });
    }
  };

  return (
    <>
      {/* Como en Configuración: la importación en la columna estrecha (arriba del todo en móvil). */}
      <aside className="col-aside">
        <section className="card account-import">
          <header className="card-header">
            <h2>Perfil</h2>
          </header>
          <p className="muted">
            {importedAt
              ? `Importado el ${fmtMoment(importedAt)}.`
              : 'Importar el perfil marca los personajes de la cuenta y sus Eidolones, en lugar de lo marcado a mano.'}
          </p>
          {/* El botón y su resultado juntos: vacío, el aviso no suma el hueco de la tarjeta bajo el botón. */}
          <div className="account-action">
            <Tip control content="Acepta el profile.json de Reliquary Archiver.">
              <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
                Importar perfil
              </button>
            </Tip>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void onImport(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {/* Siempre montado, para que el lector de pantalla anuncie el resultado. */}
            <div role="status">
              {message && <p className={`account-message${message.error ? ' is-error' : ''}`}>{message.text}</p>}
            </div>
          </div>
        </section>
      </aside>

      <div className="col-settings">
        <section className="card account-characters">
          <header className="card-header">
            <h2>Personajes</h2>
            {/* Cuántos se tienen de todos los 5★; sin catálogo no se sabe el total. */}
            <span className="muted account-count">
              {entries ? `${fmtInt(characters.length)} de ${fmtInt(all.length)}` : characters.length > 0 && countLabel(characters.length)}
            </span>
          </header>
          {!entries && (
            <p className="warning">
              {characters.length > 0
                ? 'Sin el contenido sincronizado solo se ven los importados, y no se distinguen los 4★. Se sincroniza en Configuración.'
                : 'Para marcar personajes hay que sincronizar el contenido (en Configuración) o importar el perfil.'}
            </p>
          )}
          {all.length > 0 && (
            /* Buscar arriba, solo y a su ancho; debajo, los filtros que recortan la lista (vías y obtenidos), juntos. */
            <div className="account-tools">
              <input
                type="search"
                className="account-search"
                placeholder="Buscar personaje"
                aria-label="Buscar personaje"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                {...PLAIN_TEXT_INPUT}
              />
              <div className="account-filters">
                {/*
                  Filtro por vías, con sus iconos como en el juego: se pueden marcar varias y «Todas» quita el filtro.
                  Solo si el catálogo trae las vías.
                */}
                {all.some((c) => c.path) && (
                  <div className="segmented path-filter" role="group" aria-label="Filtrar por vía">
                    <button type="button" className="segment" aria-pressed={paths.size === 0} onClick={() => setPaths(new Set())}>
                      Todas
                    </button>
                    {PATHS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="segment path-option"
                        aria-pressed={paths.has(p.id)}
                        aria-label={p.name}
                        onClick={() => togglePath(p.id)}
                      >
                        <PathIcon icon={p.icon} />
                      </button>
                    ))}
                  </div>
                )}
                <Toggle checked={ownedOnly} onChange={setOwnedOnly}>
                  Ver solo obtenidos
                </Toggle>
              </div>
            </div>
          )}
          {all.length > 0 && shown.length === 0 && (
            <p className="muted">
              {ownedOnly && !query.trim() && paths.size === 0 ? 'Aún no hay ninguno marcado.' : 'No se ha encontrado ningún personaje.'}
            </p>
          )}
          {/* Por vías, en el orden del juego; sin vías (sin catálogo todavía), la lista sin agrupar. */}
          {shown.length > 0 &&
            (groups ? (
              <div className="account-groups">
                {groups.map(({ path, characters }) => (
                  <section key={path?.id ?? 'none'} className="account-group">
                    <h3 className="account-path">
                      {path && (
                        <PathIcon icon={path.icon} />
                      )}
                      {path?.name ?? 'Otras'}
                      <span className="account-path-count">{ownedOf(path?.id)}</span>
                    </h3>
                    {list(characters)}
                  </section>
                ))}
              </div>
            ) : (
              list(shown)
            ))}
        </section>
      </div>
    </>
  );
}

/** Un personaje: su retrato y nombre (pulsarlos marca o desmarca que se tiene) y sus seis Eidolones. */
function AccountRow({ character: c, onSet }: { character: RosterEntry; onSet: (eidolon: number | null) => void }) {
  const owned = c.eidolon !== null;
  return (
    <li className={owned ? 'account-row is-owned' : 'account-row'}>
      <button
        type="button"
        className="account-who"
        aria-pressed={owned}
        onClick={() => onSet(owned ? null : 0)}
      >
        {/* El Eidolón en la esquina del retrato, como en las fichas del juego; fuera del recorte redondo. */}
        <span className="avatar" aria-hidden="true">
          <span className="account-portrait">
            <span className={`glyph ${KIND_GLYPH.character}`} />
            <img
              src={characterPortraitUrl(c.id)}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              draggable={false}
              // Cargada, tapa el icono de reserva (ver .account-portrait en styles.css).
              onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          </span>
          {owned && <span className="eidolon-badge">E{c.eidolon}</span>}
        </span>
        <span className="account-name">{c.name}</span>
      </button>
      <EidolonShards name={c.name} eidolon={c.eidolon} onChange={onSet} />
    </li>
  );
}

/** Icono de una vía (PNG blanco de StarRailRes usado como máscara, para que tome el color del texto). */
function PathIcon({ icon }: { icon: string }) {
  return (
    <span className="path-icon" aria-hidden="true" style={{ '--path-icon': `url(${pathIconUrl(icon)})` }} />
  );
}
