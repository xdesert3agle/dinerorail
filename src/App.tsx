import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
import type { Skin } from './engine/types';
import { exportState, importState, useAppState } from './state/store';

const SKINS: { id: Skin; label: string; title: string }[] = [
  { id: 'kafka', label: 'Kafka', title: 'Tema Kafka: magenta y telaraña' },
  { id: 'aha', label: 'Aha', title: 'Tema Aha: rojo y máscaras de la Exultación' },
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

  // El tema se aplica en <html> para que las variables de color lleguen a toda la página.
  useLayoutEffect(() => {
    document.documentElement.dataset.skin = skin;
  }, [skin]);

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
            {SKINS.map((s) => (
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
