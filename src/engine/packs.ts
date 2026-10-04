import type { ShardPackPurchase } from './types';

/**
 * Paquetes de Esquirlas Oníricas de la tienda: precio en España (€) y en Japón (¥).
 * `base` es lo que da siempre; la primera compra da `base` × 2, y las siguientes `base` + `bonus`.
 */
export interface ShardPack {
  id: string;
  price: number;
  priceJpy: number;
  base: number;
  bonus: number;
}

export const SHARD_PACKS: ShardPack[] = [
  { id: 'pack-9999', price: 99.99, priceJpy: 12000, base: 6480, bonus: 1600 },
  { id: 'pack-4999', price: 49.99, priceJpy: 6100, base: 3280, bonus: 600 },
  { id: 'pack-2999', price: 29.99, priceJpy: 3680, base: 1980, bonus: 260 },
  { id: 'pack-1499', price: 14.99, priceJpy: 1840, base: 980, bonus: 110 },
  { id: 'pack-499', price: 4.99, priceJpy: 610, base: 300, bonus: 30 },
  { id: 'pack-099', price: 0.99, priceJpy: 120, base: 60, bonus: 0 },
];

/** Yenes por euro de lo que se acaba pagando de verdad (cambio más comisión). */
export const JPY_PER_EUR = 174.25;

/** Precio en euros de un paquete: el de España o, si se paga en yenes, el de Japón convertido. */
export function packPrice(pack: ShardPack, inYen = false): number {
  return inYen ? pack.priceJpy / JPY_PER_EUR : pack.price;
}

export const emptyPurchase = (): ShardPackPurchase => ({ count: 0, firstBonus: true });

/** Esquirlas de comprar `count` veces un paquete: si aplica el x2, solo la primera compra lo lleva. */
export function packShards(pack: ShardPack, { count, firstBonus }: ShardPackPurchase): number {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return 0;
  return firstBonus ? pack.base * 2 + (n - 1) * (pack.base + pack.bonus) : n * (pack.base + pack.bonus);
}

/** Total de todos los paquetes marcados: esquirlas y euros. */
export function packsTotal(
  purchases: Record<string, ShardPackPurchase>,
  inYen = false,
): { shards: number; euros: number } {
  let shards = 0;
  let euros = 0;
  for (const pack of SHARD_PACKS) {
    const p = purchases[pack.id];
    if (!p) continue;
    shards += packShards(pack, p);
    euros += Math.max(0, Math.floor(p.count)) * packPrice(pack, inYen);
  }
  return { shards, euros };
}
