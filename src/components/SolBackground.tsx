/**
 * SOL の背景（ロゴの輪が回る動画。2026-11-07 先生が用意した2本目の動画。中央を切り出して大きく、前に流したあと逆に流す往復（約16秒）にして、ループの区切れ目をなくしてある）。
 *
 * - 画面全体の後ろに固定し、ロゴを切らずに中央に置く（object-fit: contain）
 * - 動画は黒地なので、`mix-blend-mode: screen`（黒は何も足さない）で今の背景の上に重ねる。
 *   画面の縦横の比がちがっても、動画のふちが四角く見えない
 * - 音なし（muted）・ループ・playsInline。置き場は共通の learning-media（src/lib/media.ts）
 * - 「動きを減らす」設定・データ節約のときは、動かさずに先頭の1枚だけ出す
 * - 読めなかったとき（ネットが切れている など）は何も出さない（今までの背景のまま）
 * - SANMON タブの中は緑と金の別の世界なので出さない（Hub が body に in-sanmon を付ける。index.css の .sol-bg）
 */
import { useEffect, useState } from 'react';
import { media } from '../lib/media';

function shouldReduce(): boolean {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    const c = (navigator as { connection?: { saveData?: boolean } }).connection;
    return !!c?.saveData;
  } catch {
    return false;
  }
}

export function SolBackground() {
  const [reduce] = useState(shouldReduce);
  const [failed, setFailed] = useState(false);
  // 一時停止された（省電力モードなど）ときに、できるなら再生をつづける
  useEffect(() => {
    if (reduce || failed) return;
    const onVis = () => {
      if (document.hidden) return;
      document.querySelector<HTMLVideoElement>('.sol-bg video')?.play().catch(() => { /* 再生できなくても今の背景のまま */ });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reduce, failed]);

  if (failed) return null;
  const poster = media('/videos/sol/poster3.jpg');
  return (
    <div className="sol-bg" aria-hidden>
      {reduce ? (
        <img src={poster} alt="" onError={() => setFailed(true)} />
      ) : (
        <video autoPlay muted loop playsInline preload="auto" poster={poster} onError={() => setFailed(true)}>
          <source src={media('/videos/sol/bg3.mp4')} type="video/mp4" />
          <source src={media('/videos/sol/bg3.webm')} type="video/webm" />
        </video>
      )}
    </div>
  );
}
