/**
 * 先生がまだ開いていない単元（PRISM の SOL タブで学級ごとに決める。2026-10-26）。
 *
 * 閉じた単元は「たんげんを えらぶ」で 🔒 にし、「きょうの ふくしゅう」にも出さない（押しても アプリの中で止まるため）。
 * アプリ側でも kit の JoinGate が止めるので、ここは「押す前に分かる」ための表示。
 * 読めないときは 何も閉じない（学習を止めない）。SOL にもどってきたときに読みなおす（先生が授業中に開けたとき）。
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchClosedApps } from 'learning-app-kit/sync';
import { portalConfig } from './portal';

const NONE: ReadonlySet<string> = new Set();

export function useClosedApps(studentId: string | null): ReadonlySet<string> {
  const [closed, setClosed] = useState<ReadonlySet<string>>(NONE);
  const load = useCallback(async () => {
    if (!studentId) { setClosed(NONE); return; }
    const s = await fetchClosedApps(portalConfig, studentId);
    if (s) setClosed(s);
  }, [studentId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);
  return closed;
}
