/**
 * ホームの先頭に出す SANMON:04（ゲーム）の入口と、町（単元）を開くまでの メーター。
 *
 * ねらい: 子どもがゲームに流れてしまうのではなく、「単元アプリで がんばる → スタミナがたまり 町が開く → SANMON で遊ぶ」の
 * 順に動くようにする。だから ゲームの入口のすぐ下に、「どの単元を あと何すれば 町が開くか」と その単元アプリへの道を並べる。
 *
 * メーターの4つ（learning-app-kit/sanmon と同じきまり。全部そろうと開く）:
 *   練習 … 練習の項目を「できた」（5回れんぞくノーミス）にした数
 *   テスト … 本番テスト（ぜんぶ）で8割以上を取った日の数（ちがう日に3回）
 *   階段 … 実力の階段を ひとりで登った段
 *   ねばり … ひとりで練習した日の数
 * 正答率や順位は出さない（くらべる相手は過去の自分だけ）。
 */
import { useState } from 'react';
import { ChevronRight, ChevronDown, Lock, Unlock, Zap, Swords } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { SANMON_RULES, type SanmonStatus, type SanmonUnitProgress, type Meter } from 'learning-app-kit/sanmon';
import { SANMON_URL } from '../lib/useSanmon';

function link(url: string | undefined, student: StudentIdentity | null) {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

export function SanmonSection({ student, status, units, onJoin }: {
  student: StudentIdentity | null;
  status: SanmonStatus | null;
  units: SanmonUnitProgress[];
  onJoin: () => void;
}) {
  const stamina = status?.stamina ?? 0;
  const pct = Math.min(100, (stamina / SANMON_RULES.maxStamina) * 100);
  const openCount = units.filter((u) => u.open).length;
  const battles = Math.floor(stamina / SANMON_RULES.battleCost);
  // まだ開いていない町は、あと少しのものを上に（いちばん近いゴールが先に目に入るように）
  const locked = units.filter((u) => !u.open).sort((a, b) => progressOf(b) - progressOf(a));
  const opened = units.filter((u) => u.open);
  // 11こ ぜんぶを いつも並べると長すぎる。あと少しの3つだけ出して、のこりは ひらいて見る
  const [all, setAll] = useState(false);
  const shown = all ? locked : locked.slice(0, 3);

  return (
    <section className="space-y-3">
      <a href={link(SANMON_URL, student)} className="tap block hud rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black tracking-[0.3em] text-emerald-300/80">GAME</p>
            <p className="hologram text-3xl font-black italic leading-tight">SANMON:04</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 font-black text-sm bg-gradient-to-r from-emerald-500 to-amber-400 text-black shadow-[0_0_18px_rgba(52,211,153,0.5)]">
            <Swords size={16} /> いく <ChevronRight size={16} />
          </span>
        </div>
        {student ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-300 shrink-0" />
              <span className="text-xs font-black text-amber-200 shrink-0">スタミナ</span>
              <span className="flex-1 h-3 rounded-full bg-black/60 overflow-hidden ring-1 ring-amber-400/40">
                <span className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,191,36,0.7)]" style={{ width: `${pct}%` }} />
              </span>
              <span className="num font-black text-amber-200 text-sm shrink-0">{stamina}<span className="text-[10px] text-amber-200/60">/{SANMON_RULES.maxStamina}</span></span>
            </div>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              バトル あと <b className="num text-amber-300">{battles}</b> 回 ・ きょう たまった <b className="num text-amber-300">{status?.earnedToday ?? 0}</b>/{SANMON_RULES.dailyCap}
              ・ ひらいた町 <b className="num text-emerald-300">{openCount}</b>/{units.length}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-emerald-100/80">がっきゅうコードを 入れると、スタミナと 町が つかえるよ</p>
        )}
      </a>

      {!student ? (
        <button onClick={onJoin} className="tap w-full hud rounded-2xl p-4 text-left">
          <p className="font-black text-amber-200 text-sm">がっきゅうコードを 入れよう</p>
          <p className="text-xs text-emerald-100/70 mt-1">入れると、単元の アプリで がんばった分が スタミナに なるよ</p>
        </button>
      ) : (
        <div className="hud rounded-3xl p-4">
          <p className="font-black text-emerald-200 text-sm">町を ひらこう</p>
          <p className="text-[11px] text-emerald-100/70 mt-0.5 mb-3 leading-relaxed">
            単元の アプリで 4つ ぜんぶ そろうと、SANMON の その町が ひらくよ。アプリで 1問 正解するごとに スタミナが 1 たまるよ。
          </p>
          <div className="grid gap-2">
            {shown.map((u) => <LockedTown key={u.key} u={u} student={student} />)}
          </div>
          {locked.length > 3 && (
            <button onClick={() => setAll((v) => !v)} className="tap mt-2 w-full rounded-xl py-2 text-xs font-black text-emerald-200 bg-white/5 ring-1 ring-white/10 inline-flex items-center justify-center gap-1">
              {all ? 'とじる' : `ほかの 町も 見る（あと ${locked.length - 3}）`}<ChevronDown size={14} className={all ? 'rotate-180' : ''} />
            </button>
          )}
          {opened.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {opened.map((u) => (
                <span key={u.key} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40">
                  <Unlock size={11} />{u.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function progressOf(u: SanmonUnitProgress): number {
  const ms = [u.practice, u.test, u.trial, u.days].filter((m): m is Meter => !!m);
  return ms.reduce((s, m) => s + Math.min(1, m.have / Math.max(1, m.need)), 0) / Math.max(1, ms.length);
}

function LockedTown({ u, student }: { u: SanmonUnitProgress; student: StudentIdentity | null }) {
  return (
    <a href={link(u.appUrl, student)} className="tap block rounded-2xl p-3 bg-black/40 ring-1 ring-white/10 hover:ring-emerald-400/50">
      <div className="flex items-center gap-2 mb-2">
        <Lock size={14} className="text-slate-400 shrink-0" />
        <span className="font-black text-sm text-white truncate flex-1">{u.name}</span>
        <span className="text-[10px] font-black text-emerald-300 shrink-0 inline-flex items-center">アプリへ<ChevronRight size={12} /></span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <MeterBox label="練習" m={u.practice!} unit="こ" />
        <MeterBox label="テスト8割" m={u.test!} unit="回" />
        <MeterBox label="階段" m={u.trial!} unit="段" />
        <MeterBox label="ねばり" m={u.days!} unit="日" />
      </div>
    </a>
  );
}

function MeterBox({ label, m, unit }: { label: string; m: Meter; unit: string }) {
  const p = Math.min(100, (m.have / Math.max(1, m.need)) * 100);
  return (
    <div className={`rounded-xl px-1.5 py-1.5 text-center ${m.done ? 'bg-emerald-500/20 ring-1 ring-emerald-400/50' : 'bg-white/5'}`}>
      <p className={`text-[10px] font-black ${m.done ? 'text-emerald-200' : 'text-slate-300'}`}>{m.done ? '✓ ' : ''}{label}</p>
      <p className="num text-xs font-black text-white mt-0.5">{Math.min(m.have, m.need)}<span className="text-[10px] text-slate-400">/{m.need}{unit}</span></p>
      <div className="h-1 rounded-full bg-black/50 mt-1 overflow-hidden">
        <div className={`h-full ${m.done ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
