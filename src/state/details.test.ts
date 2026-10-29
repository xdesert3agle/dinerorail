import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDetails } from './details';

// Respuestas mínimas que el motor sabe leer (ver engine/details.test.ts).
const yattaCharacter = {
  data: {
    name: 'Kafka',
    eidolons: Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, { rank: n, name: `E${n}`, description: 'x', params: [] }])),
  },
};
const nanokaCharacter = {
  name: 'Kafka',
  ranks: Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, { id: n, name: `E${n}`, desc: 'x', param_list: [] }])),
};
const json = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });

/** fetch falso: responde según la fuente de la URL; cuenta las llamadas. */
const stubFetch = (yatta: unknown | null, nanoka: unknown | null) => {
  const fetch = vi.fn((url: string) => {
    const body = url.includes('yatta') ? yatta : nanoka;
    return body === null ? json(null, false) : json(body);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => vi.unstubAllGlobals());

// Cada test con un id propio: la caché en memoria del módulo dura todo el archivo.
const ref = (id: string) => ({ kind: 'character' as const, id, version: '4.6.54' });

describe('descarga de detalles', () => {
  it('primero yatta.moe, en español', async () => {
    const fetch = stubFetch(yattaCharacter, nanokaCharacter);
    const details = await loadDetails(ref('9001'));
    expect(details.lang).toBe('es');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('si yatta.moe no lo tiene, nanoka.cc en inglés; y lo ya descargado no se vuelve a pedir', async () => {
    const fetch = stubFetch(null, nanokaCharacter);
    expect((await loadDetails(ref('9002'))).lang).toBe('en');
    expect(fetch).toHaveBeenCalledTimes(2);
    await loadDetails(ref('9002'));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('dos peticiones a la vez del mismo comparten una sola descarga', async () => {
    const fetch = stubFetch(yattaCharacter, nanokaCharacter);
    await Promise.all([loadDetails(ref('9003')), loadDetails(ref('9003'))]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('si fallan las dos, falla (y se puede reintentar)', async () => {
    stubFetch(null, null);
    await expect(loadDetails(ref('9004'))).rejects.toThrow();
    stubFetch(yattaCharacter, null);
    expect((await loadDetails(ref('9004'))).lang).toBe('es');
  });
});
