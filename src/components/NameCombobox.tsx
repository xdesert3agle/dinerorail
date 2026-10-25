import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { searchCatalog, type CatalogEntry } from '../engine/catalog';
import { PLAIN_TEXT_INPUT } from './inputs';

interface Props {
  value: string;
  /** Nombre nuevo: el elegido del catálogo, vacío al borrar el campo o, sin catálogo, lo escrito. */
  onChange: (value: string) => void;
  /** Nombres que se pueden elegir. Sin catálogo es un campo de texto libre. */
  entries: CatalogEntry[];
  inputClassName?: string;
  'aria-label'?: string;
  /** Enfocar el campo al aparecer (fila recién añadida). */
  autoFocus?: boolean;
}

/**
 * Campo para elegir un nombre del catálogo escribiendo: lo escrito solo filtra las sugerencias y el
 * nombre cambia al elegir una (clic, flechas + Intro, Intro si solo queda una, o el nombre exacto al
 * salir). Si se sale sin elegir, vuelve el nombre que había; vaciar el campo deja la fila sin nombre.
 * Sin catálogo (aún no descargado) no hay nada que elegir y se acepta el texto tal cual.
 */
export function NameCombobox({
  value,
  onChange,
  entries,
  inputClassName,
  'aria-label': ariaLabel,
  autoFocus,
}: Props) {
  const listId = useId();
  const free = entries.length === 0;
  // Lo que se está escribiendo; null mientras no se escribe (el campo muestra el nombre elegido).
  // También en una ref: al elegir con Intro el campo se suelta en el mismo evento, y onBlur tiene que
  // ver ya la búsqueda terminada, no la de antes de elegir.
  const [query, setQueryState] = useState<string | null>(null);
  const queryRef = useRef<string | null>(null);
  const setQuery = (q: string | null) => {
    queryRef.current = q;
    setQueryState(q);
  };
  // -1: ninguna marcada a mano; con varias sugerencias, Intro no elige nada por su cuenta.
  const [active, setActive] = useState(-1);
  // Fuera del campo, el nombre lo pinta un <span> encima del input (cuyo texto queda transparente): dentro
  // de un input, un carácter que la fuente no tiene (la ★ de "Aeon ★ Aha") baja el texto y lo desalinea
  // de la etiqueta del dupe; en un <span> con interlineado fijo, no.
  const [focused, setFocused] = useState(false);
  const masked = !focused && value !== '';
  const suggestions = useMemo(() => (query ? searchCatalog(entries, query) : []), [entries, query]);
  const searching = !free && query !== null && query.trim() !== '';
  // Si lo escrito ya es exactamente la única sugerencia, no hace falta la lista.
  const exact = suggestions.length === 1 && suggestions[0].name === query;
  const shown = searching && !exact;
  // Con una sola sugerencia, ya va marcada: Intro la elige sin tener que bajar con la flecha.
  const highlighted = active >= 0 ? active : suggestions.length === 1 ? 0 : -1;

  const reset = () => {
    setQuery(null);
    setActive(-1);
  };
  const commit = (entry: CatalogEntry) => onChange(entry.name);
  const pick = (entry: CatalogEntry) => {
    commit(entry);
    reset();
  };
  // Al salir: un nombre escrito entero cuenta como elegido; el campo vacío quita el nombre; cualquier
  // otra cosa se descarta y vuelve el nombre de antes.
  const onBlur = () => {
    setFocused(false);
    if (free || queryRef.current === null) return;
    const typed = queryRef.current.trim().toLowerCase();
    const entry = typed ? entries.find((e) => e.name.toLowerCase() === typed) : undefined;
    if (entry) commit(entry);
    else if (!typed && value) onChange('');
    reset();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = suggestions.length;
    if (e.key === 'ArrowDown' && shown && n > 0) {
      e.preventDefault();
      setActive((i) => (i + 1) % n);
    } else if (e.key === 'ArrowUp' && shown && n > 0) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && searching) {
      e.preventDefault();
      if (highlighted >= 0) {
        pick(suggestions[highlighted]);
        // Elegido con Intro, el campo se suelta: el nombre ya está puesto.
        e.currentTarget.blur();
      }
    } else if (e.key === 'Escape' && query !== null) {
      e.preventDefault();
      reset();
    }
  };

  return (
    <div
      className={`combo${masked ? ' is-masked' : ''}${shown ? ' is-open' : ''}`}
    >
      <input
        type="text"
        {...PLAIN_TEXT_INPUT}
        className={inputClassName}
        value={free ? value : (query ?? value)}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        role={free ? undefined : 'combobox'}
        aria-autocomplete={free ? undefined : 'list'}
        aria-expanded={free ? undefined : shown}
        aria-controls={free || !shown ? undefined : listId}
        aria-activedescendant={shown && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        // Al entrar se selecciona todo: lo que se escriba empieza una búsqueda nueva.
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          if (free) return onChange(e.target.value);
          setQuery(e.target.value);
          setActive(-1);
        }}
        onKeyDown={free ? undefined : onKeyDown}
        onBlur={onBlur}
      />
      {masked && (
        <span className="combo-value" aria-hidden="true">
          {value}
        </span>
      )}
      {shown && (
        <ul id={listId} role="listbox" className="combo-list">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === highlighted}
              className="combo-option"
              // mousedown en vez de click: así el campo no pierde el foco (y la lista no se cierra) antes de elegir.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {s.name}
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className="combo-empty" role="option" aria-selected={false} aria-disabled="true">
              Sin coincidencias
            </li>
          )}
        </ul>
      )}
      {/* Cuántas sugerencias hay, para el lector de pantalla (la lista en sí no se anuncia al cambiar). */}
      <span className="sr-only" role="status">
        {shown && (suggestions.length === 0 ? 'Sin coincidencias' : `${suggestions.length} ${suggestions.length === 1 ? 'sugerencia' : 'sugerencias'}`)}
      </span>
    </div>
  );
}
