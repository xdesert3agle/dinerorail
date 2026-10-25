import { describe, expect, it } from 'vitest';
import { byPath, fiveStarOnly, ownedCopies, parseProfile, roster, withEidolon } from './account';

const profile = (characters: unknown) => JSON.stringify({ source: 'reliquary_archiver', light_cones: [{ id: '23006' }], characters });

describe('parseProfile', () => {
  it('saca id, nombre y Eidolón de cada personaje, sin los Trazacaminos, por orden alfabético', () => {
    const text = profile([
      { id: '1005', name: 'Kafka', eidolon: 1, level: 80 },
      { id: '1001', name: 'March 7th', eidolon: 6 },
      { id: '8002', name: 'Trailblazer', eidolon: 5 },
      { id: '1506', name: 'Silver Wolf LV.<unbreak>999</unbreak>', eidolon: 0 },
    ]);
    expect(parseProfile(text)).toEqual([
      { id: '1005', name: 'Kafka', eidolon: 1 },
      { id: '1001', name: 'March 7th', eidolon: 6 },
      { id: '1506', name: 'Silver Wolf LV.999', eidolon: 0 },
    ]);
  });

  it('limita el Eidolón a 0…6 y descarta lo que no tiene id', () => {
    const text = profile([{ id: '1005', name: 'Kafka', eidolon: 9 }, { id: '1308', name: 'Acheron' }, { name: 'Sin id' }, 'x']);
    expect(parseProfile(text)).toEqual([
      { id: '1308', name: 'Acheron', eidolon: 0 },
      { id: '1005', name: 'Kafka', eidolon: 6 },
    ]);
  });

  it('avisa si no es un JSON o no tiene la lista de personajes', () => {
    expect(() => parseProfile('{nope')).toThrow('no es un JSON válido');
    expect(() => parseProfile(JSON.stringify({ version: 1 }))).toThrow('lista de personajes');
  });
});

describe('fiveStarOnly', () => {
  const owned = [
    { id: '1001', name: 'March 7th', eidolon: 6 },
    { id: '1005', name: 'kafka', eidolon: 1 },
  ];

  it('con catálogo, deja solo los 5★ y con el nombre del catálogo', () => {
    expect(fiveStarOnly(owned, [{ id: '1005', name: 'Kafka' }])).toEqual([{ id: '1005', name: 'Kafka', eidolon: 1 }]);
  });

  it('sin catálogo, los deja todos', () => {
    expect(fiveStarOnly(owned, null)).toBe(owned);
  });
});

describe('roster', () => {
  const entries = [
    { id: '1005', name: 'Kafka' },
    { id: '1308', name: 'Acheron' },
    { id: '1102', name: 'Seele' },
  ];

  it('con catálogo, todos los 5★ por orden alfabético, con el Eidolón de los que se tienen', () => {
    expect(roster([{ id: '1005', name: 'Kafka', eidolon: 2 }], entries)).toEqual([
      { id: '1308', name: 'Acheron', eidolon: null },
      { id: '1005', name: 'Kafka', eidolon: 2 },
      { id: '1102', name: 'Seele', eidolon: null },
    ]);
  });

  it('sin catálogo, solo los de la cuenta', () => {
    const owned = [
      { id: '1102', name: 'Seele', eidolon: 0 },
      { id: '1005', name: 'Kafka', eidolon: 1 },
    ];
    expect(roster(owned, null).map((c) => c.name)).toEqual(['Kafka', 'Seele']);
  });
});

describe('byPath', () => {
  it('agrupa por vía en el orden del juego, sin las vacías, y deja al final los que no tienen', () => {
    const groups = byPath([
      { id: '1308', name: 'Acheron', eidolon: 0, path: 'Warlock' },
      { id: '1999', name: 'Beta', eidolon: null },
      { id: '1005', name: 'Kafka', eidolon: 2, path: 'Warlock' },
      { id: '1102', name: 'Seele', eidolon: null, path: 'Rogue' },
    ]);
    expect(groups?.map((g) => [g.path?.name ?? null, g.characters.map((c) => c.name)])).toEqual([
      ['Cacería', ['Seele']],
      ['Nihilidad', ['Acheron', 'Kafka']],
      [null, ['Beta']],
    ]);
  });

  it('sin vías, no agrupa', () => {
    expect(byPath([{ id: '1005', name: 'Kafka', eidolon: 2 }])).toBeNull();
  });
});

describe('withEidolon', () => {
  const kafka = { id: '1005', name: 'Kafka', eidolon: 1 };

  it('añade un personaje en orden alfabético', () => {
    expect(withEidolon([kafka], { id: '1308', name: 'Acheron' }, 0)).toEqual([
      { id: '1308', name: 'Acheron', eidolon: 0 },
      kafka,
    ]);
  });

  it('cambia el Eidolón, limitado a 0…6', () => {
    expect(withEidolon([kafka], kafka, 9)).toEqual([{ ...kafka, eidolon: 6 }]);
  });

  it('con null, lo quita de la cuenta', () => {
    expect(withEidolon([kafka], kafka, null)).toEqual([]);
  });
});

describe('ownedCopies', () => {
  it('E0 es una copia y E6 son siete', () => {
    const copies = ownedCopies([
      { id: '1005', name: 'Kafka', eidolon: 0 },
      { id: '1308', name: 'Acheron', eidolon: 6 },
    ]);
    expect(copies.get('1005')).toBe(1);
    expect(copies.get('1308')).toBe(7);
  });
});
