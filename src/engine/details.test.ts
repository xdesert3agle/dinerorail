import { describe, expect, it } from 'vitest';
import { detailsUrl, formatDesc, normalizeDetails, parseDetails } from './details';

const rank = (n: number, desc = 'Texto', param_list: number[] = []) => ({ id: n, name: `E${n}`, desc, param_list });

describe('detalles de Eidolones y conos', () => {
  it('llena los huecos: [i] entero, [fk] con k decimales y % como porcentaje', () => {
    const lines = formatDesc('DMG <unbreak>#1[i]%</unbreak>, SPD <color=#f29e38ff>#2[f1]%</color>, #3[i] turn(s)', [
      0.3, 0.048, 2,
    ]);
    expect(lines).toEqual([
      [
        { text: 'DMG ' },
        { text: '30%', value: true },
        { text: ', SPD ' },
        { text: '4.8%', value: true },
        { text: ', ' },
        { text: '2', value: true },
        { text: ' turn(s)' },
      ],
    ]);
  });

  it('en español, los decimales van con coma', () => {
    const [line] = formatDesc('VEL +#1[f1]%', [0.055999998], 'es');
    expect(line[1]).toEqual({ text: '5,6%', value: true });
  });

  it('separa las líneas con "\\n" escrito con la barra', () => {
    const lines = formatDesc('Skill Lv. +2.\\nBasic ATK Lv. +1.', []);
    expect(lines.map((l) => l.map((s) => s.text).join(''))).toEqual(['Skill Lv. +2.', 'Basic ATK Lv. +1.']);
  });

  it('lee los 6 Eidolones de yatta.moe, ordenados por su número', () => {
    const eidolons = Object.fromEntries(
      [6, 1, 2, 3, 4, 5].map((n) => [
        1005 * 100 + n,
        { rank: n, name: `E${n}`, description: '#1[i]%', params: n === 3 ? null : [n / 10] },
      ]),
    );
    const details = parseDetails('yatta', 'character', { response: 200, data: { name: 'Kafka', eidolons } });
    expect(details.lang).toBe('es');
    expect('eidolons' in details && details.eidolons.map((e) => e.name)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']);
    expect('eidolons' in details && details.eidolons[2].params).toEqual([]);
    expect(normalizeDetails('character', details)).toEqual(details);
  });

  it('lee el cono de yatta.moe, pasando los parámetros de por parámetro a por superposición', () => {
    const raw = {
      data: {
        name: 'Solo hay que esperar',
        skill: { name: 'Telaraña', description: '#1[i]% #2[i]%', params: { 1: [1, 2, 3, 4, 5], 2: [6, 7, 8, 9, 10] } },
      },
    };
    const details = parseDetails('yatta', 'lightCone', raw);
    expect('levels' in details && details.levels).toEqual([
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9],
      [5, 10],
    ]);
    expect(normalizeDetails('lightCone', details)).toEqual(details);
    expect(normalizeDetails('character', details)).toBeNull();
  });

  it('lee los 6 Eidolones de nanoka.cc', () => {
    const raw = { name: 'Kafka', ranks: Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, rank(n)])) };
    const details = parseDetails('nanoka', 'character', raw);
    expect(details.lang).toBe('en');
    expect('eidolons' in details && details.eidolons.map((e) => e.name)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']);
    expect(() => parseDetails('nanoka', 'character', { name: 'Kafka', ranks: { 1: rank(1) } })).toThrow();
  });

  it('lee el efecto de un cono de nanoka.cc en S1…S5', () => {
    const level = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, { param_list: [n / 10] }]));
    const raw = { name: 'Night on the Milky Way', refinements: { name: 'Meteor Swarm', desc: '#1[i]%', level } };
    const details = parseDetails('nanoka', 'lightCone', raw);
    expect('effect' in details && details.effect.name).toBe('Meteor Swarm');
    expect('levels' in details && details.levels[4]).toEqual([0.5]);
  });
});

describe('direcciones de los detalles', () => {
  it('yatta lleva el minuto en vh (sin él, Cloudflare devuelve copias de hasta 16 días); nanoka, la versión', () => {
    const at = Date.UTC(2026, 10, 11, 9, 30, 15);
    const minute = Math.floor(at / 60_000);
    expect(detailsUrl('yatta', 'character', '1511', '4.7.53', at)).toBe(
      `https://sr.yatta.moe/api/v2/es/avatar/1511?vh=${minute}`,
    );
    // En el mismo minuto, la misma dirección; al siguiente, otra.
    expect(detailsUrl('yatta', 'lightCone', '23052', '4.7.53', at + 40_000)).toBe(
      `https://sr.yatta.moe/api/v2/es/equipment/23052?vh=${minute}`,
    );
    expect(detailsUrl('yatta', 'character', '1511', '4.7.53', at + 60_000)).toBe(
      `https://sr.yatta.moe/api/v2/es/avatar/1511?vh=${minute + 1}`,
    );
    expect(detailsUrl('nanoka', 'character', '1511', '4.7.53', at)).toBe(
      'https://static.nanoka.cc/hsr/4.7.53/en/character/1511.json',
    );
  });
});
