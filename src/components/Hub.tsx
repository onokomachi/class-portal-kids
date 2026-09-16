/**
 * ハブの本体。
 *
 * 見せ方の方針: 正答率も順位も出さない。
 * Kluger & DeNisi (1996) の607件のメタ分析では、フィードバックの約3分の1が
 * 負の効果で、分かれ目は注意が「課題」に向くか「自分の出来不出来」に向くかだった。
 * だから数字で優劣を示さず、「つぎに やること」を前に出す。
 * （master-DB: decisions/kids-no-individual-ranking と同じ方針）
 */
import { RotateCcw, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import type { DueItem, UnitProgress } from '../lib/useProgress';

const SUBJECT_STYLE: Record<string, string> = {
  算数: 'bg-sky-100 text-sky-700 border-sky-200',
  国語: 'bg-rose-100 text-rose-700 border-rose-200',
};

/** ハブから各アプリへのリンク。名乗っていれば学級コードと番号を引きつぐ。 */
function linkTo(url: string | undefined, student: StudentIdentity | null): string | undefined {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

interface Props {
  student: StudentIdentity | null;
  due: DueItem[];
  units: UnitProgress[];
  loading: boolean;
  onReload: () => void;
  onJoin: () => void;
}

export function Hub({ student, due, units, loading, onReload, onJoin }: Props) {
  const totalMastered = units.reduce((s, u) => s + u.mastered, 0);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-black text-slate-800">がくしゅうポータル</h1>
            <p className="text-xs text-slate-500">
              {student ? `${student.joinCode}　${student.number}ばん` : 'まだ とうろく していないよ'}
            </p>
          </div>
          <button onClick={onReload} aria-label="さいしんにする"
            className="rounded-xl border border-slate-300 p-2 text-slate-500 hover:text-slate-800">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {!student && (
          <button onClick={onJoin}
            className="w-full text-left rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <p className="font-bold text-amber-900 text-sm">がっきゅうコードを入れよう</p>
            <p className="text-xs text-amber-800 mt-1">
              入れると、きろくが せんせいに とどくよ。いままでの ぶんも いっしょに とどくよ。
            </p>
          </button>
        )}

        {/* きょうの ふくしゅう。単元をまたいで、いちばん わすれかけているものから */}
        {due.length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 font-black text-emerald-700 mb-1">
              <RotateCcw size={18} /> きょうの ふくしゅう
            </h2>
            <p className="text-xs text-emerald-700/80 mb-3">
              まえに できた ところを、わすれないうちに もういちど
            </p>
            <div className="space-y-2">
              {due.map((d) => (
                <a key={`${d.appId}/${d.skillId}`} href={linkTo(d.appUrl, student)}
                  className="flex items-center gap-3 rounded-2xl bg-white border border-emerald-200 p-4
                             hover:border-emerald-400 transition">
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border
                                    ${SUBJECT_STYLE[d.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {d.subject}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-800 text-sm truncate">{d.appTitle}</span>
                    <span className="block text-xs text-slate-500 truncate">
                      {d.moduleTitle}　{d.label}
                    </span>
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-emerald-600" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 単元をえらぶ */}
        <section>
          <h2 className="font-black text-slate-800 mb-3">たんげんを えらぶ</h2>
          <div className="grid gap-2">
            {units.map((u) => (
              <a key={u.app.app_id} href={linkTo(u.app.url, student)}
                className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-4
                           hover:border-sky-400 transition">
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border
                                  ${SUBJECT_STYLE[u.app.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {u.app.subject}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-800 text-sm truncate">{u.app.title}</span>
                  <span className="block text-xs text-slate-500">
                    {u.touched === 0
                      ? 'まだ やっていないよ'
                      : `${u.touched}このレベルに ちょうせんずみ`}
                    {u.mastered > 0 && `　⭐${u.mastered}`}
                    {u.due > 0 && `　🔁${u.due}`}
                  </span>
                </span>
                <ChevronRight size={20} className="shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        {/* じぶんの のび。他人とくらべる数字は出さない */}
        {totalMastered > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="flex items-center gap-1.5 font-black text-slate-800 mb-1">
              <Sparkles size={18} className="text-amber-500" /> じぶんの のび
            </h2>
            <p className="text-sm text-slate-600">
              いままでに <strong className="text-lg text-amber-600">{totalMastered}</strong> このレベルで
              「5かい れんぞく ノーミス」を たっせいしたよ。
            </p>
          </section>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          きろくは じぶんの たんまつと、せんせいの がめんに とどくよ。なまえは つかわないよ。
        </p>
      </main>
    </div>
  );
}
