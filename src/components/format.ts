import { WEEKDAYS } from '../engine/dates';
import type { Schedule } from '../engine/types';

// useGrouping 'always': en es-ES los números de 4 cifras no llevan punto por defecto (6560 pero 12.960).
const nf = (digits: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' });
const int = nf(0);
const dec1 = nf(1);
const dec2 = nf(2);

export const fmtInt = (n: number) => int.format(n);
export const fmtSingles = (n: number, digits: 1 | 2 = 2) => (digits === 1 ? dec1 : dec2).format(n);
/** Como fmtSingles, pero sin decimales cuando la cifra es entera (81 en vez de 81,00). */
export const fmtSinglesShort = (n: number) => (Math.abs(n - Math.round(n)) < 1e-9 ? int.format(Math.round(n)) : dec2.format(n));

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
