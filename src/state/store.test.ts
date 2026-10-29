import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultState } from '../engine/defaults';
import { normalizeState, sameAsSaved } from './store';

describe('normalizeState', () => {
  it('fuentes predefinidas: nombre y descripción de la versión actual; su calendario guardado se respeta', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.sources = old.sources.map((s: any) => {
      if (s.id === 'apocalyptic-shadow') return { ...s, name: 'Sombra Apocalíptica', description: 'vieja' };
      if (s.id === 'pure-fiction') return { ...s, schedule: { type: 'cycle', anchor: '2026-10-20', periodDays: 42 } };
      return s;
    });
    const state = normalizeState(old);
    const byId = (id: string) => state.sources.find((s) => s.id === id)!;
    const def = defaultState().sources.find((s) => s.id === 'apocalyptic-shadow')!;
    expect([byId('apocalyptic-shadow').name, byId('apocalyptic-shadow').description]).toEqual([def.name, def.description]);
    expect(byId('pure-fiction').schedule).toEqual({ type: 'cycle', anchor: '2026-10-20', periodDays: 42 });
  });

  it('el modo claro/oscuro sigue al sistema en datos antiguos o inválidos y conserva uno válido', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    delete old.settings.theme;
    expect(normalizeState(old).settings.theme).toBe('system');

    old.settings.theme = 'sepia';
    expect(normalizeState(old).settings.theme).toBe('system');

    old.settings.theme = 'dark';
    expect(normalizeState(old).settings.theme).toBe('dark');
  });

  it('pasa al tema por defecto a quien tenga guardado un tema que ya no existe', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    for (const hidden of ['kafka', 'grafito']) {
      old.settings.skin = hidden;
      expect(normalizeState(old).settings.skin).toBe('aha');
    }
  });

  it('las cantidades guardadas, enteras y no negativas (inventario y eventos)', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.inventory = { jades: -50, specialPasses: 3.7, shards: 'x', starlight: 41.9 };
    old.patches[0].events[0].jades = -10;
    const state = normalizeState(old);
    expect(state.inventory).toEqual({ jades: 0, specialPasses: 3, shards: 0, starlight: 41 });
    expect(state.patches[0].events[0].jades).toBe(0);
  });

  it('rechaza lo que no es un estado guardado', () => {
    expect(() => normalizeState({ foo: 1 })).toThrow();
  });

  it('la cuenta: vacía si falta (datos antiguos), sin repetidos y con el Eidolón entre 0 y 6', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    delete old.account;
    expect(normalizeState(old).account).toEqual({ characters: [], importedAt: null });

    old.account = {
      importedAt: 1760000000000,
      characters: [
        { id: '1308', name: 'Acheron', eidolon: 2 },
        { id: '1005', name: 'Kafka', eidolon: 9 },
        { id: '1005', name: 'Kafka', eidolon: 1 },
        { name: 'Sin id', eidolon: 1 },
        { id: '1006', eidolon: -1 },
      ],
    };
    expect(normalizeState(old).account).toEqual({
      importedAt: 1760000000000,
      characters: [
        { id: '1006', name: '1006', eidolon: 0 },
        { id: '1308', name: 'Acheron', eidolon: 2 },
        { id: '1005', name: 'Kafka', eidolon: 6 },
      ],
    });
  });

  it('tiradas por 5★: enteras y desde 1, o las de por defecto; el pity se guarda tal cual (entero ≥ 0)', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.settings.hardPity = { character: 90.7, lightCone: 0 };
    old.pity = { character: 120, lightCone: -3 };
    const state = normalizeState(old);
    expect(state.settings.hardPity).toEqual({ character: 90, lightCone: 70 });
    // Por encima del máximo se guarda igual: el que cuenta lo limita effectivePity (ver pulls.test.ts).
    expect(state.pity).toEqual({ character: 120, lightCone: 0 });

    delete old.settings.hardPity;
    expect(normalizeState(old).settings.hardPity).toEqual({ character: 80, lightCone: 70 });
  });

  it('paquetes: solo los conocidos, con cantidad entera y la 1.ª compra marcada si falta', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.shardPacks = {
      'pack-9999': { count: 2.6, firstBonus: false },
      'pack-1499': { count: -1 },
      'pack-inventado': { count: 3, firstBonus: true },
      'pack-4999': 'roto',
    };
    expect(normalizeState(old).shardPacks).toEqual({
      'pack-9999': { count: 2, firstBonus: false },
      'pack-1499': { count: 0, firstBonus: true },
    });
  });

  it('los interruptores de la tienda: los guardados si son booleanos; si no, los de por defecto', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.settings.packsInYen = true;
    old.settings.includePacks = false;
    expect(normalizeState(old).settings).toMatchObject({ packsInYen: true, includePacks: false });
    old.settings.packsInYen = 'sí';
    delete old.settings.includePacks;
    expect(normalizeState(old).settings).toMatchObject({ packsInYen: false, includePacks: true });
  });

  it('filas del plan: guardan el id del catálogo si lo tienen', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.plannedPulls = [
      { id: 'a', name: 'Kafka', entryId: '1005', kind: 'character', winsFiftyFifty: false },
      { id: 'b', name: 'Libre', kind: 'lightCone', winsFiftyFifty: true },
      { id: 'c', name: 'Roto', kind: 'otra cosa' },
    ];
    expect(normalizeState(old).plannedPulls).toEqual([
      { id: 'a', name: 'Kafka', entryId: '1005', kind: 'character', winsFiftyFifty: false },
      { id: 'b', name: 'Libre', kind: 'lightCone', winsFiftyFifty: true },
    ]);
  });

  it('normalizar dos veces da lo mismo (las pestañas se sincronizan reescribiendo el estado)', () => {
    const once = normalizeState(JSON.parse(JSON.stringify(defaultState())));
    expect(JSON.stringify(normalizeState(JSON.parse(JSON.stringify(once))))).toBe(JSON.stringify(once));
  });
});

describe('sameAsSaved', () => {
  /** localStorage falso con `saved` guardado. */
  const stubSaved = (saved: string | null) =>
    vi.stubGlobal('localStorage', { getItem: () => saved, setItem: () => {} });
  afterEach(() => vi.unstubAllGlobals());

  it('el mismo contenido con las claves en otro orden no se reescribe (no rebota a las otras pestañas)', () => {
    const state = defaultState();
    // Como lo deja la app: el entryId, añadido al elegir el nombre, va al final de la fila.
    const fromApp = { ...state, plannedPulls: [{ id: 'a', name: 'Kafka', kind: 'character', winsFiftyFifty: false, entryId: '1005' }] };
    stubSaved(JSON.stringify(fromApp));
    expect(sameAsSaved(normalizeState(fromApp))).toBe(true);
  });

  it('otro contenido, nada guardado o lo guardado ilegible se escriben', () => {
    const state = defaultState();
    stubSaved(JSON.stringify({ ...state, targetDate: '2030-01-01' }));
    expect(sameAsSaved(state)).toBe(false);
    stubSaved(null);
    expect(sameAsSaved(state)).toBe(false);
    stubSaved('{roto');
    expect(sameAsSaved(state)).toBe(false);
  });
});
