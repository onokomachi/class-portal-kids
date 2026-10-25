import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SplashScreen } from './components/SplashScreen';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SplashScreen />
  </StrictMode>,
);
