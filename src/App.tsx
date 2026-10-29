import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AccountPanel } from './components/AccountPanel';
import { ContentSync } from './components/ContentSync';
import { CurrentInventory } from './components/CurrentInventory';
import { DupeGallery } from './components/DupeGallery';
import { FuturePulls } from './components/FuturePulls';
import { Icon } from './components/Icon';
import { Odds } from './components/Odds';
import { PatchTable } from './components/PatchTable';
import { PitySettings } from './components/PitySettings';
import { Breakdown, ResultSummary } from './components/ResultSummary';
import { ShardPacks } from './components/ShardPacks';
import { SourcesPanel } from './components/SourcesPanel';
import { StoreSettings } from './components/StoreSettings';
import { TargetDate } from './components/TargetDate';
import { Toast, type ToastMessage } from './components/Toast';
import { usePlanOdds } from './components/usePlanOdds';
import { calculate } from './engine/calculate';
import { FALLBACK_VERSION, withCatalogIds } from './engine/catalog';
import { planCopies, planDupes, planLightCones } from './engine/dupes';
import type { Skin, ThemeMode } from './engine/types';
import { useCatalog } from './state/catalog';
import { SKINS, useAppState, withSettings, type ChangeState } from './state/store';
import { useToday } from './state/today';

const SKIN_OPTIONS: Record<Skin, { label: string; title: string }> = {
  aha: { label: 'Aha', title: 'Tema Aha: rojo y máscaras de la Exultación' },
  sparxie: { label: 'Sparxie', title: 'Tema Sparxie: escritorio de 1987, ventanas crema sobre rosa' },
};

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

type Tab = 'main' | 'account' | 'settings';

// Iconos de 16px con el color del texto de la pestaña: calculadora, persona y deslizadores de ajustes.
const TAB_ICONS: Record<Tab, ReactNode> = {
  main: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
      <rect x="5.25" y="3.75" width="5.5" height="2.5" rx="0.5" />
      <g fill="currentColor" stroke="none">
        {[5.75, 8, 10.25].map((x) => [9, 11.75].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" />))}
      </g>
    </svg>
  ),
  account: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="5.25" r="2.75" />
      <path d="M2.75 14.25a5.25 5.25 0 0 1 10.5 0" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4h1.25M6.75 4H14M2 8h7.25M12.75 8H14M2 12h3.25M8.75 12H14" />
      <circle cx="5" cy="4" r="1.75" />
      <circle cx="11" cy="8" r="1.75" />
      <circle cx="7" cy="12" r="1.75" />
    </svg>
  ),
};

/** Cada pestaña con su nombre y su hash; TAB_ORDER, el orden en que se muestran. */
const TABS: Record<Tab, { label: string; hash: string }> = {
  main: { label: 'Calculadora', hash: '' },
  account: { label: 'Cuenta', hash: '#cuenta' },
  settings: { label: 'Configuración', hash: '#configuracion' },
};
const TAB_ORDER: Tab[] = ['main', 'account', 'settings'];
// La pestaña vive en el hash de la URL: sobrevive a recargas y el botón Atrás vuelve a la anterior.
const tabFromHash = (): Tab => {
  const hash = window.location.hash;
  return TAB_ORDER.find((id) => TABS[id].hash && TABS[id].hash === hash) ?? 'main';
};

export default function App() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Un cambio de otra pestaña también cierra el aviso de deshacer (ver `change`).
  const [state, setState] = useAppState(() => setToast((t) => (t?.undo ? null : t)));
  const catalogSync = useCatalog();
  const today = useToday();
  // Cada aviso con su id: uno nuevo reinicia la cuenta atrás aunque repita el texto.
  const toastId = useRef(0);
  const notify = (message: Omit<ToastMessage, 'id'>) => setToast({ ...message, id: ++toastId.current });
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const mainRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // Los borrados guardan el estado de antes para poder deshacerlos desde el aviso. El de ahora, no el del render
  // en que se creó `change`: la fila que se deshace en polvo lo llama 600 ms después, y con el de entonces
  // deshacer devolvía también lo quitado en medio.
  const latest = useRef(state);
  latest.current = state;
  // Con un aviso de deshacer a la vista, cualquier otro cambio lo cierra: su foto es de antes de ese cambio, y
  // deshacer se lo llevaría también.
  const change: ChangeState = (update, undo) => {
    if (undo) notify({ text: undo, undo: latest.current });
    else setToast((t) => (t?.undo ? null : t));
    setState(update);
  };
  const undoLast = () => {
    if (toast?.undo) setState(toast.undo);
  };

  // Las filas del plan siguen al catálogo: guardan su id y toman el nombre actual (lo beta, en inglés, cambia
  // al traducirse). Sin pasar por `change`: no es un cambio del usuario ni se deshace.
  const catalog = catalogSync.catalog;
  useEffect(() => {
    if (!catalog) return;
    setState((s) => {
      const plannedPulls = withCatalogIds(s.plannedPulls, catalog);
      return plannedPulls === s.plannedPulls ? s : { ...s, plannedPulls };
    });
  }, [catalog, state.plannedPulls, setState]);

  // El título de la pestaña del navegador dice en qué sección se está.
  useEffect(() => {
    const label = TABS[tab].label;
    document.title = tab === 'main' ? 'Dinero Rail' : `${label} · Dinero Rail`;
  }, [tab]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const selectTab = (id: Tab) => {
    const hash = TABS[id].hash;
    if (hash) window.location.hash = hash;
    else history.pushState(null, '', window.location.pathname + window.location.search);
    setTab(id);
  };

  // Flechas izquierda/derecha para moverse entre pestañas (patrón de tablist accesible).
  const onTabKey = (e: KeyboardEvent) => {
    const i = TAB_ORDER.indexOf(tab);
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TAB_ORDER.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const id = TAB_ORDER[(next + TAB_ORDER.length) % TAB_ORDER.length];
    selectTab(id);
    tabRefs.current[id]?.focus();
  };

  const result = useMemo(() => calculate(state, today), [state, today]);
  // Qué copia es cada fila (su dupe y la Cosmiluz de su 5★): lo usan la planificación, la previsión y la galería.
  const copies = useMemo(
    () => planCopies(state.plannedPulls, catalogSync.catalog?.character ?? null, state.account.characters),
    [state.plannedPulls, catalogSync.catalog, state.account.characters],
  );
  const dupes = useMemo(() => planDupes(copies), [copies]);
  const lightCones = useMemo(
    () => planLightCones(state.plannedPulls, catalogSync.catalog),
    [state.plannedPulls, catalogSync.catalog],
  );
  // La simulación del plan, una vez: el % de cada fila de la planificación y las estadísticas de la previsión.
  const planOdds = usePlanOdds(state, result, copies);
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

  // La barra del navegador en móvil (theme-color) con el fondo de la página del tema activo. Del fondo ya
  // calculado del <body> y no del token: --page es un light-dark(), que solo se resuelve al pintarse.
  useLayoutEffect(() => {
    const page = getComputedStyle(document.body).backgroundColor;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', page);
  }, [skin, theme, systemDark]);

  return (
    <div className="app">
      {/* Para teclado: salta la cabecera. Es un botón y no un enlace con hash, que aquí cambiaría de pestaña. */}
      <button type="button" className="btn skip-link" onClick={() => mainRef.current?.focus()}>
        Saltar al contenido
      </button>
      <header className="app-header">
        <h1 className="title">
          <Icon kind="jade" size={36} decorative />
          Dinero Rail
        </h1>
        <div className="header-actions">
          <div className="segmented" role="group" aria-label="Tema">
            {SKINS.map((id) => (
              <button
                key={id}
                type="button"
                className="segment"
                aria-pressed={skin === id}
                title={SKIN_OPTIONS[id].title}
                onClick={() => change(withSettings({ skin: id }))}
              >
                <span className={`swatch swatch-${id}`} aria-hidden="true" />
                {SKIN_OPTIONS[id].label}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Modo claro u oscuro">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="segment theme-option"
                aria-pressed={activeTheme === t.id}
                aria-label={t.title}
                title={t.title}
                onClick={() => change(withSettings({ theme: t.id }))}
              >
                {THEME_ICONS[t.id]}
              </button>
            ))}
          </div>
        </div>
      </header>
      <nav className="tabs" role="tablist" aria-label="Secciones" onKeyDown={onTabKey}>
        {TAB_ORDER.map((id) => ({ id, ...TABS[id] })).map((t) => (
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
            aria-controls={tab === t.id ? `panel-${t.id}` : undefined}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => selectTab(t.id)}
          >
            {TAB_ICONS[t.id]}
            {t.label}
          </button>
        ))}
      </nav>
      <Toast message={toast} onUndo={undoLast} onClose={() => setToast(null)} />

      {tab === 'main' && <DupeGallery dupes={dupes} lightCones={lightCones} version={catalogSync.catalog?.version ?? FALLBACK_VERSION} />}
      {/* Un solo <main> (destino del salto de teclado); dentro, el panel de la pestaña activa. */}
      <main ref={mainRef} tabIndex={-1} className="main">
        {tab === 'main' ? (
          <div className="layout" role="tabpanel" id="panel-main" aria-labelledby="tab-main">
            <div className="col-inputs">
              {/* Primero lo que se actualiza en cada visita (los recursos); la fecha se cambia pocas veces. */}
              <CurrentInventory state={state} result={result} onChange={change} />
              <TargetDate state={state} today={today} onChange={change} />
              <PatchTable state={state} today={today} onChange={change} />
              <ShardPacks state={state} onChange={change} />
            </div>
            <aside className="col-results">
              <ResultSummary result={result} skin={skin} />
              <FuturePulls
                state={state}
                result={result}
                catalog={catalogSync.catalog}
                copies={copies}
                chances={planOdds?.pct ?? []}
                onChange={change}
              />
              <Odds state={state} view={planOdds} />
              <Breakdown result={result} />
            </aside>
          </div>
        ) : tab === 'account' ? (
          <div className="layout-settings" role="tabpanel" id="panel-account" aria-labelledby="tab-account">
            <AccountPanel state={state} catalog={catalogSync.catalog} onChange={change} />
          </div>
        ) : (
          <div className="layout-settings" role="tabpanel" id="panel-settings" aria-labelledby="tab-settings">
            {/* Columna estrecha a la derecha en escritorio; en móvil va arriba del todo. */}
            <aside className="col-aside">
              <ContentSync {...catalogSync} />
              <StoreSettings state={state} onChange={change} />
            </aside>
            <div className="col-settings">
              <PitySettings state={state} onChange={change} />
              <SourcesPanel state={state} today={today} totals={totals} onChange={change} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
