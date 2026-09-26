/**
 * 「実力の階段」の記録を、単元をまたいで読む。
 *
 * 各アプリの実力の階段の画面と**同じ関数（kit の summarize）**で
 * 今の段・セーブ・自己最高段を出す。別々に数えると、同じ「セーブ」という言葉の意味が
 * 画面ごとにずれるため。
 *
 * 比べる相手は過去の自分だけ。ほかの子の段は読めない（RPC が本人の分しか返さない）。
 */
import { useCallback, useEffect, useState } from 'react';
import { summarize, type TrialRecord, type TrialMode, type TrialSummary } from 'learning-app-kit/trial';
import { CATALOGS, type AppCatalog } from 'learning-app-kit/catalog';
import { portalConfig } from './portal';

/** サーバの trial_result 1行（my_trial_all が返す形） */
export interface MyTrialRow {
  app_id: string;
  mode: string;
  floor: number;
  floors: number;
  score: number;
  solo_complete: boolean;
  ts: number;
  event_id: string;
}

export async function fetchMyTrials(studentId: string | null): Promise<MyTrialRow[]> {
  const { supabaseUrl, supabaseKey } = portalConfig;
  if (!supabaseUrl || !supabaseKey || !studentId) return [];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/my_trial_all`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_student_id: studentId }),
    });
    if (!res.ok) return [];
    return (await res.json()) as MyTrialRow[];
  } catch {
    return [];
  }
}

export function useTrials(studentId: string | null) {
  const [rows, setRows] = useState<MyTrialRow[]>([]);
  const load = useCallback(async () => {
    if (!studentId) { setRows([]); return; }
    setRows(await fetchMyTrials(studentId));
  }, [studentId]);
  useEffect(() => { void load(); }, [load]);
  return { rows, reload: load };
}

/** 単元ひとつぶんの階段 */
export interface UnitStairs {
  app: AppCatalog;
  /** 段の数（いちばん新しい記録の段数。段の組み方をあとで直しても新しい方に合わせる） */
  floors: number;
  summary: TrialSummary;
  /** 最後に登った時刻 */
  lastTs: number;
}

export interface StairsOverview {
  units: UnitStairs[];
  /** これまでに登った回数（極限・無限あわせて） */
  climbs: number;
  /** この7日に登った回数 */
  thisWeek: number;
}

const toRecord = (r: MyTrialRow): TrialRecord => ({
  eventId: r.event_id,
  ts: Number(r.ts),
  mode: r.mode as TrialMode,
  floor: Number(r.floor) || 0,
  floors: Number(r.floors) || 0,
  score: Number(r.score) || 0,
  soloComplete: !!r.solo_complete,
});

export function toStairs(rows: readonly MyTrialRow[], grade: number, now = Date.now()): StairsOverview {
  const byApp = new Map<string, TrialRecord[]>();
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.event_id)) continue;
    seen.add(r.event_id);
    if (!byApp.has(r.app_id)) byApp.set(r.app_id, []);
    byApp.get(r.app_id)!.push(toRecord(r));
  }

  const units: UnitStairs[] = [];
  let climbs = 0;
  let thisWeek = 0;
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  for (const [appId, recs] of byApp) {
    const app = CATALOGS[appId];
    if (!app || app.grade !== grade) continue;
    const latest = recs.reduce((a, b) => (b.ts > a.ts ? b : a));
    const floors = latest.floors || Math.max(...recs.map((r) => r.floors), 1);
    units.push({ app, floors, summary: summarize(recs, floors), lastTs: latest.ts });
    climbs += recs.length;
    thisWeek += recs.filter((r) => r.ts >= weekAgo).length;
  }
  // 最近登った単元を上に（単元どうしの並びで、他人との比較ではない）
  units.sort((a, b) => b.lastTs - a.lastTs);
  return { units, climbs, thisWeek };
}
