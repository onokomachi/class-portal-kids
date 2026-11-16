/**
 * SANMON タブの CAT-WARS の入口（2026-11-16 CW-5c。先生が決めた：「SOL に入り口を出すが、閉じておく、PRISM で管理」）。
 *
 * - SANMON の入口の すぐ下（スタミナは SANMON と共通なので 同じタブ）。
 * - 開け閉めは 鍵 `catwars`（lib/useCatwars.ts）。**閉じているときも入口は見せる**：🔒 と わけ。押せない形ではなく、押すと わけが出る（SANMON のメニューと同じ考え方）。
 * - 開いているとき：SANMON の入口と同じく、名乗り（#c=&n=）を付けて CAT-WARS を開く。
 * - 名乗っていない子：CAT-WARS は「おためし」（スタミナを使わない・記録は送らない）で遊べるので、そのまま開く（SANMON の入口と同じ）。
 * 見た目は SANMON タブの緑と金の中で、CAT-WARS の文字・ネコ・一言（絵は作らない。文字と絵文字・CSS）。
 */
import { useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { CATWARS_URL, catwarsLock, useCatwarsModes } from '../lib/useCatwars';

export function CatwarsCard({ student }: { student: StudentIdentity | null }) {
  const modes = useCatwarsModes(student?.studentId ?? null);
  const [why, setWhy] = useState(false);
  const loading = !!student && modes === 'loading';
  // 読めなかったとき（offline）は CAT-WARS の関門に まかせて 開く
  const lock = student && modes !== 'loading' && modes !== 'offline' ? catwarsLock(modes) : null;
  const href = student ? buildHandoffUrl(CATWARS_URL, student.joinCode, student.number) : CATWARS_URL;

  const body = (
    <>
      <div className="absolute -left-10 -bottom-12 w-44 h-44 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="catwars-cat shrink-0" aria-hidden>🐱</span>
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-[0.3em] text-emerald-300/80">GAME</p>
            <p className="catwars-word text-xl sm:text-2xl font-black italic leading-tight whitespace-nowrap">CAT-WARS</p>
            <p className="text-[11px] text-emerald-100/80 mt-0.5">問題を といて ネコ軍団を 出そう</p>
          </div>
        </div>
        {loading ? (
          <span className="shrink-0 rounded-2xl px-4 py-2.5 font-black text-xs bg-white/10 text-emerald-100/70">…</span>
        ) : lock ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-2xl px-3 py-2.5 font-black text-xs sm:text-sm bg-white/10 text-emerald-100/80 ring-1 ring-white/20 whitespace-nowrap">
            <Lock size={14} /> とじている
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 font-black text-sm whitespace-nowrap bg-gradient-to-r from-sky-400 to-amber-400 text-black shadow-[0_0_18px_rgba(56,189,248,0.45)]">
            いく <ChevronRight size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 text-[11px] text-emerald-100/70 leading-relaxed">
        {student
          ? '出撃 1回で スタミナを つかうよ（SANMON の ぼうけんの バトル1回と おなじ。町 → 共通 の じゅん）'
          : 'がっきゅうコードを 入れていないと「おためし」。スタミナは つかわないし、きろくも のこらないよ'}
      </p>
    </>
  );

  if (lock || loading) {
    return (
      <div>
        <button type="button" data-testid="catwars-entry" data-locked={lock ? 'true' : 'loading'}
          aria-label={lock ? 'CAT-WARS（いまは とじている。おすと わけが でるよ）' : 'CAT-WARS（よみこみちゅう）'}
          onClick={() => { if (lock) setWhy(true); }}
          className={`tap w-full text-left block hud rounded-3xl p-4 relative overflow-hidden ${lock ? 'opacity-80 grayscale-[35%]' : ''}`}>
          {body}
        </button>
        {lock && why && (
          <div role="status" className="mt-2 rounded-2xl px-4 py-3 bg-black/50 ring-1 ring-amber-400/40 flex items-start gap-2">
            <Lock size={15} className="text-amber-300 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-black text-amber-100 leading-relaxed" data-testid="catwars-why">{lock}</p>
            <button type="button" onClick={() => setWhy(false)} className="tap text-[11px] text-emerald-100/60 underline shrink-0">とじる</button>
          </div>
        )}
      </div>
    );
  }
  return (
    <a href={href} data-testid="catwars-entry" data-locked="false"
      className="tap block hud rounded-3xl p-4 relative overflow-hidden" aria-label="CAT-WARS を ひらく">
      {body}
    </a>
  );
}
