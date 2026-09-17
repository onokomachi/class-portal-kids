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
import { LineChart, Target, ChevronRight } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity, type WeekPoint } from 'learning-app-kit/sync';
import { Card, CardTitle, LinkRow, SubjectTag, Bar, pct, md, placeLabel } from './kidsUi';
import type { UnitAbility, SkillAbility } from '../lib/useMine';

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
  const W = 320, H = 130, L = 28, R = 8, T = 10, B = 20;
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
    <Card className="p-5">
      <CardTitle icon={<LineChart size={18} className="text-sky-500" />}
        note="1しゅうかんごとの できぐあい（8しゅうかんぶん）">
        のびの グラフ
      </CardTitle>

      {!hasData ? (
        <p className="text-sm text-mute py-6 text-center">もう すこし やると、グラフが 出てくるよ</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="週ごとのできぐあいのグラフ">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 目盛り。0〜100%で固定する（自動で伸縮させると小さな変化が急上昇に見える） */}
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={2} y={y(g) + 3} fontSize="8" fill="#94a3b8">{pct(g)}</text>
            </g>
          ))}

          {segments.map((pts, i) => (
            <polygon key={`f${i}`} fill="url(#trendFill)"
              points={`${pts.split(' ')[0]!.split(',')[0]},${H - B} ${pts} ${pts.split(' ').at(-1)!.split(',')[0]},${H - B}`} />
          ))}

          {segments.map((pts, i) => (
            <polyline key={i} points={pts} fill="none" stroke="#0284c7" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {trend.map((w, i) => w.rate === null ? null : (
            <g key={w.start}>
              <circle cx={x(i)} cy={y(w.rate)} r="5" fill="#fff" />
              <circle cx={x(i)} cy={y(w.rate)} r="3.5" fill="#0284c7">
                <title>{`${md(w.start)}の週　${pct(w.rate)}（${w.answers}もん）`}</title>
              </circle>
            </g>
          ))}

          {/* 週のはじまりの日付。1つおきに出す（全部出すと重なる） */}
          {trend.map((w, i) => i % 2 === 0 ? (
            <text key={`t${w.start}`} x={x(i)} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">
              {md(w.start)}
            </text>
          ) : null)}
        </svg>
      )}

      <p className="mt-2 text-[11px] text-mute/80 leading-relaxed">
        といた もんだいが すくない しゅうは、点を つけていないよ。
      </p>
    </Card>
  );
}

function UnitBars({ units }: { units: UnitAbility[] }) {
  const shown = units.filter((u) => u.answers > 0);
  if (shown.length === 0) return null;

  return (
    <Card className="p-5">
      <CardTitle note="やった たんげんだけ ならんでいるよ">たんげんごとの できぐあい</CardTitle>
      <div className="space-y-3">
        {shown.map((u) => (
          <div key={u.app.app_id}>
            <div className="flex items-center gap-2 mb-1.5">
              <SubjectTag subject={u.app.subject} />
              <span className="min-w-0 flex-1 text-sm font-bold text-ink truncate">{u.app.title}</span>
              <span className="num shrink-0 text-sm font-black text-ink">
                {u.rate === null ? <span className="text-slate-300">—</span> : pct(u.rate)}
              </span>
            </div>
            <Bar value={u.rate ?? 0} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-mute/80 leading-relaxed">
        「—」は、といた もんだいが まだ すくない たんげんだよ。
      </p>
    </Card>
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
      <CardTitle icon={<Target size={18} className="text-amber-500" />}
        note="なんども やっているのに、まだ てごわい ところ">
        ねらって やると 力がつく ところ
      </CardTitle>
      <div className="space-y-2">
        {hard.map((s) => (
          <LinkRow key={`${s.appId}/${s.label}`} href={link(s.appUrl)} tone="sun"
            subject={s.subject} title={s.appTitle} sub={placeLabel(s.moduleTitle, s.label)}
            right={
              <span className="shrink-0 flex items-center gap-1">
                <span className="num text-sm font-black text-amber-600">{pct(s.rate)}</span>
                <ChevronRight size={18} className="text-amber-500" />
              </span>
            } />
        ))}
      </div>
    </section>
  );
}
