import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TrialHub } from './components/TrialHub';
import { isTrial } from 'learning-app-kit/sync';
import { SplashScreen } from './components/SplashScreen';
import { SolBackground } from './components/SolBackground';
import './index.css';

// 背景の動画は #root の外に置く。#root の中に入れると、重なりの順番と色の混ざり方（screen）が #root の中だけで閉じて、
// カードの前に出て黒い四角も見えてしまう（#root は z-index:1 の別の層になるため）
const bg = document.createElement('div');
document.body.prepend(bg);
createRoot(bg).render(<SolBackground />);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 体験の入口（#trial。名乗りは聞かない）。体験中のタブは、おわるまで体験の入口のまま */}
    {isTrial() ? <TrialHub /> : <App />}
    <SplashScreen />
  </StrictMode>,
);
