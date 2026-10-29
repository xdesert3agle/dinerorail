import 'react';

declare module 'react' {
  /** Variables CSS en `style`: style={{ '--arrow-x': '12px' }}, sin tener que forzar el tipo. */
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined;
  }
}
