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

/**
 * 復習の時期が来たもの（間隔をあけて繰り返す：サーバの next_due_ts）。
 *
 * - 同じ単元からは1件まで、おくれが大きいものから選ぶ。
 * - **ならべ方は教科・単元をまぜる**（交互練習。同じ種類を続けるより、まぜて解くほうが力がつく：
 *   Brunmair & Richter 2019 のメタ分析、算数で効果が大きい）。教科ごとの列から、おくれの大きい順に1つずつ交互に取り出す。
 * 画面は はじめの3つを「きょうの 3つ」として出し、のこりは開いて見る。
 */
export function toDueItems(rows: readonly MySkillRow[], limit = 6, now = Date.now()): DueItem[] {
  const seen = new Set<string>();
  const picked: DueItem[] = [];
  for (const r of dueFromRows(rows, now)) {
    if (seen.has(r.app_id)) continue;
    const c = lookupSkill(r.app_id, r.skill_id);
    const app = CATALOGS[r.app_id];
    if (!c || !app) continue;          // カタログに無い記号は出さない（子どもに記号を見せない）
    seen.add(r.app_id);
    picked.push({
      appId: r.app_id,
      appTitle: app.title,
      appUrl: app.url,
      subject: app.subject,
      skillId: r.skill_id,
      label: c.label,
      moduleTitle: c.module_title,
      overdueDays: Math.max(0, Math.floor((now - (r.next_due_ts ?? now)) / DAY)),
    });
  }
  return interleaveBySubject(picked).slice(0, limit);
}

/** 教科ごとの列（中は元の順＝おくれの大きい順）から、1つずつ交互に取り出す。先頭はいちばんおくれている教科 */
export function interleaveBySubject<T extends { subject: string }>(items: readonly T[]): T[] {
  const queues = new Map<string, T[]>();
  for (const it of items) {
    if (!queues.has(it.subject)) queues.set(it.subject, []);
    queues.get(it.subject)!.push(it);
  }
  const lists = [...queues.values()];
  const out: T[] = [];
  for (let i = 0; out.length < items.length; i++) {
    for (const l of lists) if (l[i]) out.push(l[i]!);
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
    // SANMON（subject「ゲーム」）は単元ではないので、ここには並べない（ホームの上に専用の入口がある）
    .filter((a) => a.grade === grade && a.subject !== 'ゲーム')
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
