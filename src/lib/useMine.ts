/**
 * 「じぶんの きろく」で使う数字を作る。
 *
 * 出すのは4つ:
 *   - がんばった記録 … やった日・続いた日数（自分の中の事実）
 *   - できるようになったこと … 5回連続ノーミスまで行ったレベルの数
 *   - つぎに やるといいところ … 順位づけではなく、行き先の提案
 *   - 先週とくらべて … 問題単位の正答率の変化
 *
 * **比べる相手は過去の自分だけにする。** 順位も学級平均も出さない。
 * Kluger & DeNisi (1996) の607件のメタ分析では、フィードバックの約3分の1が
 * 負の効果で、分かれ目は注意が「課題」に向くか「自分の出来不出来」に向くかだった。
 * 他人と比べた数字は後者に向かわせる。自分の過去と比べた数字なら、
 * 「先週より伸びた／落ちた、では次どうするか」という課題の話になる。
 * （自己調整学習でいう「自己観察」を成り立たせるために、数値そのものは必要）
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchMyActivity, streakDays, totalsBetween, fetchMySkillTotals, weeklyTrend,
  type MyActivityRow, type MySkillRow, type MySkillTotalRow, type WeekPoint,
} from 'learning-app-kit/sync';
import { lookupSkill, CATALOGS, type AppCatalog } from 'learning-app-kit/catalog';
import { portalConfig } from './portal';

export function useActivity(studentId: string | null) {
  const [rows, setRows] = useState<MyActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) { setRows([]); return; }
    setLoading(true);
    const r = await fetchMyActivity(portalConfig, studentId);
    setLoading(false);
    setRows(r.ok ? r.rows : []);
  }, [studentId]);

  useEffect(() => { void load(); }, [load]);
  return { rows, loading, reload: load };
}

/** 日本時間の「今日」。端末の時計をそのまま使う（サーバと1日ずれても表示だけの問題） */
export function todayJst(now = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

export interface Effort {
  /** 今日から続いている日数 */
  streak: number;
  /** これまでに取り組んだ日の数 */
  totalDays: number;
  /** 今週やった問題の数 */
  thisWeek: number;
  /** 直近N日ぶんの「やったかどうか」。カレンダーの点に使う */
  recent: { date: string; count: number }[];
}

export function toEffort(rows: readonly MyActivityRow[], days = 28, today = todayJst()): Effort {
  const byDate = new Map<string, number>();
  for (const r of rows) byDate.set(r.event_date, (byDate.get(r.event_date) ?? 0) + Number(r.attempts));

  const recent: { date: string; count: number }[] = [];
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = d.toISOString().slice(0, 10);
    recent.push({ date: key, count: byDate.get(key) ?? 0 });
    d.setUTCDate(d.getUTCDate() + 1);
  }

  return {
    streak: streakDays(rows, today),
    totalDays: byDate.size,
    thisWeek: recent.slice(-7).reduce((s, r) => s + r.count, 0),
    recent,
  };
}

export interface StrongUnit {
  app: AppCatalog;
  mastered: number;
  touched: number;
}

/** できるようになったことを単元ごとに。多い順に並べる（他人ではなく単元どうしの比較） */
export function toStrengths(rows: readonly MySkillRow[]): StrongUnit[] {
  const byApp = new Map<string, MySkillRow[]>();
  for (const r of rows) {
    if (!byApp.has(r.app_id)) byApp.set(r.app_id, []);
    byApp.get(r.app_id)!.push(r);
  }
  const out: StrongUnit[] = [];
  for (const [appId, mine] of byApp) {
    const app = CATALOGS[appId];
    if (!app) continue;
    const mastered = mine.filter((r) => r.perfect_streak >= 5).length;
    if (mastered === 0) continue;
    out.push({ app, mastered, touched: mine.length });
  }
  return out.sort((a, b) => b.mastered - a.mastered);
}

export interface NextStep {
  appId: string;
  appTitle: string;
  appUrl?: string;
  subject: string;
  label: string;
  moduleTitle: string;
}

/**
 * つぎに やるといいところ。
 *
 * 「まだ5回連続ノーミスまで行っていない」もののうち、取り組んだ回数が少ない順に出す。
 * 正答率の低い順にしないのは、**苦手なものから順に並べた一覧は苦手リスト**に
 * なってしまうため。回数の少ない順なら「まだ途中のもの」という意味になる。
 */
export function toNextSteps(rows: readonly MySkillRow[], limit = 3): NextStep[] {
  const seen = new Set<string>();
  const out: NextStep[] = [];
  const candidates = rows
    .filter((r) => r.perfect_streak < 5 && r.attempts > 0)
    .sort((a, b) => a.attempts - b.attempts);

  for (const r of candidates) {
    if (seen.has(r.app_id)) continue;      // 同じ単元ばかりにしない
    const c = lookupSkill(r.app_id, r.skill_id);
    const app = CATALOGS[r.app_id];
    if (!c || !app) continue;
    seen.add(r.app_id);
    out.push({
      appId: r.app_id, appTitle: app.title, appUrl: app.url, subject: app.subject,
      label: c.label, moduleTitle: c.module_title,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** 週ごとの推移。グラフに渡す形をそのまま作る。 */
export function toTrend(rows: readonly MyActivityRow[], weeks = 8, today = todayJst()): WeekPoint[] {
  return weeklyTrend(rows, weeks, today);
}

/** 何日前の日付か（日本時間・'YYYY-MM-DD'） */
function daysAgo(n: number, today = todayJst()): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export interface SelfCompare {
  /** この7日の問題単位の正答率。まだ記録が無ければ null */
  thisWeek: number | null;
  /** その前の7日。比べる相手は「先週の自分」だけ */
  lastWeek: number | null;
  /** 伸び（この7日 − 前の7日）。どちらかが無ければ null */
  diff: number | null;
  /** この7日にのべ何回答えたか。少ないときに正答率を出さない判断に使う */
  answers: number;
}

/**
 * 「先週の自分」とくらべる。
 *
 * 他人とは比べない。順位も学級平均も出さない——比べる相手が他人になった
 * 時点で、注意は課題から「自分の出来不出来」に移る（Kluger & DeNisi 1996）。
 *
 * のべ解答数が少ないうちは正答率を出さない。3問やって1問できた「33%」は
 * 実力ではなく偶然で、数字だけが独り歩きするため。
 */
const MIN_ANSWERS = 10;

export function toSelfCompare(rows: readonly MyActivityRow[], today = todayJst()): SelfCompare {
  const now = totalsBetween(rows, daysAgo(6, today), today);
  const prev = totalsBetween(rows, daysAgo(13, today), daysAgo(7, today));
  const thisWeek = now.answers >= MIN_ANSWERS ? now.rate : null;
  const lastWeek = prev.answers >= MIN_ANSWERS ? prev.rate : null;
  return {
    thisWeek,
    lastWeek,
    diff: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null,
    answers: now.answers,
  };
}

/* ---------- のびの推移と、項目ごとのできぐあい ---------- */

export function useSkillTotals(studentId: string | null) {
  const [rows, setRows] = useState<MySkillTotalRow[]>([]);
  const load = useCallback(async () => {
    if (!studentId) { setRows([]); return; }
    const r = await fetchMySkillTotals(portalConfig, studentId);
    setRows(r.ok ? r.rows : []);
  }, [studentId]);
  useEffect(() => { void load(); }, [load]);
  return { rows, reload: load };
}

/** 単元ごとのできぐあい。項目（スキル）の記録を単元でまとめたもの。 */
export interface UnitAbility {
  app: AppCatalog;
  answers: number;
  corrects: number;
  /** 問題単位の正答率。のべ解答数が足りなければ null */
  rate: number | null;
  /** 記録のある項目の数 */
  skills: number;
}

/** 項目ひとつぶん。単元の中でどこが手ごわいかを見るのに使う。 */
export interface SkillAbility {
  appId: string;
  appTitle: string;
  subject: string;
  appUrl?: string;
  label: string;
  moduleTitle: string;
  answers: number;
  rate: number;
}

/** 正答率を出すのに必要な、のべ解答数の下限（これ未満は偶然の幅が大きすぎる） */
const MIN_FOR_RATE = 10;

export function toUnitAbility(rows: readonly MySkillTotalRow[], grade: number): UnitAbility[] {
  const byApp = new Map<string, { answers: number; corrects: number; skills: number }>();
  for (const r of rows) {
    const cur = byApp.get(r.app_id) ?? { answers: 0, corrects: 0, skills: 0 };
    cur.answers += Number(r.answers) || 0;
    cur.corrects += Number(r.corrects) || 0;
    cur.skills += 1;
    byApp.set(r.app_id, cur);
  }
  const out: UnitAbility[] = [];
  for (const [appId, v] of byApp) {
    const app = CATALOGS[appId];
    if (!app || app.grade !== grade) continue;
    out.push({
      app, answers: v.answers, corrects: v.corrects, skills: v.skills,
      rate: v.answers >= MIN_FOR_RATE ? v.corrects / v.answers : null,
    });
  }
  // できている順。単元どうしの比較であって、他人との比較ではない
  return out.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
}

/**
 * 手ごわい項目。正答率の低い順に出す。
 *
 * 「つぎに やるといいところ」（まだ途中のもの）とは役割が違う。
 * こちらは**何度もやっているのに正答率が上がらない**ところで、
 * 先生が見れば指導の手がかりになり、子どもにとっては
 * 「ここを ねらってやると効く」という的になる。
 */
/**
 * ここを下回っていたら「まだ手ごわい」とみなす。
 * これが無いと、よくできている項目まで一覧に並び、見出しが嘘になる
 * （実際、検証で85%の項目が「ねらうところ」に出た）。
 */
const HARD_BELOW = 0.75;

export function toHardSkills(rows: readonly MySkillTotalRow[], limit = 5): SkillAbility[] {
  const out: SkillAbility[] = [];
  for (const r of rows) {
    const answers = Number(r.answers) || 0;
    if (answers < MIN_FOR_RATE) continue;      // 回数が少ないものは判断しない
    if ((Number(r.corrects) || 0) / answers >= HARD_BELOW) continue;   // できている項目は並べない
    const c = lookupSkill(r.app_id, r.skill_id);
    const app = CATALOGS[r.app_id];
    if (!c || !app) continue;
    out.push({
      appId: r.app_id, appTitle: app.title, subject: app.subject, appUrl: app.url,
      label: c.label, moduleTitle: c.module_title,
      answers, rate: (Number(r.corrects) || 0) / answers,
    });
  }
  return out.sort((a, b) => a.rate - b.rate).slice(0, limit);
}
