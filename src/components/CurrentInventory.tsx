import type { Result } from '../engine/calculate';
import { effectivePity } from '../engine/pulls';
import { fiftyFiftyName } from '../engine/rules';
import type { AppState, Inventory, PullKind } from '../engine/types';
import { withSettings, type ChangeState } from '../state/store';
import { fmtInt, fmtSettingsPath, floorSingles } from './format';
import { StarlightDefinition } from './glossary';
import { Icon } from './Icon';
import { NumberField } from './NumberField';
import { Term, TipTitle } from './Tip';
import { TipEquation } from './TipEquation';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
  result: Result;
  onChange: ChangeState;
}

const PITY_FIELDS: { kind: PullKind; label: string; guaranteedLabel: string }[] = [
  // «Pity …» y «… garantizado»: la palabra es el término con explicación (Term).
  { kind: 'character', label: 'de personaje', guaranteedLabel: 'Siguiente personaje' },
  { kind: 'lightCone', label: 'de cono de luz', guaranteedLabel: 'Siguiente cono de luz' },
];

export function CurrentInventory({ state, result, onChange }: Props) {
  const inv = state.inventory;
  const { hardPity } = state.settings;
  const setInv = (patch: Partial<Inventory>) => onChange((s) => ({ ...s, inventory: { ...s.inventory, ...patch } }));
  const setGuaranteed = (kind: PullKind, value: boolean) =>
    onChange((s) => ({ ...s, guaranteed: { ...s.guaranteed, [kind]: value } }));

  return (
    <section className="card card-inventory">
      <header className="card-header">
        <h2>Recursos actuales</h2>
        {/* Solo las enteras (no se tira media tirada); sin explicación, como la cifra del Resumen. */}
        <span className="card-total">
          <Icon kind="pass" size={28} decorative />
          <span className="sr-only">Tiradas ahora: </span>
          {fmtInt(floorSingles(result.currentSingles))}
        </span>
      </header>

      {/* Los campos del inventario y su interruptor de Esquirlas, juntos (como el pity y su garantizado). */}
      <div className="field-group">
        <div className="grid-4">
          <NumberField
            icon="pass"
            label="Pases Especiales"
            value={inv.specialPasses}
            min={0}
            onChange={(specialPasses) => setInv({ specialPasses })}
          />
          <NumberField
            noStepper
            icon="jade"
            label="Jades Estelares"
            value={inv.jades}
            min={0}
            onChange={(jades) => setInv({ jades })}
          />
          <NumberField
            noStepper
            icon="shard"
            label="Esquirlas Oníricas"
            value={inv.shards}
            min={0}
            onChange={(shards) => setInv({ shards })}
          />
          <NumberField
            icon="starlight"
            // Toda la etiqueta es el término. La misma definición que el interruptor del plan (ver glossary.tsx).
            label={<Term>Cosmiluz Inextinguible</Term>}
            info={<StarlightDefinition />}
            value={inv.starlight}
            min={0}
            onChange={(starlight) => setInv({ starlight })}
          />
        </div>

        <Toggle
          checked={state.settings.includeShards}
          onChange={(includeShards) => onChange(withSettings({ includeShards }))}
          tip={
            <>
              <TipTitle>Esquirlas Oníricas</TipTitle>
              {/* La equivalencia con nombre e icono, cada icono pegado a su palabra (como en el texto del interruptor). */}
              <TipEquation
                left={{ text: '1 Esquirla Onírica', icon: 'shard' }}
                right={[{ text: '1 Jade Estelar', icon: 'jade' }]}
              />
            </>
          }
        >
          {/* Cada icono pegado a su palabra; el espacio antes de «en», fijo (en flex se recortaría). */}
          <span className="with-icon with-icon-tight shards-as-jades">
            {/* En un solo trozo, para que el espacio entre las dos palabras no se recorte (flex). */}
            <span>
              Convertir <Term>Esquirlas</Term>
            </span>
            <Icon kind="shard" size={16} decorative />
            {'\u00a0en Jades'}
            <Icon kind="jade" size={16} decorative />
          </span>
        </Toggle>
      </div>

      <div className="grid-2 group-gap pity-grid">
        {PITY_FIELDS.map(({ kind, label, guaranteedLabel }, i) => (
          <div key={kind} className="pity-field">
            <NumberField
              // Sin Term en el de cono de luz (no lleva explicación): ahí es texto normal.
              label={
                <>
                  <Term>Pity</Term> {label}
                </>
              }
              // El que cuenta (effectivePity): hasta el máximo de Configuración − 1, como el plan y la previsión.
              value={effectivePity(state.pity, hardPity)[kind]}
              min={0}
              max={hardPity[kind] - 1}
              // «Pity» se explica una vez por tarjeta (glosario), como «garantizado»: en el primero, con los dos banners.
              info={
                i === 0 && (
                  <>
                    <TipTitle>Pity</TipTitle>
                    {/* Límite: el de Configuración (80); máximo: el pity más alto (79). La tirada que sigue al máximo es la del límite. */}
                    {`Tiradas realizadas desde el último 5★ de ese banner. Puede alcanzar un máximo de una menos que el límite definido en ${fmtSettingsPath('Pity')} (${hardPity.character - 1} en personaje y ${hardPity.lightCone - 1} en cono de luz). Al llegar a ese máximo, la siguiente tirada garantiza un 5★.`}
                  </>
                )
              }
              onChange={(v) =>
                onChange((s) => ({ ...s, pity: { ...s.pity, [kind]: v } }))
              }
            />
            <Toggle
              checked={state.guaranteed[kind]}
              onChange={(v) => setGuaranteed(kind, v)}
              // «Garantizado» se explica una vez por tarjeta (glosario): en el primero, el de personaje.
              tip={
                i === 0 && (
                  <>
                    <TipTitle>Garantizado</TipTitle>
                    {`El último 5★ de ese banner no fue el destacado (se perdió el ${fiftyFiftyName('character')} o el ${fiftyFiftyName('lightCone')}). El próximo 5★ será el destacado con total seguridad.`}
                  </>
                )
              }
            >
              {/* «Siguiente»: solo el próximo 5★ de ese banner es seguro. En un trozo: la etiqueta es flex. */}
              <span>
                {guaranteedLabel} <Term>garantizado</Term>
              </span>
            </Toggle>
          </div>
        ))}
      </div>
    </section>
  );
}
