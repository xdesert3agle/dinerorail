import { describe, expect, it } from 'vitest';
import { normalizeCatalog, parseCatalogEntries, searchCatalog } from './catalog';

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
