/**
 * テストの点数の推移。
 *
 * 出すのは**自分の点数だけ**。学級の平均も順位も出さない
 * ——サーバがそもそも他人の点数を返さない（`my_test_results`）ので、
 * この画面が約束を破ろうとしても破れないようにしてある。
 *
 * 満点のちがう回を同じ線に混ぜない。表100点の82点と裏50点の45点を
 * 1本の線にすると、下がったように見える。単元と面ごとに1本ずつ描く。
 *
 * 1回しか受けていないものも出す。「前より伸びた」はまだ言えないが、
 * 「何点取れたか」は本人にとって意味のある事実だから。
 *
 * 下の日付のボタンを押すと、その回の問題ごとの ○× が出る（TestDetail）。
 * 答案はハブを開いたときには読まず、押した1回ぶんだけ読む（通信量を小さくする）。
 */
import { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, Loader2 } from 'lucide-react';
import { fetchMyTestDetail, type MyTestRow, type MyTestStep } from 'learning-app-kit/sync';
import { Card, CardTitle, SubjectTag, md } from './kidsUi';
import type { TestSeries } from '../lib/useMine';
import { portalConfig } from '../lib/portal';

export function TestTrend({ series, studentId }: { series: TestSeries[]; studentId: string | null }) {
  const [open, setOpen] = useState<{ s: TestSeries; t: MyTestRow } | null>(null);
  if (series.length === 0) return null;

  return (
    <Card tone="sun" className="p-5">
      <CardTitle icon={<ClipboardCheck size={18} className="text-amber-500" />}
        note="本番テストモードで とった点だよ">
        テストの てんすう
      </CardTitle>

      <div className="space-y-5">
        {series.map((s) => (
          <div key={`${s.appId}|${s.mode}`}>
            <div className="flex items-center gap-2 mb-2">
              <SubjectTag subject={s.subject} />
              <span className="min-w-0 flex-1 text-sm font-bold text-ink truncate">
                {s.appTitle}{s.mode && <span className="text-mute">（{s.mode}）</span>}
              </span>
              <span className="num shrink-0 text-lg font-black text-amber-600">
                {s.points.at(-1)!.score}
                <span className="text-xs text-mute font-black">/{s.max}</span>
              </span>
            </div>
            <Chart series={s} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {s.tests.slice(-6).map((t) => (
                <button key={t.event_id} onClick={() => setOpen({ s, t })}
                  className="tap rounded-xl ring-1 ring-amber-200 bg-white px-2.5 py-1 text-[11px] font-black text-amber-700 hover:bg-amber-50">
                  {md(t.taken_date)} <span className="num">{t.total}</span>てん ▸
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-mute">日づけを おすと、その回の ○× が 見られるよ</p>
      {open && <TestDetail series={open.s} test={open.t} studentId={studentId} onClose={() => setOpen(null)} />}

      <p className="mt-3 text-[11px] text-mute/80 leading-relaxed">
        くらべているのは 前の じぶん だけだよ。ほかの人の点は 出ないよ。
      </p>
    </Card>
  );
}

function Chart({ series }: { series: TestSeries }) {
  const pts = series.points;

  // 1回だけのときは線が引けないので、点1つと日付を出す
  if (pts.length === 1) {
    const p = pts[0]!;
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50/70 px-3.5 py-2.5">
        <span className="num text-xs text-mute font-bold">{md(p.date)}</span>
        <div className="flex-1 h-2.5 rounded-full bg-white overflow-hidden">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${p.ratio * 100}%` }} />
        </div>
        <span className="text-[11px] text-mute font-bold">はじめての きろく</span>
      </div>
    );
  }

  // 縦軸は0〜満点で固定する。データの幅に合わせて伸縮させると、
  // 82点→85点の わずかな変化が 画面いっぱいの急上昇に見える
  const W = 320, H = 110, L = 30, R = 10, T = 10, B = 20;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, pts.length - 1);
  const y = (ratio: number) => T + (1 - ratio) * (H - T - B);
  const line = pts.map((p, i) => `${x(i)},${y(p.ratio)}`).join(' ');
  const last = pts.at(-1)!, prev = pts.at(-2)!;
  const diff = last.score - prev.score;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={`${series.appTitle}のテストの点の グラフ`}>
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#f1e2c8" strokeWidth="1" />
            <text x={2} y={y(g) + 3} fontSize="8" fill="#a8a29e">
              {Math.round(series.max * g)}
            </text>
          </g>
        ))}

        <polyline points={line} fill="none" stroke="#f59e0b" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {pts.map((p, i) => (
          <g key={p.date + i}>
            <circle cx={x(i)} cy={y(p.ratio)} r="5" fill="#fff" />
            <circle cx={x(i)} cy={y(p.ratio)} r="3.5" fill="#f59e0b">
              <title>{`${md(p.date)}　${p.score}/${p.max}点`}</title>
            </circle>
          </g>
        ))}

        {pts.map((p, i) => (
          <text key={`t${p.date}${i}`} x={x(i)} y={H - 4} fontSize="8"
            fill="#a8a29e" textAnchor="middle">{md(p.date)}</text>
        ))}
      </svg>

      <p className={`mt-1.5 rounded-xl py-2 text-center text-sm font-black
                     ${diff > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
        {diff > 0 ? `前より ${diff}点 のびたよ！`
          : diff < 0 ? 'こんかいは すこし さがったよ。つぎに いこう'
          : '前と 同じ点だったよ'}
      </p>
    </>
  );
}

/** 1回ぶんのテストの、問題ごとの ○×（押したときだけ読む） */
function TestDetail({ series, test, studentId, onClose }: {
  series: TestSeries; test: MyTestRow; studentId: string | null; onClose: () => void;
}) {
  const [steps, setSteps] = useState<MyTestStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchMyTestDetail(portalConfig, studentId, test.event_id).then((r) => {
      if (!alive) return;
      if (r.ok) setSteps(r.steps); else setError(r.message);
    });
    return () => { alive = false; };
  }, [studentId, test.event_id]);

  const wrong = steps?.filter((x) => !x.correct).length ?? 0;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 grid place-items-center p-4" onClick={onClose} role="dialog" aria-label="テストの ○×">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-ink truncate">{series.appTitle}{series.mode && `（${series.mode}）`}</p>
            <p className="text-xs text-mute">{md(test.taken_date)} の テスト ・ <b className="num text-amber-600">{test.total}</b>/{test.total_max}てん</p>
          </div>
          <button onClick={onClose} className="tap rounded-xl ring-1 ring-slate-200 p-1.5 text-mute" aria-label="とじる"><X size={16} /></button>
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}
        {!steps && !error && <p className="text-sm text-mute inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" />よみこみ中…</p>}
        {steps && steps.length === 0 && <p className="text-sm text-mute">この回は、問題ごとの きろくが ないよ。</p>}
        {steps && steps.length > 0 && (
          <>
            <p className="text-xs text-mute mb-2">
              {wrong === 0 ? 'ぜんぶ ○ だよ！' : <>× の 問題は <b className="text-rose-600">{wrong}</b>こ。こたえを 見て、アプリで もういちど やってみよう</>}
            </p>
            <ol className="space-y-1.5">
              {steps.map((x, i) => (
                <li key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 ${x.correct ? 'bg-emerald-50/60' : 'bg-rose-50'}`}>
                  <span className={`shrink-0 mt-0.5 grid place-items-center w-5 h-5 rounded-full text-white ${x.correct ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {x.correct ? <Check size={13} /> : <X size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-mute font-bold">
                      {x.section ? `${x.section} ` : ''}{x.daimon ? `大問${x.daimon}` : ''}{x.sub ?? ''} {x.title ?? ''}
                    </span>
                    {x.q && <span className="block text-sm text-ink break-words">{x.q}</span>}
                    {!x.correct && x.a && <span className="block text-xs text-rose-700 font-bold mt-0.5">こたえ：{x.a}</span>}
                  </span>
                  {x.points != null && <span className="num shrink-0 text-[11px] text-mute font-bold">{x.earned ?? 0}/{x.points}</span>}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
