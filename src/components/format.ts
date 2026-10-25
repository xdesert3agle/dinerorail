import { WEEKDAYS } from '../engine/dates';
import { JPY_PER_EUR } from '../engine/packs';
import type { Schedule } from '../engine/types';

// useGrouping 'always': en es-ES los números de 4 cifras no llevan punto por defecto (6560 pero 12.960).
const nf = (digits: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' });
const int = nf(0);
const dec1 = nf(1);
const dec2 = nf(2);

export const fmtInt = (n: number) => int.format(n);

/** El cambio fijo de los precios de Japón, «174,25 ¥/€». */
export const YEN_RATE = `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(JPY_PER_EUR)} ¥/€`;
/** Precios de Japón: se eligen en Configuración (Tienda); en la tarjeta de paquetes solo se avisa. */
export const YEN_PRICES_TIP = `Precios de Japón (¥) pasados a euros a ${YEN_RATE}`;
export const fmtSingles = (n: number, digits: 1 | 2 = 2) => (digits === 1 ? dec1 : dec2).format(n);
/** Singles enteras, las que se pueden tirar: 81,5 son 81 (el margen salva los errores de coma flotante). */
export const wholeSingles = (n: number) => Math.floor(n + 1e-9);

const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
// A mano y no con Intl: según el navegador, es-ES sale con punto ("nov.") o sin él ("nov").
const MONTHS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

/** Cuánto falta para un día: "hoy", "mañana" o "en 19 días" (va entre paréntesis tras la fecha o el día). */
export const fmtCountdown = (days: number) => (days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${fmtInt(days)} días`);

/** Solo el mes de una fecha, como "nov." (la cabecera de una hoja de calendario). */
export const fmtMonth = (iso: string) => MONTHS[Number(iso.split('-')[1]) - 1];

/** Día y mes de una fecha, como "11 nov." (sin año: para fechas cercanas, con la cuenta atrás al lado). */
export const fmtDayMonth = (iso: string) => {
  const [, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

/** Fecha y hora de un momento (ms), como "5 nov. 2026 a las 18:30". */
export const fmtMoment = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} a las ${timeFmt.format(d)}`;
};

export function describeSchedule(s: Schedule): string {
  switch (s.type) {
    case 'daily':
      return 'Cada día';
    case 'weekly':
      return `Cada ${WEEKDAYS[s.weekday]}`;
    case 'monthly':
      return `El día ${s.day} de cada mes`;
    case 'cycle':
      return `Cada ${s.periodDays} días`;
    case 'perPatch':
      if (s.offsetDays === 0) return 'Al inicio de cada parche';
      return s.offsetDays < 0
        ? `${-s.offsetDays} días antes de cada parche`
        : `${s.offsetDays} días después del inicio de cada parche`;
  }
}

export function pendingLabel(s: Schedule): string | null {
  switch (s.type) {
    case 'daily':
      return 'Aún no lo he cobrado hoy';
    case 'weekly':
      return 'Aún no la he cobrado esta semana';
    case 'monthly':
      return 'Aún no lo he cobrado este mes';
    case 'cycle':
      return 'Aún no he cobrado el ciclo actual';
    case 'perPatch':
      return null;
  }
}
