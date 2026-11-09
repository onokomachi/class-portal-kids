/**
 * SOL の背景（ロゴの輪が回る動画。2026-11-07 先生が用意した2本目の動画。中央を切り出して大きく、前→逆の「振り子」（19秒）にしてある。
 *   折り返しで速さがゼロまで落ちてから逆に加速し、そこでロゴが少し明るく息をする。ループの区切れ目も折り返しの切り替わりも目立たない）。
 *
 * - 画面全体の後ろに固定し、ロゴを切らずに中央に置く（object-fit: contain）
 * - 動画は黒地なので、`mix-blend-mode: screen`（黒は何も足さない）で今の背景の上に重ねる。
 *   画面の縦横の比がちがっても、動画のふちが四角く見えない
 * - 音なし（muted）・ループ・playsInline。置き場は共通の learning-media（src/lib/media.ts）
 * - 「動きを減らす」設定・データ節約のときは、動かさずに先頭の1枚だけ出す
 * - 読めなかったとき（ネットが切れている など）は動画を出さない（今までの背景のまま）
 * - 動画のロゴの円の中に「SOL」の文字（.sol-center。ホーム・体験の入口。カードの後ろ）
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

  const poster = media('/videos/sol/poster4.jpg');
  return (
    <>
      {!failed && (
        <div className="sol-bg" aria-hidden>
          {reduce ? (
            <img src={poster} alt="" onError={() => setFailed(true)} />
          ) : (
            <video autoPlay muted loop playsInline preload="auto" poster={poster} onError={() => setFailed(true)}>
              <source src={media('/videos/sol/bg4.mp4')} type="video/mp4" />
              <source src={media('/videos/sol/bg4.webm')} type="video/webm" />
            </video>
          )}
        </div>
      )}
      {/* 「SOL」の文字を動画のロゴの円の中に（2026-11-09）。カードの後ろ（#root の下）なので、カードのすき間・上のあきから見える。
          名乗りの画面は自分の文字（.join-hero）を持つので、そのあいだは消す（index.css の .on-join .sol-center）。SANMON タブでは出さない */}
      <div className="sol-center" aria-hidden><div className="sol-title">SOL</div></div>
    </>
  );
}
