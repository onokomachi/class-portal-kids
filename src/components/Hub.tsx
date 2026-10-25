/**
 * ハブの本体。
 *
 * 見せ方の方針: 順位も学級平均も出さない。数字を出すかどうかではなく、
 * **誰とくらべる数字か**で分ける。Kluger & DeNisi (1996) の607件のメタ分析で
 * 負の効果として挙がったのは、注意が課題から「自分の出来不出来」へ移る
 * フィードバックだった。他人と並べた数字はそこへ向かう。
 * 過去の自分と並べた数字なら「先週より伸びた／落ちた、では次どうするか」になる。
 *
 * タブは3つ（2026-10 先生と決めた）。ホームは「各アプリへ飛ぶ」と「きょうの ふくしゅう」だけの かんたんな形。
 * SANMON（4年のゲーム）は 専用のタブにまとめる。努力・テスト・階段は「じぶんの きろく」。
 */
import { RotateCcw, ChevronRight, RefreshCw, Home, LineChart, Star, Swords, UserCog } from 'lucide-react';
import { useState } from 'react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { CardTitle, LinkRow, SubjectTag, placeLabel } from './kidsUi';
import type { DueItem, UnitProgress } from '../lib/useProgress';

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
  /** 名乗った子が番号を変える（先生のパスワードを聞いてから） */
  onChangeStudent: () => void;
  tab: HubTab;
  onTab: (t: HubTab) => void;
  /** 「じぶんの きろく」タブの中身。ここでは中身を知らずに置くだけにする */
  mine: React.ReactNode;
  /** SANMON タブの中身（4年を見ているときだけ。ほかの学年は null でタブを出さない） */
  sanmon: React.ReactNode | null;
}

export type HubTab = 'home' | 'sanmon' | 'mine';

export function Hub({ student, due, units, loading, onReload, onJoin, onChangeStudent, tab, onTab, mine, sanmon }: Props) {
  const [moreDue, setMoreDue] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100 shadow-[0_8px_24px_-16px_rgba(16,185,129,0.6)]">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div>
              <h1 className="hologram font-black text-xl leading-tight tracking-[0.2em]">SOL</h1>
              <p className="text-[11px] text-mute">
                {student ? `${student.joinCode}　${student.number}ばん` : 'まだ とうろく していないよ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {student && (
              <button onClick={onChangeStudent} aria-label="ばんごうを かえる（せんせいの パスワード）"
                className="tap rounded-xl ring-1 ring-slate-200 bg-white px-2 py-1.5 text-[10px] font-black text-mute hover:text-sky-600 inline-flex items-center gap-1 whitespace-nowrap">
                <UserCog size={14} />ばんごうを かえる
              </button>
            )}
            <button onClick={onReload} aria-label="さいしんにする"
              className="tap rounded-xl ring-1 ring-slate-200 bg-white p-2 text-mute hover:text-sky-600">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 flex gap-1.5 pb-2">
          <TabButton active={tab === 'home'} onClick={() => onTab('home')} icon={<Home size={15} />}>
            ホーム
          </TabButton>
          {sanmon && (
            <TabButton active={tab === 'sanmon'} onClick={() => onTab('sanmon')} icon={<Swords size={15} />}>
              SANMON
            </TabButton>
          )}
          <TabButton active={tab === 'mine'} onClick={() => onTab('mine')} icon={<LineChart size={15} />}>
            じぶんの きろく
          </TabButton>
        </div>
      </header>

      {tab === 'mine' ? (
        <main className="max-w-2xl mx-auto px-5 py-6">{mine}</main>
      ) : tab === 'sanmon' && sanmon ? (
        <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">{sanmon}</main>
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

          {/* きょうの ふくしゅう。間をあけて（サーバの次の日）、教科・単元をまぜて（toDueItems）。はじめの3つを先に */}
          {due.length > 0 && (
            <section>
              <CardTitle icon={<RotateCcw size={18} className="text-emerald-600" />}
                note="わすれかけた ころに、いろいろな たんげんを まぜて やると 力が つくよ">
                <span className="text-emerald-700">きょうの ふくしゅう 3つ</span>
              </CardTitle>
              <div className="space-y-2">
                {(moreDue ? due : due.slice(0, 3)).map((d) => (
                  <LinkRow key={`${d.appId}/${d.skillId}`} href={linkTo(d.appUrl, student)} tone="grass"
                    subject={d.subject} title={d.appTitle} sub={placeLabel(d.moduleTitle, d.label)}
                    right={<ChevronRight size={20} className="shrink-0 text-emerald-600" />} />
                ))}
              </div>
              {due.length > 3 && (
                <button onClick={() => setMoreDue((v) => !v)}
                  className="tap mt-2 w-full rounded-xl py-2.5 text-xs font-black text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100">
                  {moreDue ? 'とじる' : `もっと やる（あと ${due.length - 3}）`}
                </button>
              )}
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

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" role="img" aria-label="SOL">
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
