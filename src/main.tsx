import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { requestPersistentStorage } from './db';
import { seedIfFirstRun } from './lib/songs';
import './styles.css';

registerSW({ immediate: true });
void requestPersistentStorage();
void seedIfFirstRun();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
