/**
 * ハブの本体。
 *
 * 見せ方の方針: 順位も学級平均も出さない。数字を出すかどうかではなく、
 * **誰とくらべる数字か**で分ける。Kluger & DeNisi (1996) の607件のメタ分析で
 * 負の効果として挙がったのは、注意が課題から「自分の出来不出来」へ移る
 * フィードバックだった。他人と並べた数字はそこへ向かう。
 * 過去の自分と並べた数字なら「先週より伸びた／落ちた、では次どうするか」になる。
 *
 * ホームの先頭に「きょうまでの じぶん」を置いた。努力の記録がタブの奥にあると、
 * 見に行った子しか自分の積み上がりに気づけない。
 */
import { RotateCcw, ChevronRight, RefreshCw, Home, LineChart, Flame, Star } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { Card, CardTitle, LinkRow, DayGrid, SubjectTag, placeLabel } from './kidsUi';
import type { DueItem, UnitProgress } from '../lib/useProgress';
import type { Effort } from '../lib/useMine';

/** ハブから各アプリへのリンク。名乗っていれば学級コードと番号を引きつぐ。 */
function linkTo(url: string | undefined, student: StudentIdentity | null): string | undefined {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

interface Props {
  student: StudentIdentity | null;
  due: DueItem[];
  units: UnitProgress[];
  effort: Effort;
  loading: boolean;
  onReload: () => void;
  onJoin: () => void;
  tab: 'home' | 'mine';
  onTab: (t: 'home' | 'mine') => void;
  /** 「じぶんの きろく」タブの中身。ここでは中身を知らずに置くだけにする */
  mine: React.ReactNode;
}

export function Hub({ student, due, units, effort, loading, onReload, onJoin, tab, onTab, mine }: Props) {
  const totalMastered = units.reduce((s, u) => s + u.mastered, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div>
              <h1 className="font-black text-ink leading-tight">がくしゅうポータル</h1>
              <p className="text-[11px] text-mute">
                {student ? `${student.joinCode}　${student.number}ばん` : 'まだ とうろく していないよ'}
              </p>
            </div>
          </div>
          <button onClick={onReload} aria-label="さいしんにする"
            className="tap rounded-xl ring-1 ring-slate-200 bg-white p-2 text-mute hover:text-sky-600">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-5 flex gap-1.5 pb-2">
          <TabButton active={tab === 'home'} onClick={() => onTab('home')} icon={<Home size={15} />}>
            ホーム
          </TabButton>
          <TabButton active={tab === 'mine'} onClick={() => onTab('mine')} icon={<LineChart size={15} />}>
            じぶんの きろく
          </TabButton>
        </div>
      </header>

      {tab === 'mine' ? (
        <main className="max-w-2xl mx-auto px-5 py-6">{mine}</main>
      ) : (
        <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          {!student && (
            <button onClick={onJoin}
              className="tap w-full text-left card ring-1 ring-amber-200 bg-amber-50 p-4">
              <p className="font-black text-amber-900 text-sm">がっきゅうコードを 入れよう</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                入れると、きろくが せんせいに とどくよ。いままでの ぶんも いっしょに とどくよ。
              </p>
            </button>
          )}

          {/* きょうまでの じぶん。努力はタブの奥ではなく、いちばん先に見えるところに置く */}
          {student && <TodayStrip effort={effort} mastered={totalMastered} onMore={() => onTab('mine')} />}

          {/* きょうの ふくしゅう。単元をまたいで、いちばん わすれかけているものから */}
          {due.length > 0 && (
            <section>
              <CardTitle icon={<RotateCcw size={18} className="text-emerald-600" />}
                note="まえに できた ところを、わすれないうちに もういちど">
                <span className="text-emerald-700">きょうの ふくしゅう</span>
              </CardTitle>
              <div className="space-y-2">
                {due.map((d) => (
                  <LinkRow key={`${d.appId}/${d.skillId}`} href={linkTo(d.appUrl, student)} tone="grass"
                    subject={d.subject} title={d.appTitle} sub={placeLabel(d.moduleTitle, d.label)}
                    right={<ChevronRight size={20} className="shrink-0 text-emerald-600" />} />
                ))}
              </div>
            </section>
          )}

          {/* 単元をえらぶ */}
          <section>
            <CardTitle note="やった ぶんだけ ⭐が ふえるよ">たんげんを えらぶ</CardTitle>
            <div className="grid gap-2">
              {/* 一度でもやった単元を上に。つづきから やりたい子が、いちばん先に見つけられる */}
              {[...units].sort((a, b) => Number(b.touched > 0) - Number(a.touched > 0)).map((u) => (
                <a key={u.app.app_id} href={linkTo(u.app.url, student)}
                  className="tap card flex items-center gap-3 p-4 ring-1 ring-slate-100 hover:ring-sky-300">
                  <SubjectTag subject={u.app.subject} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-ink text-sm truncate">{u.app.title}</span>
                    <span className="flex items-center gap-2 text-xs text-mute mt-0.5 flex-wrap">
                      {u.touched === 0
                        ? <span>まだ やっていないよ</span>
                        : <span className="num">{u.touched}このレベルに ちょうせんずみ</span>}
                      {u.mastered > 0 && (
                        <span className="num inline-flex items-center gap-0.5 text-amber-600 font-black">
                          <Star size={11} className="fill-amber-400 stroke-amber-500" />{u.mastered}
                        </span>
                      )}
                      {u.due > 0 && (
                        <span className="num inline-flex items-center gap-0.5 text-emerald-600 font-black">
                          <RotateCcw size={11} />{u.due}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-slate-300" />
                </a>
              ))}
            </div>
          </section>

          <p className="text-xs text-mute/80 leading-relaxed">
            きろくは じぶんの たんまつと、せんせいの がめんに とどくよ。なまえは つかわないよ。
          </p>
        </main>
      )}
    </div>
  );
}

/**
 * ホームの先頭に出す、きょうまでの自分。
 * 出すのは「つづいた日数・この7日にやった数・できるようになった数」だけで、
 * 正答率はここに出さない——ホームを開くたびに出来不出来が目に入る場所にしない。
 */
function TodayStrip({ effort, mastered, onMore }: {
  effort: Effort; mastered: number; onMore: () => void;
}) {
  const week = effort.recent.slice(-7);
  const nothing = effort.totalDays === 0 && mastered === 0;

  return (
    <Card tone="sky" className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <h2 className="font-black text-ink">きょうまでの じぶん</h2>
        <button onClick={onMore}
          className="text-xs font-black text-sky-600 inline-flex items-center gap-0.5 shrink-0">
          もっと見る <ChevronRight size={14} />
        </button>
      </div>

      {nothing ? (
        <p className="text-sm text-mute">
          たんげんを ひとつ やってみよう。やった ぶんが ここに たまっていくよ。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <Mini icon={<Flame size={14} className="text-rose-500" />} value={effort.streak}
              unit="日" label="つづいて いるよ" tone="text-rose-500 bg-rose-50" />
            <Mini value={effort.thisWeek} unit="もん" label="この7日で"
              tone="text-emerald-600 bg-emerald-50" />
            <Mini icon={<Star size={13} className="fill-amber-400 stroke-amber-500" />} value={mastered}
              unit="こ" label="できた ところ" tone="text-amber-600 bg-amber-50" />
          </div>

          <p className="text-[11px] text-mute font-bold mb-1.5">この1しゅうかん</p>
          <DayGrid days={week} columns={7} />
        </>
      )}
    </Card>
  );
}

function Mini({ icon, value, unit, label, tone }: {
  icon?: React.ReactNode; value: number; unit: string; label: string; tone: string;
}) {
  const [text, bg] = tone.split(' ');
  return (
    <div className={`rounded-2xl px-2.5 py-2.5 text-center ${bg}`}>
      <p className={`num font-black text-2xl leading-none ${text} flex items-center justify-center gap-1`}>
        {icon}{value}<span className="text-xs font-black">{unit}</span>
      </p>
      <p className="text-[10px] text-mute mt-1 leading-tight font-bold">{label}</p>
    </div>
  );
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" role="img" aria-label="がくしゅうポータル">
      <rect x="1" y="1" width="28" height="28" rx="9" fill="#e0f2fe" />
      {/* のびていく3本の棒。右肩上がりだけを描かないよう、いちばん右を少し高くするだけにする */}
      <rect x="8" y="17" width="4" height="6" rx="2" fill="#38bdf8" />
      <rect x="13" y="13" width="4" height="10" rx="2" fill="#0ea5e9" />
      <rect x="18" y="8" width="4" height="15" rx="2" fill="#10b981" />
    </svg>
  );
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`tap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm transition
                  ${active
                    ? 'bg-sky-500 text-white font-black shadow-sm'
                    : 'text-mute hover:text-ink font-bold'}`}>
      {icon}{children}
    </button>
  );
}
