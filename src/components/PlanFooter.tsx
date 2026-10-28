import type { RefObject } from 'react';
import type { Result } from '../engine/calculate';
import { formatDate } from '../engine/dates';
import { withSettings, type ChangeState } from '../state/store';
import { fmtDayMonth, fmtInt } from './format';
import { StarlightDefinition } from './glossary';
import { Icon } from './Icon';
import { Tip } from './Tip';
import { TipSumRow } from './TipSumRow';
import { Toggle, ToggleTerm } from './Toggle';

interface Props {
  result: Result;
  countStarlight: boolean;
  /** La cuenta del plan (planBalance). */
  balance: { gross: number; refunded: number; left: number };
  onChange: ChangeState;
  /** El pie: el arrastre de las filas no pasa de su borde de arriba (restrictToRows). */
  footRef: RefObject<HTMLDivElement | null>;
}

/**
 * Pie del plan: el interruptor de la Cosmiluz con lo que devuelve pegado a su texto («+35», así se ve de quién es)
 * y el balance a la derecha, alineado con los costes. La cuenta se sigue a la vista: costes − Cosmiluz frente a
 * las tiradas del Resumen.
 */
export function PlanFooter({ result, countStarlight, balance, onChange, footRef }: Props) {
  const { gross: grossTotal, refunded, left } = balance;
  return (
    <div className="pull-summary" ref={footRef}>
      <Toggle
        checked={countStarlight}
        onChange={(countStarlight) => onChange(withSettings({ countStarlight }))}
        tip={<StarlightDefinition />}
      >
        <span className="refund-label">
          {/*
            El icono pegado a su palabra, como en «Convertir Esquirlas💠 en Jades💎» (tras el interruptor se
            leía como parte del control); en el mismo bloque sin corte, para que no quede solo al partirse.
          */}
          <span>
            Reinvertir{' '}
            <span className="refund-word">
              <ToggleTerm>Cosmiluz</ToggleTerm>
              <Icon kind="starlight" size={20} decorative />
            </span>{' '}
            de las tiradas
          </span>
          {/* Apagada, el hueco se reserva (nada se mueve al encenderla); en palabras para los lectores. */}
          <span className={`pull-refund with-icon with-icon-tight${countStarlight ? '' : ' invisible'}`}>
            <Icon kind="pass" size={16} decorative />
            <span className="pull-refund-num" aria-hidden="true">
              +{fmtInt(refunded)}
            </span>
            {countStarlight && <span className="sr-only">(devuelve {fmtInt(refunded)} tiradas)</span>}
          </span>
        </span>
      </Toggle>
      {/* El balance dice con palabras si llega; el signo sobraba. */}
      <Tip
        as="div"
        // Solo en rojo si faltan; si sobran, en el color de las cifras de encima (es lo normal, no un aviso).
        className={left < 0 ? 'pull-cost pull-balance status-short' : 'pull-cost pull-balance'}
        content={
          <>
            {/*
              La cuenta del balance, como una cuenta escrita: concepto · signo · cifra, con los signos en su propia
              columna (las operaciones se ven sin leer las cifras), la raya de la suma y el resultado. Con la Cosmiluz sin
              reinvertir, su fila dice «—» (no aplica), en la columna de las cifras.
            */}
            <span className="tip-table tip-table-3" aria-hidden="true">
              <TipSumRow label={`Tiradas el ${fmtDayMonth(result.targetDate)}`} value={result.wholeSingles} />
              <TipSumRow label="Coste del plan" sign="−" value={grossTotal} />
              <TipSumRow label="Cosmiluz reinvertida" sign="+" value={countStarlight ? refunded : null} />
              <span className="tip-table-sum" />
              <TipSumRow label={left < 0 ? 'Faltan' : 'Sobran'} value={Math.abs(left)} total />
            </span>
            <span className="sr-only">
              {`${fmtInt(result.wholeSingles)} tiradas el ${formatDate(result.targetDate)}, menos ${fmtInt(grossTotal)} que cuesta el plan`}
              {countStarlight ? `, más ${fmtInt(refunded)} de la Cosmiluz reinvertida` : ', sin reinvertir la Cosmiluz'}
              {`: ${left < 0 ? 'faltan' : 'sobran'} ${fmtInt(Math.abs(left))}.`}
            </span>
          </>
        }
      >
        <span className="pull-balance-label">{left < 0 ? 'Faltan' : 'Sobran'}</span>
        <Icon kind="pass" size={26} decorative />
        <strong>{fmtInt(Math.abs(left))}</strong>
      </Tip>
    </div>
  );
}
