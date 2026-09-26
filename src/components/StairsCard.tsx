/**
 * 「実力の階段」を単元ごとにミニ階段で並べる。
 *
 * 各アプリの実力の階段と同じ見た目（黒の地・ネオンの水色・セーブはオレンジ）にして、
 * ここで見たものとアプリで見たものが同じだとすぐ分かるようにする。
 *
 * 出すもの: 今の段・セーブ・自己最高段・頂点まであと何段・登った回数。
 * 出さないもの: 他の子の段、順位、学級の分布。
 */
import { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { buildHandoffUrl, type StudentIdentity } from 'learning-app-kit/sync';
import { MiniStairs } from 'learning-app-kit/react';
import { floorName, TRIAL_NAME, TRIAL_SUBTITLE, SAVE_NAME } from 'learning-app-kit/trial';
import type { StairsOverview, UnitStairs } from '../lib/useTrials';

const BG = '#010307';
const CYAN = '#22e7ff';
const ORANGE = '#ff9d2e';
const TEXT = '#e8fbff';
const DIM = 'rgba(232,251,255,0.55)';
const ORBITRON = "'Orbitron', system-ui, sans-serif";

/** Orbitron を1回だけ読みこむ（英字の見出し用。kit と同じ id なので二重に読まない） */
function useDisplayFont() {
  useEffect(() => {
    if (document.getElementById('lak-orbitron')) return;
    const l = document.createElement('link');
    l.id = 'lak-orbitron';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap';
    document.head.appendChild(l);
  }, []);
}

function linkTo(url: string | undefined, student: StudentIdentity | null): string | undefined {
  if (!url) return undefined;
  return student ? buildHandoffUrl(url, student.joinCode, student.number) : url;
}

export function StairsCard({ overview, student }: { overview: StairsOverview; student: StudentIdentity | null }) {
  useDisplayFont();
  const { units, climbs, thisWeek } = overview;
  const summits = units.filter((u) => u.summary.best >= u.floors).length;

  return (
    <section
      aria-label={TRIAL_NAME}
      className="rounded-3xl p-5 overflow-hidden relative"
      style={{
        background: `radial-gradient(120% 80% at 100% 0%, rgba(34,231,255,0.14), transparent 60%), ${BG}`,
        boxShadow: `0 0 0 1px rgba(34,231,255,0.35), 0 10px 30px -12px rgba(34,231,255,0.35)`,
        color: TEXT,
      }}
    >
      <div className="mb-4">
        <h2 className="font-black text-lg leading-tight" style={{ textShadow: `0 0 12px ${CYAN}88` }}>
          {TRIAL_NAME}
        </h2>
        <p className="text-[10px] mt-0.5" style={{ fontFamily: ORBITRON, letterSpacing: '0.28em', color: CYAN }}>
          {TRIAL_SUBTITLE}
        </p>
      </div>

      {units.length === 0 ? (
        <p className="text-sm leading-relaxed" style={{ color: DIM }}>
          算数の アプリの いちばん下から 挑戦できるよ。
          <br />のぼった 段が ここに ならぶよ。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat code="CLIMBS" value={climbs} unit="回" label="登った 回数" />
            <Stat code="WEEK" value={thisWeek} unit="回" label="この7日" />
            <Stat code="APEX" value={summits} unit="単元" label="頂点 到達" />
          </div>

          <div className="space-y-2">
            {units.map((u) => <UnitRow key={u.app.app_id} u={u} href={linkTo(u.app.url, student)} />)}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: DIM }}>
            <span style={{ color: ORANGE }}>■</span> {SAVE_NAME}＝ひとりで 最後まで やって 3回 届いた 段。
            くらべるのは むかしの じぶん だけだよ。
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ code, value, unit, label }: { code: string; value: number; unit: string; label: string }) {
  return (
    <div className="rounded-2xl px-2 py-2.5 text-center"
      style={{ background: 'rgba(34,231,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(34,231,255,0.25)' }}>
      <p className="text-[9px]" style={{ fontFamily: ORBITRON, letterSpacing: '0.18em', color: CYAN }}>{code}</p>
      <p className="num font-black text-2xl leading-tight">
        {value}<span className="text-xs ml-0.5" style={{ color: DIM }}>{unit}</span>
      </p>
      <p className="text-[10px] font-bold" style={{ color: DIM }}>{label}</p>
    </div>
  );
}

function UnitRow({ u, href }: { u: UnitStairs; href?: string }) {
  const { summary: s, floors } = u;
  const left = Math.max(0, floors - s.best);
  const body = (
    <>
      <MiniStairs F={floors} reached={s.best} saved={s.sealed} size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-snug">{u.app.title}</p>
        {/* 項目ごとに折り返さないようにする（「セ／ーブ」のように途中で切れると読めない） */}
        <p className="flex flex-wrap gap-x-2.5 text-[11px] font-bold mt-0.5" style={{ color: DIM }}>
          <span className="whitespace-nowrap">
            いま <span style={{ color: TEXT }}>{s.current === null ? '—' : floorName(s.current, floors)}</span>
          </span>
          <span className="whitespace-nowrap">
            {SAVE_NAME} <span style={{ color: s.sealed > 0 ? ORANGE : DIM }}>
              {s.sealed > 0 ? floorName(s.sealed, floors) : 'まだ'}
            </span>
          </span>
          <span className="whitespace-nowrap">
            自己最高 <span style={{ color: CYAN }}>{s.best > 0 ? floorName(s.best, floors) : '—'}</span>
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        {left === 0 ? (
          <p className="text-[11px] font-black" style={{ color: CYAN, textShadow: `0 0 8px ${CYAN}` }}>頂点 到達</p>
        ) : (
          <p className="text-[11px] font-bold" style={{ color: DIM }}>
            頂点まで<br /><span className="num text-base font-black" style={{ color: TEXT }}>あと{left}段</span>
          </p>
        )}
      </div>
      {href && <ChevronRight size={18} className="shrink-0" style={{ color: CYAN }} />}
    </>
  );
  const cls = 'flex items-center gap-3 rounded-2xl px-3 py-2.5';
  const style = { background: 'rgba(232,251,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(34,231,255,0.18)' };
  return href
    ? <a href={href} className={`${cls} transition hover:brightness-125`} style={style}>{body}</a>
    : <div className={cls} style={style}>{body}</div>;
}
