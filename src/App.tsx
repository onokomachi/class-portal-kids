/**
 * 子ども用ハブ。
 *
 * ここで1回だけ学級コードを入れれば、そこから飛んだ各単元アプリに
 * 名乗りが引きつがれる（単元アプリは別ドメインなので localStorage を共有できない）。
 *
 * 氏名はどこにも無い。サーバにあるのは「この学級の何番か」だけ。
 */
import { useEffect, useMemo, useState } from 'react';
import { getStudent, type StudentIdentity } from 'learning-app-kit/sync';
import { listGrades } from 'learning-app-kit/catalog';
import { isConfigured } from './lib/portal';
import { useProgress, toDueItems, toUnitProgress } from './lib/useProgress';
import {
  useActivity, useSkillTotals, toEffort, toStrengths, toNextSteps, toSelfCompare,
  toTrend, toUnitAbility, toHardSkills,
} from './lib/useMine';
import { Join } from './components/Join';
import { Hub } from './components/Hub';
import { Mine } from './components/Mine';

/** 学年は端末に覚えさせる。1人1台なので毎回選ばせない。 */
const GRADE_KEY = 'kids_grade_v1';
function savedGrade(fallback: number): number {
  try {
    const v = Number(localStorage.getItem(GRADE_KEY));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [student, setStudent] = useState<StudentIdentity | null>(() => getStudent());
  // 名乗っていない子には、まず入力画面を出す。ただし「あとで」で飛ばせる
  const [showJoin, setShowJoin] = useState(() => getStudent() === null);
  const grades = useMemo(() => listGrades(), []);
  const [grade, setGrade] = useState(() => savedGrade(grades[0] ?? 4));

  const [tab, setTab] = useState<'home' | 'mine'>('home');
  const { rows, loading, reload } = useProgress(student?.studentId ?? null);
  const activity = useActivity(student?.studentId ?? null);
  const due = useMemo(() => toDueItems(rows ?? []), [rows]);
  const units = useMemo(() => toUnitProgress(rows ?? [], grade), [rows, grade]);
  const effort = useMemo(() => toEffort(activity.rows), [activity.rows]);
  const strengths = useMemo(() => toStrengths(rows ?? []), [rows]);
  const next = useMemo(() => toNextSteps(rows ?? []), [rows]);
  const compare = useMemo(() => toSelfCompare(activity.rows), [activity.rows]);
  const totals = useSkillTotals(student?.studentId ?? null);
  const trend = useMemo(() => toTrend(activity.rows), [activity.rows]);
  const ability = useMemo(() => toUnitAbility(totals.rows, grade), [totals.rows, grade]);
  const hard = useMemo(() => toHardSkills(totals.rows), [totals.rows]);

  useEffect(() => {
    try { localStorage.setItem(GRADE_KEY, String(grade)); } catch { /* 保存できなくても動く */ }
  }, [grade]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-sm rounded-2xl bg-white border border-slate-200 p-6 text-center">
          <p className="font-bold text-slate-800">まだ せっていが すんでいません</p>
          <p className="text-sm text-slate-500 mt-2">せんせいに おしえてね</p>
        </div>
      </div>
    );
  }

  if (showJoin) {
    return (
      <Join
        onDone={(s) => { setStudent(s); setShowJoin(false); }}
        onSkip={() => setShowJoin(false)}
      />
    );
  }

  return (
    <>
      {grades.length > 1 && (
        <div className="bg-white/70 border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-5 py-2 flex items-center gap-2">
            <label htmlFor="grade" className="text-xs text-slate-500">がくねん</label>
            <select id="grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
              {grades.map((g) => <option key={g} value={g}>{g}年</option>)}
            </select>
          </div>
        </div>
      )}
      <Hub
        student={student}
        due={due}
        units={units}
        loading={loading || activity.loading}
        onReload={() => { void reload(); void activity.reload(); void totals.reload(); }}
        onJoin={() => setShowJoin(true)}
        tab={tab}
        onTab={setTab}
        mine={
          <Mine student={student} effort={effort} strengths={strengths} next={next}
            compare={compare} trend={trend} units={ability} hard={hard} />
        }
      />
    </>
  );
}
