import { fmtInt } from './format';
import { Icon, type IconKind } from './Icon';

/**
 * Una línea de una cuenta escrita (.tip-table-3): concepto · signo · cifra con su icono (el ticket, o el de lo que
 * se cuenta). Sin cifra (null), «—» (no aplica), sin signo y con el hueco del icono reservado para que quede en
 * la columna de las cifras.
 */
export function TipSumRow({
  label,
  sign,
  value,
  total,
  icon = 'pass',
}: {
  label: string;
  sign?: string;
  value: number | null;
  total?: boolean;
  icon?: IconKind;
}) {
  return (
    <span className={total ? 'tip-table-row tip-table-total' : 'tip-table-row'}>
      <span>{label}</span>
      <span>{value !== null && sign}</span>
      <span className="with-icon with-icon-tight tip-table-value">
        {value === null ? '—' : fmtInt(value)}
        <span className={value === null ? 'with-icon invisible' : 'with-icon'}>
          <Icon kind={icon} size={16} decorative />
        </span>
      </span>
    </span>
  );
}
