import { describe, expect, it } from 'vitest';
import { calculate, eventTiming, PATCH_EVENTS_ID } from './calculate';
import { addDays } from './dates';
import { defaultState } from './defaults';
import type { AppState, Source } from './types';

/** Estado con solo las fuentes indicadas activas y sin parches. */
function stateWith(ids: string[], targetDate: string, today: string): AppState {
  const s = defaultState(today);
  return {
    ...s,
    targetDate,
    patches: [],
    sources: s.sources.map((src) => ({ ...src, enabled: ids.includes(src.id) })),
  };
}

const total = (r: ReturnType<typeof calculate>) => r.final.jades;

describe('calculate', () => {
  const today = '2026-10-06'; // martes

  it('7 días desde un martes: 7 diarias + 7 bendiciones + 1 semanal', () => {
    const r = calculate(stateWith(['daily-training', 'express-pass', 'weekly'], addDays(today, 7), today), today);
    expect(total(r)).toBe(7 * 150 + 225);
  });

  it('suma el inventario y las Esquirlas si están incluidas', () => {
    const s = stateWith([], today, today);
    s.inventory = { jades: 1000, shards: 60, specialPasses: 3, starlight: 0 };
    const r = calculate(s, today);
    expect(r.final.jades).toBe(1060);
    expect(r.shards).toBe(60);
    // 1060 Jades: 6 tiradas (y sobran 100) más 3 Pases.
    expect(r.wholeSingles).toBe(6 + 3);
    expect(r.jades).toBe(1000);

    s.settings = { ...s.settings, includeShards: false };
    expect(calculate(s, today).final.jades).toBe(1000);
  });

  it('los paquetes suman como Jades con «Usar paquetes en el plan», sin depender de convertir las del inventario', () => {
    const s = stateWith([], addDays(today, 1), today);
    s.inventory = { jades: 1000, shards: 60, specialPasses: 0, starlight: 0 };
    s.shardPacks = { 'pack-099': { count: 3, firstBonus: false } }; // 3 × 60 = 180
    const r = calculate(s, today);
    expect(r.final.jades).toBe(1000 + 60 + 180);
    expect(r.shards).toBe(240);
    expect(r.shardsHeld).toBe(240);
    expect(r.jades).toBe(1000);

    s.settings = { ...s.settings, includePacks: false };
    const off = calculate(s, today);
    expect(off.final.jades).toBe(1060);
    expect(off.shardsHeld).toBe(60);
    expect(off.bySource.some((t) => t.sourceId === 'shard-packs')).toBe(false);

    s.settings = { ...s.settings, includePacks: true, includeShards: false };
    const packsOnly = calculate(s, today);
    expect(packsOnly.final.jades).toBe(1000 + 180);
    expect(packsOnly.shards).toBe(180);
    expect(packsOnly.shardsHeld).toBe(240);

    s.settings = { ...s.settings, includePacks: false, includeShards: false };
    const none = calculate(s, today);
    expect(none.final.jades).toBe(1000);
    expect(none.shards).toBe(0);
    expect(none.shardsHeld).toBe(60);
  });

  it('la Cosmiluz del inventario se cambia por Pases (20 = 1) y lo que sobra se guarda', () => {
    const s = stateWith([], today, today);
    s.inventory = { jades: 0, shards: 0, specialPasses: 3, starlight: 87 };
    const r = calculate(s, today);
    // 87 de Cosmiluz: 4 Pases (sumados a los 3) y sobran 7.
    expect(r.final.specialPasses).toBe(3 + 4);
    expect(r.starlightLeftover).toBe(7);
    expect(r.wholeSingles).toBe(3 + 4);
  });

  it('pendingNow suma el cobro de hoy', () => {
    const s = stateWith(['daily-training'], today, today);
    expect(total(calculate(s, today))).toBe(0);
    s.sources = s.sources.map((src): Source => (src.id === 'daily-training' ? { ...src, pendingNow: true } : src));
    expect(total(calculate(s, today))).toBe(60);
  });

  it('cruzar el día 1 del mes suma los 5 Pases Especiales de la Tienda de Ascuas', () => {
    const r = calculate(stateWith(['embers-shop'], '2026-11-01', today), today);
    expect(r.final.specialPasses).toBe(5);
    expect(r.wholeSingles).toBe(5);
  });

  it('desactivar una fuente pone su aportación a 0', () => {
    const r = calculate(stateWith([], addDays(today, 100), today), today);
    expect(r.incomeSingles).toBe(0);
    expect(r.bySource).toEqual([]);
  });

  it('eventos del parche: cada uno en su fecha, ignorando los pasados y los posteriores al objetivo', () => {
    const s = stateWith([], '2026-11-30', today);
    const ev = (id: string, date: string, jades: number, specialPasses = 0) => ({ id, name: id, date, jades, specialPasses });
    s.patches = [
      {
        id: 'p',
        version: '4.6',
        start: '2026-09-28',
        events: [
          ev('pasado', '2026-10-01', 500),
          ev('hoy', today, 500),
          ev('corrosion', '2026-10-20', 500, 3),
          ev('tarde', '2026-12-01', 500),
        ],
      },
    ];
    const r = calculate(s, today);
    // Solo "corrosion": no se extrapolan parches futuros.
    const events = r.bySource.find((t) => t.sourceId === PATCH_EVENTS_ID);
    expect(events?.reward).toEqual({ jades: 500, specialPasses: 3 });
    expect(events?.count).toBe(1);
  });

  it('eventos: cuentan de mañana a la fecha objetivo; los de hoy se dan por cobrados', () => {
    expect(eventTiming('2026-10-05', today, '2026-12-31')).toBe('past');
    expect(eventTiming(today, today, '2026-12-31')).toBe('today');
    expect(eventTiming(addDays(today, 1), today, '2026-12-31')).toBe('counts');
    expect(eventTiming('2026-12-31', today, '2026-12-31')).toBe('counts');
    expect(eventTiming('2027-01-01', today, '2026-12-31')).toBe('late');

    const s = stateWith([], '2026-12-31', today);
    const ev = (id: string, date: string) => ({ id, name: id, date, jades: 100, specialPasses: 0 });
    s.patches = [{ id: 'p', version: '4.7', start: today, events: [ev('hoy', today), ev('mañana', addDays(today, 1))] }];
    expect(calculate(s, today).bySource.find((t) => t.sourceId === PATCH_EVENTS_ID)?.count).toBe(1);
  });

  it('las fuentes por parche solo cuentan los parches de la tabla', () => {
    const s = stateWith(['maintenance'], '2026-12-31', today);
    s.patches = [{ id: 'p', version: '4.6', start: '2026-09-28', events: [] }];
    // La 4.6 ya empezó: sin más parches no hay compensación pendiente.
    expect(total(calculate(s, today))).toBe(0);
    s.patches = [...s.patches, { id: 'q', version: '4.7', start: '2026-11-09', events: [] }];
    expect(total(calculate(s, today))).toBe(600);
  });
  it('fecha objetivo anterior a hoy es inválida', () => {
    const r = calculate(stateWith(['daily-training'], '2026-10-01', today), today);
    expect(r.valid).toBe(false);
    expect(r.bySource).toEqual([]);
  });

  it('las singles de ahora cuentan toda la Cosmiluz, también la que no llega a un Pase', () => {
    const s = stateWith([], today, today);
    s.inventory = { jades: 320, specialPasses: 3, shards: 160, starlight: 50 };
    s.settings.includeShards = true;
    const r = calculate(s, today);
    // 320 + 160 Jades = 3, 3 Pases y 50 de Cosmiluz = 2,5.
    expect(r.currentSingles).toBe(8.5);
    expect(r.final.specialPasses).toBe(3 + 2);
    expect(r.starlightLeftover).toBe(10);
  });
});
