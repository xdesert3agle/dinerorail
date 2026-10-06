import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { nameWithDupe, planDupes, planLightCones, renumberDupes } from './dupes';
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
  lightCone: [
    { id: '23006', name: 'Patience Is All You Need' },
    { id: '23024', name: 'Along the Passing Shore' },
  ],
};

let n = 0;
const pull = (name: string, kind: PullKind = 'character'): PlannedPull => ({
  id: String(n++),
  name,
  kind,
  winsFiftyFifty: false,
});

describe('dupes del plan', () => {
  const kafka = (eidolon: number) => ({ characterId: '1005', eidolon });

  it('saca los dupes de cada personaje en orden, a partir de su segunda copia', () => {
    const plan = [
      pull(''),
      pull('Kafka'),
      pull('Patience Is All You Need', 'lightCone'),
      pull('Acheron'),
      pull(' kafka '),
      pull('Acheron | E1'),
      pull('Kafka | E2'),
    ];
    expect(planDupes(plan, catalog)).toEqual([kafka(1), { characterId: '1308', eidolon: 1 }, kafka(2)]);
  });

  it('cuenta los nombres que empiezan por el del personaje', () => {
    const plan = [pull('Aeon ★ Aha'), pull('Aeon ★ Aha E1'), pull('aeon ★ aha e2')];
    expect(planDupes(plan, catalog).map((d) => d.eidolon)).toEqual([1, 2]);
  });

  it('si encajan varios personajes, se queda con el nombre más largo', () => {
    const plan = [pull('Silver Wolf LV.999 E0'), pull('Silver Wolf'), pull('Silver Wolf LV.999 E1')];
    expect(planDupes(plan, catalog)).toEqual([{ characterId: '1506', eidolon: 1 }]);
  });

  it('una sola copia no tiene dupes', () => {
    expect(planDupes([pull('Kafka'), pull('Acheron')], catalog)).toEqual([]);
  });

  it('cada personaje llega como mucho a E6 y en total no hay más de 6', () => {
    expect(planDupes(Array.from({ length: 9 }, () => pull('Kafka')), catalog)).toEqual([1, 2, 3, 4, 5, 6].map(kafka));
    const mixed = [pull('Kafka'), pull('Acheron'), ...Array.from({ length: 4 }, () => [pull('Kafka'), pull('Acheron')]).flat()];
    expect(planDupes(mixed, catalog)).toHaveLength(6);
  });

  it('sin catálogo o con un nombre que no está, no cuenta', () => {
    expect(planDupes([pull('Kafka'), pull('Kafka')], null)).toEqual([]);
    expect(planDupes([pull('Kafkita'), pull('Kafkita')], catalog)).toEqual([]);
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

describe('renumerar dupes', () => {
  const names = (plan: PlannedPull[]) => renumberDupes(plan, catalog.character).map((p) => p.name);

  it('al quitar un dupe, los siguientes bajan uno', () => {
    const plan = [pull('Aeon ★ Aha'), pull('Aeon ★ Aha | E1'), pull('Aeon ★ Aha | E3'), pull('Kafka')];
    expect(names(plan)).toEqual(['Aeon ★ Aha', 'Aeon ★ Aha | E1', 'Aeon ★ Aha | E2', 'Kafka']);
  });

  it('al quitar la primera copia, la siguiente se queda sin dupe', () => {
    expect(names([pull('Kafka | E1'), pull('Acheron'), pull('Kafka | E2')])).toEqual(['Kafka', 'Acheron', 'Kafka | E1']);
  });

  it('acepta el dupe escrito a mano y deja los nombres con otro texto', () => {
    const plan = [pull('Kafka'), pull('kafka e2'), pull('Kafka (rerun)'), pull('Kafka E9')];
    expect(names(plan)).toEqual(['Kafka', 'Kafka | E1', 'Kafka (rerun)', 'Kafka | E3']);
  });

  it('no toca los conos ni lo que no está en el catálogo, y conserva las filas sin cambios', () => {
    const plan = [pull('Kafka | E1', 'lightCone'), pull('Kafkita | E3'), pull('Kafka')];
    const out = renumberDupes(plan, catalog.character);
    expect(out.map((p) => p.name)).toEqual(['Kafka | E1', 'Kafkita | E3', 'Kafka']);
    expect(out[2]).toBe(plan[2]);
  });
});

describe('conos del plan', () => {
  it('saca los conos del catálogo en orden, con repetidos', () => {
    const plan = [
      pull('Patience Is All You Need', 'lightCone'),
      pull('Kafka'),
      pull('Cono inventado', 'lightCone'),
      pull('along the passing shore', 'lightCone'),
      pull('Patience Is All You Need S2', 'lightCone'),
    ];
    expect(planLightCones(plan, catalog)).toEqual(['23006', '23024', '23006']);
  });

  it('no pasa de 6 y sin catálogo no hay ninguno', () => {
    const plan = Array.from({ length: 8 }, () => pull('Patience Is All You Need', 'lightCone'));
    expect(planLightCones(plan, catalog)).toHaveLength(6);
    expect(planLightCones(plan, null)).toEqual([]);
  });
});
