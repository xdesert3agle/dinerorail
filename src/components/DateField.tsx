import AirDatepicker, { type AirDatepickerLocale } from 'air-datepicker';
import 'air-datepicker/air-datepicker.css';
import { useEffect, useId, useRef, useState } from 'react';
import { formatDate, todayISO } from '../engine/dates';
import type { ISODate } from '../engine/types';

// Locale propio en vez del de la librería (que viene en CommonJS y sin tildes): semana de lunes a domingo.
const LOCALE_ES: AirDatepickerLocale = {
  days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  daysShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  daysMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  today: 'Hoy',
  clear: 'Borrar',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  firstDay: 1,
};

/** Fecha ISO a Date local (medianoche), que es lo que maneja el calendario. */
const toLocalDate = (iso: ISODate) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

interface Props {
  value: ISODate;
  onChange: (value: ISODate) => void;
  /** Primer día que se puede elegir. */
  min?: ISODate;
  id?: string;
  'aria-label'?: string;
  /** Días señalados: el calendario los marca con un punto y su nombre al pasar por encima. */
  marks?: { date: ISODate; label: string }[];
}

/**
 * Campo de fecha con el calendario de air-datepicker en lugar del nativo del navegador.
 * El campo es de solo lectura (se elige en el calendario, también con el teclado) y muestra dd/mm/aaaa.
 */
export function DateField({ value, onChange, min, id, 'aria-label': ariaLabel, marks }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<AirDatepicker | null>(null);
  // Refs para que el calendario, creado una sola vez, use siempre el valor y el callback actuales.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const marksRef = useRef(marks);
  valueRef.current = value;
  onChangeRef.current = onChange;
  marksRef.current = marks;
  // Para los lectores de pantalla: el campo abre un calendario y se dice si está abierto.
  const [open, setOpen] = useState(false);
  const hintId = useId();

  useEffect(() => {
    const picker = new AirDatepicker(inputRef.current!, {
      locale: LOCALE_ES,
      selectedDates: [toLocalDate(valueRef.current)],
      minDate: min ? toLocalDate(min) : false,
      autoClose: true,
      toggleSelected: false,
      position: 'bottom left',
      navTitles: { days: 'MMMM <i>yyyy</i>' },
      // En pantallas táctiles, ventana centrada en vez de desplegable.
      isMobile: window.matchMedia('(pointer: coarse)').matches,
      onShow: (done) => !done && setOpen(true),
      onHide: (done) => !done && setOpen(false),
      // Días señalados: clase para el punto (CSS) y su nombre como título de la celda.
      onRenderCell: ({ date, cellType }) => {
        if (cellType !== 'day') return;
        const iso = todayISO(date);
        const names = marksRef.current?.filter((m) => m.date === iso).map((m) => m.label);
        if (names?.length) return { classes: 'is-key-date', attrs: { title: names.join(' · ') } };
      },
      onSelect: ({ date }) => {
        if (!(date instanceof Date)) return;
        const iso = todayISO(date);
        if (iso !== valueRef.current) onChangeRef.current(iso);
      },
    });
    pickerRef.current = picker;
    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
    // Se crea una sola vez: el mínimo y el valor se sincronizan en los efectos de abajo.
  }, []);

  // Si la fecha cambia desde fuera (atajos, deshacer), el calendario la sigue sin volver a avisar.
  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const selected = picker.selectedDates[0];
    if (selected && todayISO(selected) === value) return;
    const date = toLocalDate(value);
    void picker.selectDate(date, { silent: true });
    picker.setViewDate(date);
  }, [value]);

  useEffect(() => {
    pickerRef.current?.update({ minDate: min ? toLocalDate(min) : false });
  }, [min]);

  return (
    <span className="input-wrap date-field">
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        value={formatDate(value)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={hintId}
      />
      <span id={hintId} className="sr-only">
        Se abre un calendario: elige el día con las flechas y pulsa intro.
      </span>
      <svg
        className="date-field-icon"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="12" height="11" rx="1.5" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
      </svg>
    </span>
  );
}
