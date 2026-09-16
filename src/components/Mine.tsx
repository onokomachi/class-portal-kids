/**
 * 「じぶんの きろく」の画面。
 *
 * 出さないもの: 正答率、順位、他の子との比較、できていない数。
 * 出すもの: やった日、続いた日数、できるようになったこと、つぎに やるといいところ。
 *
 * 「％」を出すと、子どもの注意が課題から「自分の出来不出来」に移る
 * （Kluger & DeNisi 1996 / master-DB: decisions/kids-no-individual-ranking）。
 * だから同じデータでも、数えるのは「やったこと」と「できるようになったこと」にする。
 */
import { Flame, CalendarDays, Sparkles, ChevronRight } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import type { Effort, StrongUnit, NextStep } from '../lib/useMine';

const SUBJECT_STYLE: Record<string, string> = {
  算数: 'bg-sky-100 text-sky-700 border-sky-200',
  国語: 'bg-rose-100 text-rose-700 border-rose-200',
};

function linkTo(url: string | undefined, student: StudentIdentity | null): string | undefined {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

interface Props {
  student: StudentIdentity | null;
  effort: Effort;
  strengths: StrongUnit[];
  next: NextStep[];
}

export function Mine({ student, effort, strengths, next }: Props) {
  const totalMastered = strengths.reduce((s, u) => s + u.mastered, 0);
  const nothingYet = effort.totalDays === 0 && totalMastered === 0;

  if (!student) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
        <p className="font-bold text-amber-900 text-sm">がっきゅうコードを入れると、</p>
        <p className="text-sm text-amber-800 mt-1">じぶんの きろくが 見られるよ</p>
      </div>
    );
  }

  if (nothingYet) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center">
        <p className="font-bold text-slate-700">まだ きろくが ないよ</p>
        <p className="text-sm text-slate-500 mt-1.5">たんげんを ひとつ やってみよう</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* がんばった記録。比べる相手は「昨日までの自分」だけ */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="flex items-center gap-1.5 font-black text-slate-800 mb-3">
          <Flame size={18} className="text-orange-500" /> がんばった きろく
        </h2>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat value={effort.streak} unit="日" label="つづいて いるよ" tone="text-orange-600" />
          <Stat value={effort.totalDays} unit="日" label="やった日" tone="text-sky-600" />
          <Stat value={effort.thisWeek} unit="もん" label="この7日で" tone="text-emerald-600" />
        </div>

        {/* 直近4週間。色の濃さ＝その日にやった量。数字は出さない */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <CalendarDays size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">この4しゅうかん</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {effort.recent.map((d) => (
            <div key={d.date}
              title={`${d.date.slice(5).replace('-', '/')}　${d.count}もん`}
              className={`aspect-square rounded-md border ${
                d.count === 0 ? 'bg-slate-100 border-slate-200'
                : d.count < 10 ? 'bg-emerald-200 border-emerald-300'
                : d.count < 30 ? 'bg-emerald-400 border-emerald-500'
                : 'bg-emerald-600 border-emerald-700'}`} />
          ))}
        </div>
      </section>

      {/* できるようになったこと。「できていない数」は出さない */}
      {totalMastered > 0 && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="flex items-center gap-1.5 font-black text-slate-800 mb-1">
            <Sparkles size={18} className="text-amber-500" /> できるように なったこと
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            5かい れんぞく ノーミスに なったのが <strong className="text-lg text-amber-600">{totalMastered}</strong> こ
          </p>
          <div className="space-y-1.5">
            {strengths.map((u) => (
              <div key={u.app.app_id} className="flex items-center gap-2.5">
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border
                                  ${SUBJECT_STYLE[u.app.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {u.app.subject}
                </span>
                <span className="min-w-0 flex-1 text-sm text-slate-700 truncate">{u.app.title}</span>
                <span className="shrink-0 text-sm font-bold text-amber-600 tabular-nums">⭐{u.mastered}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* つぎに やるといいところ。苦手リストにしない——行き先として出す */}
      {next.length > 0 && (
        <section>
          <h2 className="font-black text-slate-800 mb-1">つぎに やると いいところ</h2>
          <p className="text-xs text-slate-500 mb-3">あと すこしで できるように なりそうな ところ</p>
          <div className="space-y-2">
            {next.map((n) => (
              <a key={`${n.appId}/${n.label}`} href={linkTo(n.appUrl, student)}
                className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-4
                           hover:border-sky-400 transition">
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border
                                  ${SUBJECT_STYLE[n.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {n.subject}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-800 text-sm truncate">{n.appTitle}</span>
                  <span className="block text-xs text-slate-500 truncate">{n.moduleTitle}　{n.label}</span>
                </span>
                <ChevronRight size={20} className="shrink-0 text-sky-500" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ value, unit, label, tone }: { value: number; unit: string; label: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
      <p className={`font-black text-2xl tabular-nums ${tone}`}>
        {value}<span className="text-sm font-bold ml-0.5">{unit}</span>
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
