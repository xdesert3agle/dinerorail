import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
// Con extensión, como la pide el cargador de configuración de Vite (y urls.ts la pone en el suyo).
import { EXTERNAL_ORIGINS } from './src/engine/urls.ts';

/** SHA-256 en base64 de un texto, como lo pide la CSP para un script en línea (Web Crypto: sin tipos de Node). */
async function sha256(text: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return btoa(String.fromCharCode(...digest));
}

/**
 * Política de seguridad del contenido (CSP), solo en la build: GitHub Pages no deja poner cabeceras, así que va en
 * un <meta>, y el servidor de desarrollo de Vite mete scripts en línea que bloquearía. Scripts, solo los de la app
 * y los del index.html en línea (el del tema), por su hash; peticiones e imágenes, solo a los orígenes de urls.ts.
 * Sin require-trusted-types-for: air-datepicker escribe su calendario con innerHTML.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const inline = await Promise.all(
          [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(async ([, code]) => `'sha256-${await sha256(code)}'`),
        );
        const policy = [
          ['script-src', "'self'", ...inline],
          ['connect-src', "'self'", ...EXTERNAL_ORIGINS.data],
          ['img-src', "'self'", 'data:', ...EXTERNAL_ORIGINS.images],
          ['object-src', "'none'"],
          ['base-uri', "'none'"],
          ['form-action', "'none'"],
        ]
          .map((directive) => directive.join(' '))
          .join('; ');
        return html.replace(
          '<meta charset="UTF-8" />',
          `$&\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // Rutas relativas para poder publicar la build en cualquier subcarpeta (GitHub Pages, etc.).
  base: './',
  test: {
    // Zona horaria fija: los tests de fechas (el cambio de hora de octubre) dan lo mismo en local y en CI (UTC).
    env: { TZ: 'Europe/Madrid' },
  },
});
