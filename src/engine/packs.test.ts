import { describe, expect, it } from 'vitest';
import { calculate, SHARD_PACKS_ID } from './calculate';
import { defaultState } from './defaults';
import { packPrice, packShards, packsTotal, SHARD_PACKS } from './packs';

const pack = (price: number) => SHARD_PACKS.find((p) => p.price === price)!;

describe('paquetes de cristales', () => {
  it('con el x2, la primera compra da los valores de la tienda', () => {
    const firsts = SHARD_PACKS.map((p) => packShards(p, { count: 1, firstBonus: true }));
    expect(firsts).toEqual([12960, 6560, 3960, 1960, 600, 120]);
  });

  it('sin el x2 da lo normal más el bonus', () => {
    expect(packShards(pack(99.99), { count: 1, firstBonus: false })).toBe(8080);
    expect(packShards(pack(0.99), { count: 1, firstBonus: false })).toBe(60);
  });

  it('el x2 solo se aplica a la primera compra', () => {
    expect(packShards(pack(4.99), { count: 3, firstBonus: true })).toBe(600 + 2 * 330);
    expect(packShards(pack(4.99), { count: 0, firstBonus: true })).toBe(0);
  });

  it('total de esquirlas y euros', () => {
    const t = packsTotal({ 'pack-9999': { count: 1, firstBonus: true }, 'pack-099': { count: 2, firstBonus: false } });
    expect(t.shards).toBe(12960 + 120);
    expect(t.euros).toBeCloseTo(99.99 + 2 * 0.99);
  });

  it('con precios de Japón, el coste en euros sale de los yenes y el cambio', () => {
    expect(packPrice(pack(99.99), true)).toBeCloseTo(68.87, 2);
    expect(packPrice(pack(0.99), true)).toBeCloseTo(0.69, 2);
    expect(packPrice(pack(99.99), false)).toBe(99.99);
    const t = packsTotal({ 'pack-9999': { count: 1, firstBonus: true }, 'pack-099': { count: 2, firstBonus: true } }, true);
    expect(t.euros).toBeCloseTo((12000 + 2 * 120) / 174.25);
  });

  it('se suman hoy al cálculo como Jades', () => {
    const today = '2026-10-06';
    const s = defaultState(today);
    s.sources = s.sources.map((src) => ({ ...src, enabled: false }));
    s.patches = [];
    s.inventory = { jades: 0, specialPasses: 0, shards: 0, starlight: 0 };
    s.targetDate = today;
    s.shardPacks = { 'pack-1499': { count: 1, firstBonus: true } };
    const r = calculate(s, today);
    expect(r.final.jades).toBe(1960);
    expect(r.bySource.map((t) => t.sourceId)).toEqual([SHARD_PACKS_ID]);
  });
});
