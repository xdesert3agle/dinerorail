import oneiricShard from '../assets/icons/oneiric-shard.webp';
import specialPass from '../assets/icons/special-pass.webp';
import stellarJade from '../assets/icons/stellar-jade.webp';
import undyingStarlight from '../assets/icons/undying-starlight.webp';

// Iconos de los objetos del juego, sacados de https://github.com/Mar-7th/StarRailRes. En WebP, a más del doble del
// mayor tamaño al que se pintan: 72px los que llegan a 28px, y el Pase a 128px (64px en la cifra del Resumen).
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
