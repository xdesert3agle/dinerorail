import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CurrentInventory } from './components/CurrentInventory';
import { FuturePulls } from './components/FuturePulls';
import { Icon } from './components/Icon';
import { Odds } from './components/Odds';
import { PatchTable } from './components/PatchTable';
import { PitySettings } from './components/PitySettings';
import { Breakdown, ResultSummary } from './components/ResultSummary';
import { ShardPacks } from './components/ShardPacks';
import { SourcesPanel } from './components/SourcesPanel';
import { calculate } from './engine/calculate';
import { todayISO } from './engine/dates';
import type { Skin, ThemeMode } from './engine/types';
import { exportState, HIDDEN_SKINS, importState, useAppState } from './state/store';

const SKINS: { id: Skin; label: string; title: string }[] = [
  { id: 'kafka', label: 'Kafka', title: 'Tema Kafka: magenta y telaraña' },
  { id: 'aha', label: 'Aha', title: 'Tema Aha: rojo y máscaras de la Exultación' },
  { id: 'grafito', label: 'Grafito', title: 'Tema Grafito: gris grafito, verde esmeralda y líneas finas' },
  { id: 'sparxie', label: 'Sparxie', title: 'Tema Sparxie: escritorio de 1987, ventanas crema sobre rosa' },
];

/** Modos que se eligen a mano; "system" no tiene botón: es el punto de partida hasta que se pulsa uno. */
type ManualTheme = Exclude<ThemeMode, 'system'>;

// Iconos de 14px con el color del texto: sol (claro) y luna (oscuro).
const THEME_ICONS: Record<ManualTheme, ReactNode> = {
  light: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
    </svg>
  ),
  dark: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
    </svg>
  ),
};

const THEMES: { id: ManualTheme; title: string }[] = [
  { id: 'light', title: 'Modo claro' },
  { id: 'dark', title: 'Modo oscuro' },
];

type Tab = 'main' | 'settings';
const TABS: { id: Tab; label: string; hash: string }[] = [
  { id: 'main', label: 'Calculadora', hash: '' },
  { id: 'settings', label: 'Configuración', hash: '#configuracion' },
];
// La pestaña vive en el hash de la URL: sobrevive a recargas y el botón Atrás vuelve a la anterior.
// "#fuentes" es el nombre antiguo de la pestaña de configuración.
const tabFromHash = (): Tab => {
  const hash = window.location.hash;
  return TABS.find((t) => t.hash && t.hash === hash)?.id ?? 'main';
};

export default function App() {
  const [state, setState] = useAppState();
  const [today] = useState(todayISO);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const fileInput = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const selectTab = (id: Tab) => {
    const hash = TABS.find((t) => t.id === id)!.hash;
    if (hash) window.location.hash = hash;
    else history.pushState(null, '', window.location.pathname + window.location.search);
    setTab(id);
  };

  // Flechas izquierda/derecha para moverse entre pestañas (patrón de tablist accesible).
  const onTabKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const id = TABS[(next + TABS.length) % TABS.length].id;
    selectTab(id);
    tabRefs.current[id]?.focus();
  };

  const result = useMemo(() => calculate(state, today), [state, today]);
  const totals = useMemo(() => new Map(result.bySource.map((t) => [t.sourceId, t])), [result]);
  const skin = state.settings.skin;
  const theme = state.settings.theme;
  // Con "system" se marca el botón del modo que el sistema tiene ahora, y se sigue si cambia.
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  const activeTheme: ManualTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // El tema se aplica en <html> para que las variables de color lleguen a toda la página.
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = skin;
  }, [skin]);

  // Claro u oscuro a mano con data-theme; sin él, el CSS sigue al sistema (prefers-color-scheme).
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      setState(await importState(file));
      setMessage('Datos importados.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se ha podido leer el archivo.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="title">
          <Icon kind="jade" size={36} decorative />
          Calculadora de Jades
        </h1>
        <div className="header-actions">
          <div className="skin-switch" role="group" aria-label="Tema">
            {SKINS.filter((s) => !HIDDEN_SKINS.includes(s.id)).map((s) => (
              <button
                key={s.id}
                type="button"
                className="skin-option"
                aria-pressed={skin === s.id}
                title={s.title}
                onClick={() => setState((st) => ({ ...st, settings: { ...st.settings, skin: s.id } }))}
              >
                <span className={`swatch swatch-${s.id}`} aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
          <div className="skin-switch" role="group" aria-label="Modo claro u oscuro">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="skin-option theme-option"
                aria-pressed={activeTheme === t.id}
                aria-label={t.title}
                title={t.title}
                onClick={() => setState((st) => ({ ...st, settings: { ...st.settings, theme: t.id } }))}
              >
                {THEME_ICONS[t.id]}
              </button>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => exportState(state)}>
            Exportar JSON
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Importar JSON
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
      </header>
      <nav className="tabs" role="tablist" aria-label="Secciones" onKeyDown={onTabKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            className="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {message && (
        <p className="notice" role="status" onClick={() => setMessage(null)}>
          {message}
        </p>
      )}

      {tab === 'main' ? (
        <main className="layout" role="tabpanel" id="panel-main" aria-labelledby="tab-main">
          <div className="col-inputs">
            <CurrentInventory state={state} today={today} onChange={setState} />
            <PatchTable state={state} today={today} onChange={setState} />
            <ShardPacks state={state} onChange={setState} />
          </div>
          <aside className="col-results">
            <ResultSummary result={result} skin={skin} />
            <FuturePulls state={state} result={result} onChange={setState} />
            <Odds state={state} result={result} />
            <Breakdown result={result} />
          </aside>
        </main>
      ) : (
        <main className="layout-single" role="tabpanel" id="panel-settings" aria-labelledby="tab-settings">
          <PitySettings state={state} onChange={setState} />
          <SourcesPanel state={state} today={today} totals={totals} onChange={setState} />
        </main>
      )}
    </div>
  );
}
