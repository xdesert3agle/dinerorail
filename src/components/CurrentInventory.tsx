import type { Result } from '../engine/calculate';
import { effectivePity } from '../engine/pulls';
import type { AppState, Inventory, PullKind } from '../engine/types';
import { withSettings, type ChangeState } from '../state/store';
import { fmtInt, floorSingles } from './format';
import { StarlightDefinition } from './glossary';
import { Icon } from './Icon';
import { NumberField } from './NumberField';
import { TipTitle } from './Tip';
import { Toggle, ToggleTerm } from './Toggle';

interface Props {
  state: AppState;
  result: Result;
  onChange: ChangeState;
}

const PITY_FIELDS: { kind: PullKind; label: string; guaranteedLabel: string }[] = [
  // «… garantizado»: la palabra es el término con explicación (ToggleTerm).
  { kind: 'character', label: 'Pity de personaje', guaranteedLabel: 'Siguiente personaje' },
  { kind: 'lightCone', label: 'Pity de cono de luz', guaranteedLabel: 'Siguiente cono de luz' },
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
          <NumberField icon="jade" label="Jades Estelares" value={inv.jades} min={0} onChange={(jades) => setInv({ jades })} />
          <NumberField icon="shard" label="Esquirlas Oníricas" value={inv.shards} min={0} onChange={(shards) => setInv({ shards })} />
          <NumberField
            icon="starlight"
            label="Cosmiluz Inextinguible"
            // La misma definición que el interruptor del plan (un término, una definición: ver glossary.tsx).
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
              {/*
                La equivalencia con nombre e icono, cada icono pegado a su palabra (como en el texto del interruptor).
                Los espacios del «=», fijos: en flex se recortan.
              */}
              <span className="with-icon with-icon-tight">
                1 Esquirla Onírica
                <Icon kind="shard" size={18} decorative />
                {'\u00a0=\u00a01 Jade Estelar'}
                <Icon kind="jade" size={18} decorative />
              </span>
            </>
          }
        >
          {/* Cada icono pegado a su palabra; el espacio antes de «en», fijo (en flex se recortaría). */}
          <span className="with-icon with-icon-tight shards-as-jades">
            {/* En un solo trozo, para que el espacio entre las dos palabras no se recorte (flex). */}
            <span>
              Convertir <ToggleTerm>Esquirlas</ToggleTerm>
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
              label={label}
              // El que cuenta (effectivePity): hasta el máximo de Configuración − 1, como el plan y la previsión.
              value={effectivePity(state.pity, hardPity)[kind]}
              min={0}
              max={hardPity[kind] - 1}
              // «Pity» se explica una vez por tarjeta (glosario), como «garantizado»: en el primero, con los dos banners.
              info={
                i === 0 && (
                  <>
                    <TipTitle>Pity</TipTitle>
                    {`Tiradas desde el último 5★ de ese banner. Puede llegar hasta una menos que el máximo definido en Configuración › Pity (${hardPity.character - 1} de personaje, ${hardPity.lightCone - 1} de cono de luz): la tirada que alcanza el máximo da el 5★ seguro.`}
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
                    El último 5★ de ese banner no fue el destacado (se perdió el 50/50): el próximo 5★ será el destacado seguro.
                  </>
                )
              }
            >
              {/* «Siguiente»: solo el próximo 5★ de ese banner es seguro. En un trozo: la etiqueta es flex. */}
              <span>
                {guaranteedLabel} <ToggleTerm>garantizado</ToggleTerm>
              </span>
            </Toggle>
          </div>
        ))}
      </div>
    </section>
  );
}
