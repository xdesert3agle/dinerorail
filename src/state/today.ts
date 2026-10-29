import { useEffect, useState } from 'react';
import { todayISO } from '../engine/dates';
import type { ISODate } from '../engine/types';

/**
 * Hoy, en fecha local. Cambia sola a medianoche con la app abierta, y se comprueba también al volver a la
 * pestaña: con el equipo suspendido el temporizador se retrasa (como la sincronización semanal del catálogo).
 */
export function useToday(): ISODate {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    // Con el mismo día, React no vuelve a pintar.
    const refresh = () => setToday(todayISO());
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // Un segundo de margen, para no despertar justo antes de que cambie la fecha.
    const timer = window.setTimeout(refresh, midnight.getTime() - now.getTime() + 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);
  return today;
}
