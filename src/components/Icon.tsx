import oneiricShard from '../assets/icons/oneiric-shard.png';
import specialPass from '../assets/icons/special-pass.png';
import stellarJade from '../assets/icons/stellar-jade.png';
import undyingStarlight from '../assets/icons/undying-starlight.png';

// Iconos de los objetos del juego, sacados de https://github.com/Mar-7th/StarRailRes
const ICONS = {
  jade: { src: stellarJade, alt: 'Jades Estelares' },
  pass: { src: specialPass, alt: 'Pases Especiales' },
  shard: { src: oneiricShard, alt: 'Esquirlas Oníricas' },
  starlight: { src: undyingStarlight, alt: 'Cosmiluz Inextinguible' },
} as const;

export type IconKind = keyof typeof ICONS;

interface Props {
  kind: IconKind;
  size?: number;
  /** Si el texto de al lado ya dice qué es, el icono es decorativo. */
  decorative?: boolean;
}

export function Icon({ kind, size = 20, decorative = false }: Props) {
  const { src, alt } = ICONS[kind];
  return (
    <img
      className="icon"
      src={src}
      alt={decorative ? '' : alt}
      title={decorative ? undefined : alt}
      width={size}
      height={size}
      draggable={false}
    />
  );
}
