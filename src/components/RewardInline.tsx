import type { Reward } from '../engine/types';
import { fmtInt } from './format';
import { Icon } from './Icon';

/** Una recompensa en línea, con el icono de cada objeto («+1.200 💎 +1 🎟»): fuentes de ingresos y eventos. */
export function RewardInline({ reward }: { reward: Reward }) {
  if (!reward.jades && !reward.specialPasses) return <>Sin recompensa</>;
  return (
    <span className="reward">
      {reward.jades > 0 && (
        <span className="with-icon">
          <Icon kind="jade" size={16} />+{fmtInt(reward.jades)}
        </span>
      )}
      {reward.specialPasses > 0 && (
        <span className="with-icon">
          <Icon kind="pass" size={16} />+{fmtInt(reward.specialPasses)}
        </span>
      )}
    </span>
  );
}
