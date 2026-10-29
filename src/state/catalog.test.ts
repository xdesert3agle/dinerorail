import { afterEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_VERSION } from '../engine/catalog';
import { MANIFEST_URL } from '../engine/urls';
import { fetchCatalog } from './catalog';

const character = { '1006': { rank: 'CombatPowerAvatarRarityType5', en: 'Silver Wolf', release: 1, baseType: 'Warlock' } };
const lightCone = { '23000': { rank: 'CombatPowerLightconeRarity5', en: 'Night on the Milky Way', release: 1 } };

/** fetch falso: el manifest, las listas de nanoka y los nombres de yatta; null hace fallar esa URL. */
const stubFetch = (manifest: unknown | null, yattaUp: boolean, characters: unknown = character) => {
  const fetch = vi.fn((url: string) => {
    let body: unknown = null;
    if (url === MANIFEST_URL) body = manifest;
    else if (url.includes('yatta')) body = yattaUp ? { data: { items: { '1006': { name: 'Lobo Plateado' } } } } : null;
    else if (url.endsWith('character.json')) body = characters;
    else if (url.endsWith('lightcone.json')) body = lightCone;
    const ok = body !== null;
    return Promise.resolve({ ok, status: ok ? 200 : 503, json: () => Promise.resolve(body) });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => vi.unstubAllGlobals());

describe('descarga del catálogo', () => {
  it('versión del manifest y nombres en español de yatta', async () => {
    const fetch = stubFetch({ hsr: { latest: '4.7.10' } }, true);
    const catalog = await fetchCatalog();
    expect(catalog.version).toBe('4.7.10');
    expect(catalog.character.map((e) => e.name)).toEqual(['Lobo Plateado']);
    expect(fetch.mock.calls.some(([url]) => url.includes('/4.7.10/'))).toBe(true);
  });

  it('sin manifest, la última versión conocida; sin yatta, los nombres en inglés', async () => {
    stubFetch(null, false);
    const catalog = await fetchCatalog();
    expect(catalog.version).toBe(FALLBACK_VERSION);
    expect(catalog.character.map((e) => e.name)).toEqual(['Silver Wolf']);
  });

  it('sin yatta, los nombres en español del catálogo anterior', async () => {
    stubFetch({ hsr: { latest: '4.7.10' } }, false);
    const previous = { syncedAt: 1, version: '4.7.9', character: [{ id: '1006', name: 'Lobo Plateado' }], lightCone: [] };
    const catalog = await fetchCatalog(previous);
    expect(catalog.character.map((e) => e.name)).toEqual(['Lobo Plateado']);
    expect(catalog.lightCone.map((e) => e.name)).toEqual(['Night on the Milky Way']);
  });

  it('una lista vacía o sin vías (formato que ya no se entiende) falla en vez de pisar el catálogo guardado', async () => {
    stubFetch({ hsr: { latest: '4.7.10' } }, true, {});
    await expect(fetchCatalog()).rejects.toThrow();
    stubFetch({ hsr: { latest: '4.7.10' } }, true, { '1006': { ...character['1006'], baseType: undefined } });
    await expect(fetchCatalog()).rejects.toThrow();
  });
});
