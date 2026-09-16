/**
 * 自分の記録を読んで、画面で使える形にする。
 *
 * サーバは app_id / skill_id という記号しか返さないので、
 * learning-app-kit/catalog で人の読める名前に戻す。
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchMyProgress, dueFromRows, type MySkillRow } from 'learning-app-kit/sync';
import { lookupSkill, CATALOGS, type AppCatalog } from 'learning-app-kit/catalog';
import { portalConfig } from './portal';

/** 復習の時期が来た1件。どのアプリのどこへ行けばよいかまで分かる形にする。 */
export interface DueItem {
  appId: string;
  appTitle: string;
  appUrl?: string;
  subject: string;
  skillId: string;
  label: string;
  moduleTitle: string;
  /** 何日おくれているか（0なら今日が期限） */
  overdueDays: number;
}

/** 単元ごとの取り組み具合。正答率は出さない——数字の大小に目が向かないように。 */
export interface UnitProgress {
  app: AppCatalog;
  /** 一度でも取り組んだスキルの数 */
  touched: number;
  /** 5回連続ノーミスまで行ったスキルの数 */
  mastered: number;
  /** 復習の時期が来ている数 */
  due: number;
}

const DAY = 86400000;

export function useProgress(studentId: string | null) {
  const [rows, setRows] = useState<MySkillRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) { setRows([]); return; }
    setLoading(true); setError(null);
    const r = await fetchMyProgress(portalConfig, studentId);
    setLoading(false);
    if (r.ok) setRows(r.rows);
    else { setError(r.message); setRows([]); }
  }, [studentId]);

  useEffect(() => { void load(); }, [load]);
  return { rows, error, loading, reload: load };
}

/** 復習の時期が来たものを、おくれが大きい順に。同じ単元からは1件までにする。 */
export function toDueItems(rows: readonly MySkillRow[], limit = 6, now = Date.now()): DueItem[] {
  const seen = new Set<string>();
  const out: DueItem[] = [];
  for (const r of dueFromRows(rows, now)) {
    if (seen.has(r.app_id)) continue;
    const c = lookupSkill(r.app_id, r.skill_id);
    const app = CATALOGS[r.app_id];
    if (!c || !app) continue;          // カタログに無い記号は出さない（子どもに記号を見せない）
    seen.add(r.app_id);
    out.push({
      appId: r.app_id,
      appTitle: app.title,
      appUrl: app.url,
      subject: app.subject,
      skillId: r.skill_id,
      label: c.label,
      moduleTitle: c.module_title,
      overdueDays: Math.max(0, Math.floor((now - (r.next_due_ts ?? now)) / DAY)),
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** 単元ごとにまとめる。まだ手をつけていない単元も 0 として並べる。 */
export function toUnitProgress(rows: readonly MySkillRow[], grade: number, now = Date.now()): UnitProgress[] {
  const byApp = new Map<string, MySkillRow[]>();
  for (const r of rows) {
    if (!byApp.has(r.app_id)) byApp.set(r.app_id, []);
    byApp.get(r.app_id)!.push(r);
  }
  return Object.values(CATALOGS)
    .filter((a) => a.grade === grade)
    .map((app) => {
      const mine = byApp.get(app.app_id) ?? [];
      return {
        app,
        touched: mine.length,
        mastered: mine.filter((r) => r.perfect_streak >= 5).length,
        due: mine.filter((r) => r.next_due_ts != null && r.next_due_ts <= now).length,
      };
    })
    .sort((a, b) => a.app.subject.localeCompare(b.app.subject) || a.app.title.localeCompare(b.app.title));
}
