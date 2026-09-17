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
 */
import { ClipboardCheck } from 'lucide-react';
import { Card, CardTitle, SubjectTag, md } from './kidsUi';
import type { TestSeries } from '../lib/useMine';

export function TestTrend({ series }: { series: TestSeries[] }) {
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
          </div>
        ))}
      </div>

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
