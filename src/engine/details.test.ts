import { describe, expect, it } from 'vitest';
import { formatDesc, normalizeDetails, parseCharacterDetails, parseLightConeDetails } from './details';

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

  it('separa las líneas con "\\n" escrito con la barra', () => {
    const lines = formatDesc('Skill Lv. +2.\\nBasic ATK Lv. +1.', []);
    expect(lines.map((l) => l.map((s) => s.text).join(''))).toEqual(['Skill Lv. +2.', 'Basic ATK Lv. +1.']);
  });

  it('lee los 6 Eidolones de un personaje', () => {
    const raw = { name: 'Kafka', ranks: Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, rank(n)])) };
    const details = parseCharacterDetails(raw);
    expect(details.name).toBe('Kafka');
    expect(details.eidolons.map((e) => e.name)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']);
    expect(normalizeDetails('character', details)).toEqual(details);
    expect(() => parseCharacterDetails({ name: 'Kafka', ranks: { 1: rank(1) } })).toThrow();
  });

  it('lee el efecto de un cono en S1…S5', () => {
    const level = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, { param_list: [n / 10] }]));
    const raw = { name: 'Night on the Milky Way', refinements: { name: 'Meteor Swarm', desc: '#1[i]%', level } };
    const details = parseLightConeDetails(raw);
    expect(details.effect.name).toBe('Meteor Swarm');
    expect(details.levels[4]).toEqual([0.5]);
    expect(normalizeDetails('lightCone', details)).toEqual(details);
    expect(normalizeDetails('character', details)).toBeNull();
  });
});
