/**
 * SANMON:04（ゲーム）のスタミナと町の解放。
 *
 * きまり（どの町が開くか・スタミナの数）は learning-app-kit/sanmon にある。SANMON 本体も同じ関数で
 * 判定するので、ここで「ひらいた」と出た町は、SANMON でも必ず開いている。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSanmonStatus, sanmonUnits, type SanmonStatus } from 'learning-app-kit/sanmon';
import { CATALOGS } from 'learning-app-kit/catalog';
import { portalConfig } from './portal';

export const SANMON_URL = CATALOGS.sanmon?.url ?? 'https://syo4-battlemath04pokemon.vercel.app';

export function useSanmon(studentId: string | null) {
  const [status, setStatus] = useState<SanmonStatus | null>(null);
  const load = useCallback(async () => {
    if (!studentId) { setStatus(null); return; }
    const r = await fetchSanmonStatus(portalConfig, studentId);
    if (r.ok) setStatus(r.status);
  }, [studentId]);
  useEffect(() => { void load(); }, [load]);
  const units = useMemo(() => sanmonUnits(status), [status]);
  return { status, units, reload: load };
}
