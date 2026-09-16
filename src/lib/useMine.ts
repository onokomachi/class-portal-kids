/**
 * 「じぶんの分析」で使う数字を作る。
 *
 * 見せ方の方針は Hub.tsx と同じで、**正答率も順位も出さない**。
 * ここで作るのは3つだけ:
 *   - がんばった記録 … やった日・続いた日数（自分の中の事実。他人と比べない）
 *   - できるようになったこと … 5回連続ノーミスまで行ったレベルの数
 *   - つぎに やるといいところ … 順位づけではなく、行き先の提案
 *
 * Kluger & DeNisi (1996) の607件のメタ分析では、フィードバックの約3分の1が
 * 負の効果で、分かれ目は注意が「課題」に向くか「自分の出来不出来」に向くかだった。
 * 「何％できたか」は後者に向かわせるので、数えるのは「やったこと」にする。
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchMyActivity, streakDays, type MyActivityRow, type MySkillRow } from 'learning-app-kit/sync';
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
