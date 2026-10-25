/**
 * 起動スプラッシュ。開くたびに一瞬だけ出る（PRISM と同じ見せ方）。
 *
 * 「presented by onokomachi」（0.5秒）→ SOL のロゴ（1秒）の2段。
 * 記録の読みこみ（App）はこの裏で並行に進んでいて、スプラッシュを待たせるためのものではない——ただの見せ方。
 * ロゴの画像（public/sol-logo.jpg）は地の色が #01040b なので、スプラッシュの地も同じ色にしてつなぎ目を消す。
 */
import { useEffect, useState } from 'react';

const BRAND_MS = 500;   // 「presented by onokomachi」を見せる時間
const LOGO_MS = 1000;   // ロゴを見せる時間
const FADE_MS = 260;    // 消えるときのフェード

type Stage = 'brand' | 'logo' | 'out' | 'done';

export function SplashScreen() {
  const [stage, setStage] = useState<Stage>('brand');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('logo'), BRAND_MS);
    const t2 = setTimeout(() => setStage('out'), BRAND_MS + LOGO_MS);
    const t3 = setTimeout(() => setStage('done'), BRAND_MS + LOGO_MS + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (stage === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{ background: '#01040b', opacity: stage === 'out' ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}
      aria-hidden="true"
    >
      {stage === 'brand' ? (
        <p key="brand" className="splash-float text-sm sm:text-base tracking-[0.3em] uppercase text-mute">
          presented by onokomachi
        </p>
      ) : (
        <img key="logo" src="/sol-logo.jpg" alt="" className="splash-float w-80 sm:w-[28rem] h-auto"
          // 画像のふちを地になじませる（画像の地と画面の地の、わずかな色のちがいで四角が見えないように）
          style={{ WebkitMaskImage: 'radial-gradient(closest-side, #000 82%, transparent 100%)', maskImage: 'radial-gradient(closest-side, #000 82%, transparent 100%)' }} />
      )}
    </div>
  );
}
