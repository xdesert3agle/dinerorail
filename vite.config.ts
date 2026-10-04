import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas para poder publicar la build en cualquier subcarpeta (GitHub Pages, etc.).
  base: './',
});
