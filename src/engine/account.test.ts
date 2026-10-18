import { describe, expect, it } from 'vitest';
import { fiveStarOnly, ownedCopies, parseProfile } from './account';

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
