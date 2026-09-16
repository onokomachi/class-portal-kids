/**
 * のびの推移と、項目ごとのできぐあい。
 *
 * グラフは自前のSVGで描く。ライブラリを足すと、この1画面のために
 * バンドルが数十KB増える（子どもの端末は学校のWi-Fiで一斉に開く）。
 *
 * 縦軸は0〜100%で固定する。データの範囲に合わせて自動で伸縮させると、
 * 75%→78%のわずかな変化が画面いっぱいの急上昇に見えてしまう。
 *
 * 点を打たない週がある。記録が少ない週は正答率を出さない決まりで、
 * 1問だけやってまちがえた週を0%として描くと大暴落に見えるため。
 */
import { LineChart, Target } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity, type WeekPoint } from 'learning-app-kit/sync';
import type { UnitAbility, SkillAbility } from '../lib/useMine';

const SUBJECT_STYLE: Record<string, string> = {
  算数: 'bg-sky-100 text-sky-700 border-sky-200',
  国語: 'bg-rose-100 text-rose-700 border-rose-200',
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

interface Props {
  student: StudentIdentity | null;
  trend: WeekPoint[];
  units: UnitAbility[];
  hard: SkillAbility[];
}

export function Trend({ student, trend, units, hard }: Props) {
  const points = trend.filter((w) => w.rate !== null);
  return (
    <div className="space-y-5">
      <TrendChart trend={trend} hasData={points.length > 0} />
      <UnitBars units={units} />
      <HardSkills hard={hard} student={student} />
    </div>
  );
}

function TrendChart({ trend, hasData }: { trend: WeekPoint[]; hasData: boolean }) {
  // 描画領域。左に目盛りのぶんだけ余白を取る
  const W = 320, H = 120, L = 26, R = 6, T = 8, B = 18;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, trend.length - 1);
  const y = (rate: number) => T + (1 - rate) * (H - T - B);

  // 点が飛んでいる（記録の無い週がある）ので、続いている区間ごとに線を引く
  const segments: string[] = [];
  let cur: string[] = [];
  trend.forEach((w, i) => {
    if (w.rate === null) { if (cur.length > 1) segments.push(cur.join(' ')); cur = []; return; }
    cur.push(`${x(i)},${y(w.rate)}`);
  });
  if (cur.length > 1) segments.push(cur.join(' '));

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="flex items-center gap-1.5 font-black text-slate-800 mb-1">
        <LineChart size={18} className="text-sky-500" /> のびの グラフ
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        1しゅうかんごとの できぐあい（8しゅうかんぶん）
      </p>

      {!hasData ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          もう すこし やると、グラフが 出てくるよ
        </p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="週ごとのできぐあいのグラフ">
          {/* 目盛り。0〜100%で固定する（自動で伸縮させると小さな変化が急上昇に見える） */}
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={2} y={y(g) + 3} fontSize="8" fill="#94a3b8">{pct(g)}</text>
            </g>
          ))}

          {segments.map((pts, i) => (
            <polyline key={i} points={pts} fill="none" stroke="#0284c7" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {trend.map((w, i) => w.rate === null ? null : (
            <circle key={w.start} cx={x(i)} cy={y(w.rate)} r="3.5" fill="#0284c7">
              <title>{`${md(w.start)}の週　${pct(w.rate)}（${w.answers}もん）`}</title>
            </circle>
          ))}

          {/* 週のはじまりの日付。1つおきに出す（全部出すと重なる） */}
          {trend.map((w, i) => i % 2 === 0 ? (
            <text key={w.start} x={x(i)} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">
              {md(w.start)}
            </text>
          ) : null)}
        </svg>
      )}

      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
        といた もんだいが すくない しゅうは、点を つけていないよ。
      </p>
    </section>
  );
}

function UnitBars({ units }: { units: UnitAbility[] }) {
  const shown = units.filter((u) => u.answers > 0);
  if (shown.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="font-black text-slate-800 mb-1">たんげんごとの できぐあい</h2>
      <p className="text-xs text-slate-500 mb-3">やった たんげんだけ ならんでいるよ</p>
      <div className="space-y-2.5">
        {shown.map((u) => (
          <div key={u.app.app_id}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border
                                ${SUBJECT_STYLE[u.app.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {u.app.subject}
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-700 truncate">{u.app.title}</span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-700">
                {u.rate === null ? '—' : pct(u.rate)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              {u.rate !== null && (
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${u.rate * 100}%` }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400 leading-relaxed">
        「—」は、といた もんだいが まだ すくない たんげんだよ。
      </p>
    </section>
  );
}

/**
 * 手ごわい項目。
 *
 * 「にがて」とは書かない。書いたとたん、この一覧は苦手の証明書になる。
 * 「ねらって やると 力がつく ところ」として、行き先リンクつきで出す。
 */
function HardSkills({ hard, student }: { hard: SkillAbility[]; student: StudentIdentity | null }) {
  if (hard.length === 0) return null;
  const link = (url?: string) =>
    url && student ? buildHandoffUrl(url, student.joinCode, student.number) : url;

  return (
    <section>
      <h2 className="flex items-center gap-1.5 font-black text-slate-800 mb-1">
        <Target size={18} className="text-amber-500" /> ねらって やると 力がつく ところ
      </h2>
      <p className="text-xs text-slate-500 mb-3">なんども やっているのに、まだ てごわい ところ</p>
      <div className="space-y-2">
        {hard.map((s) => (
          <a key={`${s.appId}/${s.label}`} href={link(s.appUrl)}
            className="flex items-center gap-3 rounded-2xl bg-white border border-amber-200 p-4
                       hover:border-amber-400 transition">
            <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border
                              ${SUBJECT_STYLE[s.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {s.subject}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-slate-800 text-sm truncate">{s.appTitle}</span>
              <span className="block text-xs text-slate-500 truncate">{s.moduleTitle}　{s.label}</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-amber-600">{pct(s.rate)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
