import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { dupeOf, planCopies, planDupes, planLightCones, superimpositions } from './dupes';
import type { OwnedCharacter, PlannedPull, PullKind } from './types';

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

describe('copias del plan', () => {
  const ids = (plan: PlannedPull[], owned: OwnedCharacter[] = []) =>
    planCopies(plan, catalog.character, owned).map((c) => (c ? `${c.characterId}:${c.eidolon}` : null));

  it('cada fila de personaje es la copia que le toca, por orden; lo demás es null', () => {
    const plan = [
      pull(''),
      pull('Kafka'),
      pull('Patience Is All You Need', 'lightCone'),
      pull('Acheron'),
      pull(' kafka '),
      pull('Acheron'),
      pull('Kafkita'),
    ];
    expect(ids(plan)).toEqual([null, '1005:0', null, '1308:0', '1005:1', '1308:1', null]);
  });

  it('nombres parecidos no se confunden: cada fila es su personaje exacto', () => {
    expect(ids([pull('Silver Wolf LV.999'), pull('Silver Wolf'), pull('Silver Wolf LV.999')])).toEqual([
      '1506:0',
      '1006:0',
      '1506:1',
    ]);
  });

  it('una fila con id del catálogo sigue siendo el mismo aunque el catálogo le cambie el nombre', () => {
    // «Silver Wolf» (1006) traducido: la fila guardada con el nombre en inglés y su id lo sigue encontrando.
    const renamed = { ...pull('Silver Wolf'), entryId: '1006', name: 'Silver Wolf (inglés)' };
    expect(ids([renamed])).toEqual(['1006:0']);
  });

  it('las copias de la cuenta van antes: con Kafka en E1, la primera del plan es su E2', () => {
    const owned = [{ id: '1005', name: 'Kafka', eidolon: 1 }];
    expect(ids([pull('Kafka'), pull('Acheron'), pull('Kafka')], owned)).toEqual(['1005:2', '1308:0', '1005:3']);
  });

  it('se recalculan solas: al quitar una fila o reordenar, las demás cambian de dupe', () => {
    const [a, b, c] = [pull('Kafka'), pull('Kafka'), pull('Kafka')];
    expect(ids([a, b, c])).toEqual(['1005:0', '1005:1', '1005:2']);
    expect(ids([a, c])).toEqual(['1005:0', '1005:1']);
    expect(planCopies([c, a], catalog.character).map((x) => x?.eidolon)).toEqual([0, 1]);
  });

  it('sin catálogo no se sabe qué copia es ninguna', () => {
    expect(planCopies([pull('Kafka'), pull('Kafka')], null)).toEqual([null, null]);
  });
});

describe('dupe de una copia', () => {
  it('la primera copia no es un dupe; de la segunda a la séptima, E1…E6; más allá, tampoco', () => {
    const copy = (eidolon: number) => ({ characterId: '1005', eidolon });
    expect([0, 1, 6, 7].map((e) => dupeOf(copy(e)))).toEqual([null, 1, 6, null]);
    expect(dupeOf(null)).toBeNull();
  });
});

describe('dupes del plan', () => {
  const kafka = (eidolon: number) => ({ characterId: '1005', eidolon });
  const dupes = (plan: PlannedPull[], owned: OwnedCharacter[] = []) => planDupes(planCopies(plan, catalog.character, owned));

  it('saca los dupes de cada personaje en orden, a partir de su segunda copia', () => {
    const plan = [pull('Kafka'), pull('Acheron'), pull('Kafka'), pull('Acheron'), pull('Kafka')];
    expect(dupes(plan)).toEqual([kafka(1), { characterId: '1308', eidolon: 1 }, kafka(2)]);
  });

  it('cada personaje llega como mucho a E6 y en total no hay más de 6', () => {
    expect(dupes(Array.from({ length: 9 }, () => pull('Kafka')))).toEqual([1, 2, 3, 4, 5, 6].map(kafka));
    const mixed = [pull('Kafka'), pull('Acheron'), ...Array.from({ length: 4 }, () => [pull('Kafka'), pull('Acheron')]).flat()];
    expect(dupes(mixed)).toHaveLength(6);
  });

  it('con la cuenta: Kafka en E1 → la primera del plan da su E2; ya en E6, ninguna es un dupe', () => {
    const owned = [{ id: '1005', name: 'Kafka', eidolon: 1 }];
    expect(dupes([pull('Kafka'), pull('Acheron')], owned)).toEqual([kafka(2)]);
    expect(dupes([pull('Kafka')], [{ ...owned[0], eidolon: 6 }])).toEqual([]);
  });
});

describe('conos del plan', () => {
  it('saca los conos del catálogo en orden, con repetidos', () => {
    const plan = [
      pull('Patience Is All You Need', 'lightCone'),
      pull('Kafka'),
      pull('Cono inventado', 'lightCone'),
      pull('along the passing shore', 'lightCone'),
      pull('Patience Is All You Need', 'lightCone'),
      // Un nombre que solo empieza como uno del catálogo no es ese cono.
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

describe('superposición de los conos', () => {
  it('cada copia del mismo cono la sube, hasta S5', () => {
    expect(superimpositions(['a', 'b', 'a', 'a'])).toEqual([1, 1, 2, 3]);
    expect(superimpositions(Array(7).fill('a'))).toEqual([1, 2, 3, 4, 5, 5, 5]);
  });
});
