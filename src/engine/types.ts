/** Fecha sin hora en formato YYYY-MM-DD. */
export type ISODate = string;

export interface Reward {
  jades: number;
  /** Pases Especiales de Raíles Estelares (banners limitados). */
  specialPasses: number;
}

/** Cuándo se cobra una fuente. */
export type Schedule =
  | { type: 'daily' }
  /** weekday: 0 = lunes … 6 = domingo */
  | { type: 'weekly'; weekday: number }
  | { type: 'monthly'; day: number }
  /** Cada `periodDays` días a partir de `anchor` (endgames, renovaciones…). */
  | { type: 'cycle'; anchor: ISODate; periodDays: number }
  /** Una vez por parche, `offsetDays` días después de su inicio (puede ser negativo). */
  | { type: 'perPatch'; offsetDays: number };

export type SourceCategory = 'diario' | 'semanal' | 'endgame' | 'parche' | 'mensual' | 'otro';

export interface Source {
  id: string;
  name: string;
  description?: string;
  category: SourceCategory;
  enabled: boolean;
  schedule: Schedule;
  reward: Reward;
  /** El cobro del periodo en curso (hoy, esta semana, el ciclo actual…) aún no está hecho: se suma hoy. */
  pendingNow: boolean;
  /** Fuente creada por el usuario (se puede borrar). */
  custom?: boolean;
}

export interface PatchEvent {
  id: string;
  name: string;
  /** Día en que se cuenta el cobro. */
  date: ISODate;
  jades: number;
  specialPasses: number;
}

export interface Patch {
  id: string;
  version: string;
  start: ISODate;
  events: PatchEvent[];
}

export interface Inventory {
  jades: number;
  specialPasses: number;
  /** Esquirlas Oníricas (se convierten 1:1 en Jades). */
  shards: number;
  /** Cosmiluz Inextinguible (20 = 1 Pase Especial en la tienda). */
  starlight: number;
}

/** Tema visual de la app. */
export type Skin = 'kafka' | 'aha' | 'grafito' | 'sparxie';

/** Modo claro u oscuro: "system" sigue al del sistema. */
export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  skin: Skin;
  theme: ThemeMode;
  includeShards: boolean;
  /** Descontar de las tiradas futuras la Cosmiluz Inextinguible que se recupera. */
  countStarlight: boolean;
  /** Pagar los paquetes con los precios de Japón, pasados a euros. */
  packsInYen: boolean;
  /** Tiradas que se cuentan para sacar un 5★ en cada banner (peor caso de Tiradas futuras). */
  hardPity: Record<PullKind, number>;
}

export type PullKind = 'character' | 'lightCone';

/** Tiradas hechas desde el último 5★ en cada banner (el pity no se comparte entre banners). */
export interface Pity {
  character: number;
  lightCone: number;
}

/** Un personaje o cono de luz que se quiere sacar, en orden. */
export interface PlannedPull {
  id: string;
  name: string;
  kind: PullKind;
  /** Si gana el 50/50 cuesta un pity; si lo pierde, dos. */
  winsFiftyFifty: boolean;
}

/** Cuántas veces se cuenta con comprar un paquete de Esquirlas y si la primera compra lleva el x2. */
export interface ShardPackPurchase {
  count: number;
  firstBonus: boolean;
}

export interface AppState {
  version: 1;
  inventory: Inventory;
  pity: Pity;
  /** Se perdió el último 50/50 de ese banner: el próximo 5★ es el destacado seguro. */
  guaranteed: Record<PullKind, boolean>;
  plannedPulls: PlannedPull[];
  targetDate: ISODate;
  sources: Source[];
  patches: Patch[];
  /** Paquetes de Esquirlas que se cuenta con comprar, por id de paquete. */
  shardPacks: Record<string, ShardPackPurchase>;
  settings: Settings;
}

export interface IncomeEvent {
  date: ISODate;
  sourceId: string;
  reward: Reward;
}
