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

  it('rechaza archivos que no son copias de seguridad', () => {
    expect(() => normalizeState({ foo: 1 })).toThrow();
  });
});
