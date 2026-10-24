import { describe, expect, it } from 'vitest';
import {
  lastWeeklySync,
  nextWeeklySync,
  normalizeCatalog,
  parseCatalogEntries,
  parseManifestVersion,
  parseYattaNames,
  searchCatalog,
  syncDue,
} from './catalog';

describe('sincronización semanal (martes a las 10:00, hora local)', () => {
  // Fechas locales: el 27 de octubre de 2026 es martes.
  const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m);

  it('el último martes a las 10 que ya ha llegado', () => {
    expect(lastWeeklySync(at(29, 18))).toEqual(at(27, 10)); // jueves → el martes de esa semana
    expect(lastWeeklySync(at(27, 10))).toEqual(at(27, 10)); // martes a las 10 en punto → ese mismo
    expect(lastWeeklySync(at(27, 9, 59))).toEqual(at(20, 10)); // martes antes de las 10 → el anterior
    expect(lastWeeklySync(at(26, 12))).toEqual(at(20, 10)); // lunes → el martes anterior
  });

  // Incluye la semana del cambio de hora (domingo 25 de octubre de 2026 en España): sigue siendo a las 10:00.
  it('el próximo, una semana después del último', () => {
    expect(nextWeeklySync(at(29, 18))).toEqual(at(27 + 7, 10));
    expect(nextWeeklySync(at(27, 9))).toEqual(at(27, 10));
  });

  it('toca si no hay catálogo, si es del formato antiguo o si se sincronizó antes del último martes a las 10', () => {
    const synced = (d: number, h: number) => ({ syncedAt: at(d, h).getTime(), version: '4.6.54' });
    expect(syncDue(null, at(29, 18))).toBe(true);
    expect(syncDue({ syncedAt: at(27, 11).getTime() }, at(29, 18))).toBe(true); // sin versión: solo inglés
    expect(syncDue(synced(26, 20), at(29, 18))).toBe(true); // lunes → ya pasó el martes
    expect(syncDue(synced(27, 11), at(29, 18))).toBe(false); // martes después de las 10
    expect(syncDue(synced(27, 11), at(3 + 31, 10, 1))).toBe(true); // el martes siguiente
  });
});

describe('fuentes del catálogo', () => {
  it('lee la última versión de HSR del manifest de nanoka', () => {
    expect(parseManifestVersion({ gi: { latest: '7.1.53' }, hsr: { latest: '4.6.54', live: '4.6' } })).toBe('4.6.54');
    expect(() => parseManifestVersion({ hsr: { latest: '../x' } })).toThrow();
    expect(() => parseManifestVersion({})).toThrow();
  });

  it('lee los nombres en español de yatta por id', () => {
    const names = parseYattaNames({ data: { items: { '1005': { name: 'Kafka' }, '1006': { name: 'Lobo  Plateado' } } } });
    expect([...names]).toEqual([
      ['1005', 'Kafka'],
      ['1006', 'Lobo Plateado'],
    ]);
    expect(() => parseYattaNames({ items: {} })).toThrow();
  });

  it('usa el nombre en español si yatta lo tiene; si no (beta), el inglés', () => {
    const raw = {
      '1006': { rank: 'CombatPowerAvatarRarityType5', en: 'Silver Wolf', release: 1 },
      '1511': { rank: 'CombatPowerAvatarRarityType5', en: 'Aeon ★ Aha' },
    };
    const names = parseCatalogEntries(raw, new Map([['1006', 'Lobo Plateado']])).map((e) => e.name);
    expect(names).toEqual(['Aeon ★ Aha', 'Lobo Plateado']);
  });
});

const CHARACTERS = {
  '1001': { rank: 'CombatPowerAvatarRarityType4', en: 'March 7th', release: 1682460000 },
  '1102': { rank: 'CombatPowerAvatarRarityType5', en: 'Seele', release: 1682460000 },
  '1213': { rank: 'CombatPowerAvatarRarityType5', en: 'Dan Heng • Imbibitor Lunae', release: 1693353600 },
  '1503': { rank: 'CombatPowerAvatarRarityType5', en: 'Pearl' },
  '1506': { rank: 'CombatPowerAvatarRarityType5', en: 'Silver Wolf LV.<unbreak>999</unbreak>', release: 1776816000 },
  '8001': { rank: 'CombatPowerAvatarRarityType5', en: '{NICKNAME}', release: 1682460000 },
};

describe('catálogo de personajes y conos', () => {
  it('solo deja los 5★, sin Trazacaminos y sin el marcado del juego', () => {
    const names = parseCatalogEntries(CHARACTERS).map((e) => e.name);
    expect(names).toEqual(['Pearl', 'Silver Wolf LV.999', 'Dan Heng • Imbibitor Lunae', 'Seele']);
  });

  it('no repite nombres', () => {
    const raw = {
      '1': { rank: 'CombatPowerLightconeRarity5', en: 'Night on the Milky Way' },
      '2': { rank: 'CombatPowerLightconeRarity5', en: 'Night on the Milky Way' },
    };
    expect(parseCatalogEntries(raw)).toHaveLength(1);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(() => parseCatalogEntries([])).toThrow();
    expect(normalizeCatalog({ character: [] })).toBeNull();
  });

  it('busca sin mayúsculas ni tildes, primero lo que empieza así', () => {
    const entries = parseCatalogEntries(CHARACTERS);
    expect(searchCatalog(entries, 'SEE').map((e) => e.name)).toEqual(['Seele']);
    expect(searchCatalog(entries, 'imbíbitor').map((e) => e.name)).toEqual(['Dan Heng • Imbibitor Lunae']);
    const all = [
      { id: '1', name: 'Dan Heng • Imbibitor Lunae' },
      { id: '2', name: 'Lingsha' },
      { id: '3', name: 'Lunae' },
    ];
    // Empieza por "lun", luego palabra que empieza por "lun"; "Lingsha" no lo contiene.
    expect(searchCatalog(all, 'lun').map((e) => e.id)).toEqual(['3', '1']);
    expect(searchCatalog(all, '  ')).toEqual([]);
  });
});
