/**
 * 体験の入口（https://class-portal-kids.vercel.app/#trial。2026-11-07 先生と決めた）。
 *
 * 学級コードを持っていない人（紹介したい先生・保護者・ほかの学級）に配るリンク。
 * 名乗りは聞かない。PRISM の管理タブで「体験に出す」にしたアプリだけを学年ごとに並べ、
 * 押すとそのアプリを #trial 付きで開く（アプリの中は体験版：答えは送らない・使える画面は PRISM の設定）。
 * 並びはサーバの trial_apps（SANMON → 学年 → 算数・国語・外国語活動 → 年間の順。apps.year_order）。
 * SANMON だけは いちばん上に、SANMON タブと同じ 緑と金の大きなカードで出す（2026-11-08 先生と決めた）。
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, Loader2, Sparkles, Swords } from 'lucide-react';
import { fetchTrialApps, buildTrialUrl, endTrial, type TrialAppEntry } from 'learning-app-kit/sync';
import { portalConfig } from '../lib/portal';
import { CardTitle, SubjectTag } from './kidsUi';

export function TrialHub() {
  const [apps, setApps] = useState<TrialAppEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchTrialApps(portalConfig).then((r) => {
      if (!alive) return;
      if (r) setApps(r); else setFailed(true);
    });
    return () => { alive = false; };
  }, []);

  const sanmon = apps?.find((a) => a.appId === 'sanmon') ?? null;
  const byGrade = useMemo(() => {
    const m = new Map<number, TrialAppEntry[]>();
    for (const a of apps ?? []) {
      if (a.appId === 'sanmon') continue;
      const g = a.grade ?? 0;
      m.set(g, [...(m.get(g) ?? []), a]);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [apps]);

  return (
    <div className="min-h-screen">
      <header className="sol-header">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/sol-mark.jpg" alt="SOL" width={36} height={36} className="w-9 h-9 object-cover" />
            <div>
              <h1 className="sol-word sol-glow text-xl leading-tight">SOL</h1>
              <p className="text-[11px] text-mute">たいけんばん</p>
            </div>
          </div>
          <button onClick={endTrial}
            className="tap rounded-xl ring-1 ring-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-mute hover:text-sky-600">
            たいけんを おわる
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <section className="card ring-1 ring-amber-100 p-5">
          <h2 className="flex items-center gap-1.5 font-black hologram text-lg"><Sparkles size={18} className="text-amber-400" />たいけんしてみよう</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            がっきゅうコードが なくても ためせるよ。たいけんでは きろくは のこらないし、つかえない ところも あるよ。
          </p>
        </section>

        {!apps && !failed && <div className="py-10 grid place-items-center"><Loader2 className="animate-spin text-mute" /></div>}
        {failed && <p className="text-sm text-rose-600 text-center">よみこめませんでした。すこし たってから もういちど ひらいてね。</p>}
        {apps && apps.length === 0 && <p className="text-sm text-mute text-center">いまは たいけんできる アプリが ないよ。</p>}

        {sanmon && (
          <div className="theme-sanmon">
            <a href={buildTrialUrl(sanmon.url)}
              className="tap block hud rounded-3xl p-6 relative overflow-hidden" aria-label="SANMON:04 を たいけんする">
              <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-14 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
              <p className="text-[11px] font-black tracking-[0.3em] text-emerald-300/80">GAME ・ 4ねん さんすう</p>
              <p className="hologram text-4xl sm:text-5xl font-black italic leading-tight mt-1">SANMON:04</p>
              <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
                モンスターと いっしょに 4ねんの さんすうを ぼうけんしよう。もんだいに せいかいすると たたかえるよ。
              </p>
              <span className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-lg bg-gradient-to-r from-emerald-500 to-amber-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.55)]">
                <Swords size={22} /> <span className="whitespace-nowrap">たいけんする</span> <ChevronRight size={22} />
              </span>
            </a>
          </div>
        )}

        {byGrade.map(([g, list]) => (
          <section key={g}>
            <CardTitle>{g ? `${g}ねん` : 'そのほか'}</CardTitle>
            <div className="grid gap-2">
              {list.map((a) => (
                <a key={a.appId} href={buildTrialUrl(a.url)}
                  className="tap card flex items-center gap-3 p-4 ring-1 ring-slate-100 hover:ring-sky-300">
                  {a.subject && <SubjectTag subject={a.subject} />}
                  <span className="min-w-0 flex-1 font-black text-ink text-sm truncate">{a.title}</span>
                  <ExternalLink size={16} className="shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
