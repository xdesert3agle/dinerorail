import { describe, expect, it } from 'vitest';
import { defaultState } from '../engine/defaults';
import { normalizeState } from './store';

describe('normalizeState', () => {
  it('migra los datos con Pases normales: los descarta y renueva la Tienda de Ascuas', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.inventory.standardPasses = 7;
    old.sources = old.sources.map((s: any) =>
      s.id === 'embers-shop'
        ? { ...s, enabled: true, reward: { jades: 0, specialPasses: 0, standardPasses: 5 } }
        : { ...s, reward: { ...s.reward, standardPasses: 0 } },
    );

    const state = normalizeState(old);
    expect(state.inventory).not.toHaveProperty('standardPasses');
    const embers = state.sources.find((s) => s.id === 'embers-shop')!;
    expect(embers.reward).toEqual({ jades: 0, specialPasses: 5 });
    expect(embers.enabled).toBe(false);
    // El resto de fuentes conserva su recompensa.
    expect(state.sources.find((s) => s.id === 'daily-training')!.reward).toEqual({ jades: 60, specialPasses: 0 });
  });

  it('no toca la Tienda de Ascuas si ya está migrada', () => {
    const s = defaultState();
    s.sources = s.sources.map((src) => (src.id === 'embers-shop' ? { ...src, enabled: true } : src));
    const state = normalizeState(JSON.parse(JSON.stringify(s)));
    expect(state.sources.find((x) => x.id === 'embers-shop')!.enabled).toBe(true);
  });

  it('corrige la fecha antigua de Memoria del Caos y actualiza los nombres predefinidos', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.sources = old.sources.map((s: any) => {
      if (s.id === 'memory-of-chaos') return { ...s, schedule: { type: 'cycle', anchor: '2026-09-28', periodDays: 42 } };
      if (s.id === 'apocalyptic-shadow') return { ...s, name: 'Sombra Apocalíptica' };
      if (s.id === 'pure-fiction') return { ...s, schedule: { type: 'cycle', anchor: '2026-10-20', periodDays: 42 } };
      return s;
    });

    const state = normalizeState(old);
    const byId = (id: string) => state.sources.find((s) => s.id === id)!;
    expect(byId('memory-of-chaos').schedule).toEqual({ type: 'cycle', anchor: '2026-11-02', periodDays: 42 });
    expect(byId('apocalyptic-shadow').name).toBe('Espejismo Apocalíptico');
    // Una fecha que el usuario haya cambiado a mano se respeta.
    expect(byId('pure-fiction').schedule).toEqual({ type: 'cycle', anchor: '2026-10-20', periodDays: 42 });
  });

  it('migra los parches con un único total de eventos a una lista de eventos', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.patches = [
      { id: 'patch-4.6', version: '4.6', start: '2026-09-28', eventJades: 2060, eventSpecialPasses: 0 },
      { id: 'x', version: '4.7', start: '2099-01-01', eventJades: 1500, eventSpecialPasses: 2 },
      { id: 'y', version: '4.8', start: '2099-02-12', eventJades: 0, eventSpecialPasses: 0 },
    ];
    const [p46, p47, p48] = normalizeState(old).patches;
    // El valor por defecto antiguo de la 4.6 se cambia por el desglose nuevo.
    expect(p46.events.map((e) => e.jades)).toEqual([1000, 500, 500, 60]);
    // Cualquier otro total se conserva como un único evento.
    expect(p47.events).toEqual([
      { id: 'x-legacy', name: 'Eventos (sin desglosar)', date: '2099-01-01', jades: 1500, specialPasses: 2 },
    ]);
    expect(p48.events).toEqual([]);
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

  it('migra el tema "retro" a su nombre actual, "sparxie"', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.settings.skin = 'retro';
    expect(normalizeState(old).settings.skin).toBe('sparxie');

    old.settings.skin = 'desconocido';
    expect(normalizeState(old).settings.skin).toBe('aha');
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

  it('tiradas por 5★: enteras y desde 1, o las de por defecto; el pity se queda por debajo de ellas', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.settings.hardPity = { character: 90.7, lightCone: 0 };
    old.pity = { character: 120, lightCone: -3 };
    const state = normalizeState(old);
    expect(state.settings.hardPity).toEqual({ character: 90, lightCone: 70 });
    expect(state.pity).toEqual({ character: 89, lightCone: 0 });

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

  it('quita el dupe escrito delante del nombre (ahora se calcula aparte)', () => {
    const old = JSON.parse(JSON.stringify(defaultState())) as Record<string, any>;
    old.plannedPulls = [
      { id: 'a', name: 'E1 | Silver Wolf LV.999', kind: 'character', winsFiftyFifty: false },
      { id: 'b', name: 'Kafka', kind: 'character', winsFiftyFifty: false },
    ];
    expect(normalizeState(old).plannedPulls.map((p) => p.name)).toEqual(['Silver Wolf LV.999', 'Kafka']);
  });
});
