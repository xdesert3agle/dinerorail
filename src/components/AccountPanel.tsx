import { useRef, useState } from 'react';
import { clampEidolon, fiveStarOnly, parseProfile } from '../engine/account';
import type { Catalog } from '../engine/catalog';
import { MAX_EIDOLON } from '../engine/rules';
import type { AppState, OwnedCharacter } from '../engine/types';
import { fmtMoment } from './format';
import { NumberField } from './NumberField';

interface Props {
  state: AppState;
  /** Personajes 5★ sincronizados: para quedarse solo con los 5★ y usar sus nombres. */
  catalog: Catalog | null;
  onChange: (update: (s: AppState) => AppState) => void;
}

/**
 * Pestaña Cuenta: los personajes 5★ que ya se tienen, con su Eidolón. Se importan del profile.json del
 * juego y se pueden corregir a mano. La planificación cuenta con ellos para numerar los dupes.
 */
export function AccountPanel({ state, catalog, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const entries = catalog?.character ?? null;
  const characters = fiveStarOnly(state.account.characters, entries);
  const { importedAt } = state.account;

  // Los dupes del plan salen de la cuenta al pintarlos: no hay que tocar el plan al cambiarla.
  const setCharacters = (update: (c: OwnedCharacter[]) => OwnedCharacter[], imported?: number) =>
    onChange((s) => ({
      ...s,
      account: { characters: update(s.account.characters), importedAt: imported ?? s.account.importedAt },
    }));

  const setEidolon = (id: string, eidolon: number) =>
    setCharacters((list) => list.map((c) => (c.id === id ? { ...c, eidolon: clampEidolon(eidolon) } : c)));

  // Sin backend: el archivo se lee aquí mismo, en el navegador, y no se envía a ningún sitio.
  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = fiveStarOnly(parseProfile(await file.text()), entries);
      setCharacters(() => imported, Date.now());
      setMessage({ text: `${imported.length} personajes importados.`, error: false });
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
              : 'Sube el profile.json exportado con Reliquary Archiver para cargar tus personajes y sus Eidolones.'}
          </p>
          <p className="muted small">El archivo se lee en el navegador: no se envía a ningún sitio. Los conos de luz no se cuentan.</p>
          <div>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Subir profile.json
            </button>
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
          </div>
          {message && (
            <p className={message.error ? 'account-error' : 'muted small'} role={message.error ? 'alert' : 'status'}>
              {message.text}
            </p>
          )}
        </section>
      </aside>

      <div className="col-settings">
        <section className="card">
          <header className="card-header">
            <h2>Personajes</h2>
            <span className="muted">{characters.length > 0 && `${characters.length} personajes 5★`}</span>
          </header>
          {!entries && characters.length > 0 && (
            <p className="warning">
              Sin el contenido sincronizado no se distinguen los 4★: se muestran todos. Sincronízalo en Configuración.
            </p>
          )}
          {characters.length === 0 ? (
            <p className="muted">Aún no hay personajes. Sube tu profile.json para rellenar la lista.</p>
          ) : (
            <div className="account-list">
              {characters.map((c) => (
                <div key={c.id} className="account-row">
                  <span className="account-name" title={c.name}>
                    {c.name}
                  </span>
                  <span className="account-eidolon">
                    <span aria-hidden="true">E</span>
                    <NumberField
                      compact
                      hideLabel
                      label={`Eidolón de ${c.name}`}
                      value={c.eidolon}
                      min={0}
                      max={MAX_EIDOLON}
                      onChange={(v) => setEidolon(c.id, v)}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
