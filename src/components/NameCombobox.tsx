import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { searchCatalog, type CatalogEntry } from '../engine/catalog';
import { PLAIN_TEXT_INPUT } from './inputs';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /**
   * Se ha elegido un nombre del catálogo (sugerencia, o el nombre exacto escrito al salir del campo).
   * Si no se pasa, se pone el nombre tal cual.
   */
  onCommit?: (entry: CatalogEntry) => void;
  /** Nombres que se sugieren. Sin catálogo es un campo de texto normal. */
  entries: CatalogEntry[];
  placeholder?: string;
  inputClassName?: string;
  'aria-label'?: string;
}

/**
 * Campo de texto libre con sugerencias del catálogo mientras se escribe. Solo se autocompleta si se
 * elige una sugerencia (clic, o flechas + Intro); si no, se queda lo escrito tal cual.
 */
export function NameCombobox({ value, onChange, onCommit, entries, placeholder, inputClassName, 'aria-label': ariaLabel }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  // -1: ninguna marcada, así Intro no elige nada por su cuenta.
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => searchCatalog(entries, value), [entries, value]);
  // Si lo escrito ya es exactamente la única sugerencia, no hace falta la lista.
  const exact = suggestions.length === 1 && suggestions[0].name === value;
  const shown = open && suggestions.length > 0 && !exact;

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const commit = (entry: CatalogEntry) => (onCommit ? onCommit(entry) : onChange(entry.name));
  const pick = (entry: CatalogEntry) => {
    commit(entry);
    close();
  };
  // Al salir, un nombre escrito entero (sin elegirlo de la lista) cuenta como elegido.
  const onBlur = () => {
    close();
    const typed = value.trim().toLowerCase();
    const entry = typed ? entries.find((e) => e.name.toLowerCase() === typed) : undefined;
    if (entry) commit(entry);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = suggestions.length;
    if (e.key === 'ArrowDown' && n > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (shown ? (i + 1) % n : 0));
    } else if (e.key === 'ArrowUp' && shown) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && shown) {
      e.preventDefault();
      if (active >= 0) pick(suggestions[active]);
      else close();
    } else if (e.key === 'Escape' && shown) {
      e.preventDefault();
      close();
    }
  };

  return (
    <div className={`combo${shown ? ' is-open' : ''}`}>
      <input
        type="text"
        {...PLAIN_TEXT_INPUT}
        className={inputClassName}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
      {shown && (
        <ul id={listId} role="listbox" className="combo-list">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
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
        </ul>
      )}
    </div>
  );
}
