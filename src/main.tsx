import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TrialHub } from './components/TrialHub';
import { isTrial } from 'learning-app-kit/sync';
import { SplashScreen } from './components/SplashScreen';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 体験の入口（#trial。名乗りは聞かない）。体験中のタブは、おわるまで体験の入口のまま */}
    {isTrial() ? <TrialHub /> : <App />}
    <SplashScreen />
  </StrictMode>,
);
