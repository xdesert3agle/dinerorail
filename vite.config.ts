import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas para poder publicar la build en cualquier subcarpeta (GitHub Pages, etc.).
  base: './',
  test: {
    // Zona horaria fija: los tests de fechas (el cambio de hora de octubre) dan lo mismo en local y en CI (UTC).
    env: { TZ: 'Europe/Madrid' },
  },
});
