import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Primero la hoja de air-datepicker y luego la nuestra: las reglas del calendario en styles.css pesan lo mismo que
// las de la librería y ganan solo por ir después. Aquí ese orden no depende de qué importa App ni de cuándo.
import 'air-datepicker/air-datepicker.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
