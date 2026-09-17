/**
 * 子ども用ハブの部品。
 *
 * 数字を出すときの約束: **くらべる相手は過去の自分だけ。**
 * 順位も学級平均も出さない。Kluger & DeNisi (1996) の607件のメタ分析では
 * フィードバックの約3分の1が負の効果で、分かれ目は注意が「課題」に向くか
 * 「自分の出来不出来」に向くかだった。他人と並べた数字は後者へ向かわせる。
 */
import type { ReactNode } from 'react';

export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export const SUBJECT_STYLE: Record<string, string> = {
  算数: 'bg-sky-100 text-sky-700 ring-sky-200',
  国語: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export function SubjectTag({ subject }: { subject: string }) {
  return (
    <span className={`shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full ring-1
                      ${SUBJECT_STYLE[subject] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
      {subject}
    </span>
  );
}

/**
 * 「モジュール名　レベル名」の並び。
 * レベル名がモジュール名で始まっているときは、モジュール名を出さない
 * （「順接（だから）　順接（だから）／やさしい」のような重複になるため）。
 */
export function placeLabel(moduleTitle: string, label: string): string {
  return label.startsWith(moduleTitle) ? label : `${moduleTitle}　${label}`;
}

export function Card({ children, className = '', tone }: {
  children: ReactNode; className?: string; tone?: 'sky' | 'grass' | 'sun' | 'flame';
}) {
  const ring = tone
    ? { sky: 'ring-1 ring-sky-100', grass: 'ring-1 ring-emerald-100',
        sun: 'ring-1 ring-amber-100', flame: 'ring-1 ring-rose-100' }[tone]
    : 'ring-1 ring-slate-100';
  return <section className={`card ${ring} ${className}`}>{children}</section>;
}

export function CardTitle({ icon, children, note }: {
  icon?: ReactNode; children: ReactNode; note?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-1.5 font-black text-ink">{icon}{children}</h2>
      {note && <p className="text-xs text-mute mt-0.5 leading-relaxed">{note}</p>}
    </div>
  );
}

/** 大きな数字ひとつ。子どもが読む数字なので、単位まで日本語で添える */
export function BigStat({ value, unit, label, tone }: {
  value: number | string; unit: string; label: string; tone: 'sky' | 'grass' | 'sun' | 'flame';
}) {
  const c = {
    sky: 'text-sky-600 bg-sky-50', grass: 'text-emerald-600 bg-emerald-50',
    sun: 'text-amber-600 bg-amber-50', flame: 'text-rose-500 bg-rose-50',
  }[tone];
  return (
    <div className={`rounded-2xl px-3 py-3 text-center ${c.split(' ')[1]}`}>
      <p className={`num font-black text-3xl leading-none ${c.split(' ')[0]}`}>
        {value}<span className="text-sm font-black ml-0.5">{unit}</span>
      </p>
      <p className="text-[11px] text-mute mt-1.5 leading-tight font-bold">{label}</p>
    </div>
  );
}

/**
 * やった日のマス目。色の濃さ＝その日にやった量。
 * 数字は出さない——日ごとの数を並べると、量を競う画面になってしまう。
 */
export function DayGrid({ days, columns = 7 }: {
  days: { date: string; count: number }[]; columns?: number;
}) {
  const level = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : 3);
  const BG = ['bg-slate-100 ring-slate-200', 'bg-emerald-200 ring-emerald-300',
              'bg-emerald-400 ring-emerald-500', 'bg-emerald-600 ring-emerald-700'];
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {days.map((d) => (
        <div key={d.date} title={`${md(d.date)}　${d.count}もん`}
          className={`aspect-square rounded-lg ring-1 ${BG[level(d.count)]}`} />
      ))}
    </div>
  );
}

/** 帯グラフ。かならず数字も添える（色だけで分かる画面にしない） */
export function Bar({ value, tone = 'sky' }: { value: number; tone?: 'sky' | 'sun' | 'grass' }) {
  const c = { sky: 'bg-sky-500', sun: 'bg-amber-500', grass: 'bg-emerald-500' }[tone];
  return (
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${c}`}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/** どこかへ行くカード。単元アプリへのリンクに使う */
export function LinkRow({ href, subject, title, sub, right, tone = 'sky' }: {
  href?: string; subject: string; title: string; sub?: ReactNode;
  right?: ReactNode; tone?: 'sky' | 'grass' | 'sun';
}) {
  const border = { sky: 'ring-slate-100 hover:ring-sky-300',
                   grass: 'ring-emerald-100 hover:ring-emerald-300',
                   sun: 'ring-amber-100 hover:ring-amber-300' }[tone];
  return (
    <a href={href} className={`tap card flex items-center gap-3 p-4 ring-1 ${border}`}>
      <SubjectTag subject={subject} />
      <span className="min-w-0 flex-1">
        <span className="block font-black text-ink text-sm truncate">{title}</span>
        {sub && <span className="block text-xs text-mute truncate mt-0.5">{sub}</span>}
      </span>
      {right}
    </a>
  );
}
