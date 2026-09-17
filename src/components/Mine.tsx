/**
 * 「じぶんの きろく」の画面。
 *
 * 出すもの: やった日、つづいた日数、先週の自分とくらべた正答率、その推移、
 *           たんげんごとの できぐあい、ねらうと効くところ、
 *           できるようになったこと、つぎに やるといいところ。
 * 出さないもの: 順位、学級の平均、他の子との比較、できていない数。
 *
 * 数字を出すかどうかではなく、**誰とくらべる数字か**で分ける。
 * Kluger & DeNisi (1996) が負の効果として挙げたのは、注意が課題から
 * 「自分の出来不出来」に移るフィードバックだった。他人と並べた数字はそこへ向かう。
 * 過去の自分と並べた数字なら「先週より伸びた／落ちた、では次どうするか」
 * という課題の話になり、自己調整学習でいう「自己観察」として働く。
 *
 * まだ問題数が少ないうちは正答率を出さない。3問やって1問できた「33%」は
 * 実力ではなく偶然で、数字だけが独り歩きするため。
 */
import {
  Flame, CalendarDays, Sparkles, ChevronRight, TrendingUp, TrendingDown, Minus, Star,
} from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { Trend } from './Trend';
import { Card, CardTitle, BigStat, DayGrid, LinkRow, SubjectTag, pct, placeLabel } from './kidsUi';
import type { Effort, StrongUnit, NextStep, SelfCompare, UnitAbility, SkillAbility } from '../lib/useMine';
import type { WeekPoint } from 'learning-app-kit/sync';

function linkTo(url: string | undefined, student: StudentIdentity | null): string | undefined {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

interface Props {
  student: StudentIdentity | null;
  effort: Effort;
  strengths: StrongUnit[];
  next: NextStep[];
  compare: SelfCompare;
  trend: WeekPoint[];
  units: UnitAbility[];
  hard: SkillAbility[];
}

export function Mine({ student, effort, strengths, next, compare, trend, units, hard }: Props) {
  const totalMastered = strengths.reduce((s, u) => s + u.mastered, 0);
  const nothingYet = effort.totalDays === 0 && totalMastered === 0;

  if (!student) {
    return (
      <Card tone="sun" className="p-6 text-center bg-amber-50">
        <p className="font-black text-amber-900">がっきゅうコードを 入れると、</p>
        <p className="text-sm text-amber-800 mt-1">じぶんの きろくが 見られるよ</p>
      </Card>
    );
  }

  if (nothingYet) {
    return (
      <Card className="p-8 text-center">
        <p className="font-black text-ink">まだ きろくが ないよ</p>
        <p className="text-sm text-mute mt-1.5">たんげんを ひとつ やってみよう</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* がんばった記録。くらべる相手は「昨日までの自分」だけ */}
      <Card tone="grass" className="p-5">
        <CardTitle icon={<Flame size={18} className="text-rose-500" />}>がんばった きろく</CardTitle>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <BigStat value={effort.streak} unit="日" label="つづいて いるよ" tone="flame" />
          <BigStat value={effort.totalDays} unit="日" label="やった日" tone="sky" />
          <BigStat value={effort.thisWeek} unit="もん" label="この7日で" tone="grass" />
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-mute font-bold mb-1.5">
          <CalendarDays size={13} /> この4しゅうかん
        </p>
        <DayGrid days={effort.recent} columns={7} />
        <p className="mt-2.5 text-[11px] text-mute/80 leading-relaxed">
          色が こいほど、その日に たくさん やったということだよ。
        </p>
      </Card>

      {/* 先週の自分とくらべる。比べる相手は他人ではなく、過去の自分だけ */}
      <SelfCompareCard compare={compare} />

      {/* その推移と、項目ごとのできぐあい */}
      <Trend student={student} trend={trend} units={units} hard={hard} />

      {/* できるようになったこと。「できていない数」は出さない */}
      {totalMastered > 0 && (
        <Card tone="sun" className="p-5">
          <CardTitle icon={<Sparkles size={18} className="text-amber-500" />}>
            できるように なったこと
          </CardTitle>
          <p className="text-sm text-mute -mt-2 mb-3">
            5かい れんぞく ノーミスに なったのが{' '}
            <strong className="num text-2xl text-amber-600 align-middle">{totalMastered}</strong> こ
          </p>
          <div className="space-y-2">
            {strengths.map((u) => (
              <div key={u.app.app_id}
                className="flex items-center gap-2.5 rounded-2xl bg-amber-50/70 px-3 py-2.5">
                <SubjectTag subject={u.app.subject} />
                <span className="min-w-0 flex-1 text-sm font-bold text-ink truncate">{u.app.title}</span>
                <span className="num shrink-0 text-sm font-black text-amber-600 inline-flex items-center gap-0.5">
                  <Star size={13} className="fill-amber-400 stroke-amber-500" />{u.mastered}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* つぎに やるといいところ。苦手リストにしない——行き先として出す */}
      {next.length > 0 && (
        <section>
          <CardTitle note="あと すこしで できるように なりそうな ところ">
            つぎに やると いいところ
          </CardTitle>
          <div className="space-y-2">
            {next.map((n) => (
              <LinkRow key={`${n.appId}/${n.label}`} href={linkTo(n.appUrl, student)}
                subject={n.subject} title={n.appTitle} sub={placeLabel(n.moduleTitle, n.label)}
                right={<ChevronRight size={20} className="shrink-0 text-sky-500" />} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * 先週とくらべて。
 *
 * 数字を出すのは「過去の自分」との比較だけにする。学級の平均も順位も出さない。
 * まだ問題数が少ないうちは正答率を出さない——3問やって1問できた「33%」は
 * 実力ではなく偶然で、数字だけが独り歩きするため。
 */
function SelfCompareCard({ compare }: { compare: SelfCompare }) {
  if (compare.thisWeek === null) {
    return (
      <Card className="p-5">
        <CardTitle icon={<TrendingUp size={18} className="text-sky-500" />}>先週と くらべて</CardTitle>
        <p className="text-sm text-mute -mt-2">もう すこし やると、じぶんの のびが 出せるよ</p>
      </Card>
    );
  }

  const d = compare.diff;
  const up = d !== null && d > 0.02;
  const down = d !== null && d < -0.02;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const tone = up ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50';

  return (
    <Card tone="sky" className="p-5">
      <CardTitle icon={<TrendingUp size={18} className="text-sky-500" />}>先週と くらべて</CardTitle>

      <div className="flex items-end justify-center gap-6 py-1">
        <div className="text-center">
          <p className="text-[11px] text-mute font-bold mb-1">先週</p>
          <p className="num font-black text-2xl text-slate-400">
            {compare.lastWeek === null ? '—' : pct(compare.lastWeek)}
          </p>
        </div>
        <ChevronRight size={22} className="text-slate-300 mb-2.5" />
        <div className="text-center">
          <p className="text-[11px] text-mute font-bold mb-1">この7日</p>
          <p className="num font-black text-5xl text-sky-600 leading-none">{pct(compare.thisWeek)}</p>
        </div>
      </div>

      <p className={`mt-4 rounded-2xl py-2.5 text-center text-sm font-black
                     flex items-center justify-center gap-1.5 ${tone}`}>
        <Icon size={16} />
        {d === null ? 'はじめての きろくだよ'
          : up ? `${Math.round(d * 100)}ポイント のびたよ！`
          : down ? 'こんかいは すこし さがったよ。つぎに いこう'
          : 'おなじくらいを たもてているよ'}
      </p>

      <p className="mt-3 text-[11px] text-mute/80 leading-relaxed">
        くらべているのは 先週の じぶん だけだよ。ほかの人とは くらべないよ。
      </p>
    </Card>
  );
}
