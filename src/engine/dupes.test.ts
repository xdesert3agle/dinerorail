import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { countDupes, nameWithDupe } from './dupes';
import type { PlannedPull, PullKind } from './types';

const catalog: Catalog = {
  syncedAt: 0,
  character: [
    { id: '1005', name: 'Kafka' },
    { id: '1308', name: 'Acheron' },
    { id: '1006', name: 'Silver Wolf' },
    { id: '1506', name: 'Silver Wolf LV.999' },
    { id: '1511', name: 'Aeon ★ Aha' },
  ],
  lightCone: [{ id: '23006', name: 'Patience Is All You Need' }],
};

let n = 0;
const pull = (name: string, kind: PullKind = 'character'): PlannedPull => ({
  id: String(n++),
  name,
  kind,
  winsFiftyFifty: false,
});

describe('dupes del primer personaje', () => {
  it('cuenta las copias de más del primer personaje con nombre', () => {
    const plan = [pull(''), pull('Patience Is All You Need', 'lightCone'), pull('Kafka'), pull('Acheron'), pull(' kafka ')];
    expect(countDupes(plan, catalog)).toEqual({ characterId: '1005', name: 'Kafka', dupes: 1 });
  });

  it('cuenta los nombres que empiezan por el del personaje', () => {
    const plan = [pull('Aeon ★ Aha'), pull('Aeon ★ Aha E1'), pull('aeon ★ aha e2')];
    expect(countDupes(plan, catalog)).toEqual({ characterId: '1511', name: 'Aeon ★ Aha', dupes: 2 });
  });

  it('si encajan varios personajes, se queda con el nombre más largo', () => {
    const plan = [pull('Silver Wolf LV.999 E0'), pull('Silver Wolf'), pull('Silver Wolf LV.999 E1')];
    expect(countDupes(plan, catalog)).toEqual({ characterId: '1506', name: 'Silver Wolf LV.999', dupes: 1 });
  });

  it('una sola copia es E0', () => {
    expect(countDupes([pull('Kafka')], catalog)?.dupes).toBe(0);
  });

  it('no pasa de E6', () => {
    expect(countDupes(Array.from({ length: 9 }, () => pull('Kafka')), catalog)?.dupes).toBe(6);
  });

  it('sin catálogo o con un nombre que no está, no cuenta', () => {
    expect(countDupes([pull('Kafka')], null)).toBeNull();
    expect(countDupes([pull('Kafkita'), pull('Kafka')], catalog)).toBeNull();
  });
});

describe('nombre con el dupe al elegir un personaje', () => {
  const kafka = catalog.character[0];

  it('la primera copia va sin dupe y las siguientes con el que les toca', () => {
    const plan = [pull('Kafka'), pull('Acheron'), pull('Kafka | E1'), pull('')];
    expect(nameWithDupe(plan, plan[0].id, kafka, catalog.character)).toBe('Kafka');
    expect(nameWithDupe(plan, plan[3].id, kafka, catalog.character)).toBe('Kafka | E2');
  });

  it('los conos no cuentan y de E6 no pasa', () => {
    const cone = [pull('Kafka', 'lightCone'), pull('')];
    expect(nameWithDupe(cone, cone[1].id, kafka, catalog.character)).toBe('Kafka');
    const many = [...Array.from({ length: 7 }, () => pull('Kafka')), pull('')];
    expect(nameWithDupe(many, many[7].id, kafka, catalog.character)).toBe('Kafka');
  });
});
