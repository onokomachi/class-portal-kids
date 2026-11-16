/**
 * CAT-WARS（小4算数のごほうびゲーム）の入口のための 開け閉め（2026-11-16 CW-5c）。
 *
 * - 開け閉めは SANMON と同じしくみの鍵 `catwars`（先生が PRISM の SANMON タブで学級ごとに開ける。**はじめは閉じている**）。
 *   平日モード（授業の時間）・番号ごとの停止も効く。判定は kit の isModeOpen／modeLockMessage（サーバの sanmon_modes が返した値）。
 * - 読むのは SANMON タブを開いたとき と、SOL に もどってきたとき（タブが見えるようになったとき）だけ（通信を増やしすぎない）。
 * - 読めないとき（通信が切れた）は 押せる形にして CAT-WARS に まかせる（CAT-WARS の出撃の関門が 同じ鍵で止める）。
 */
import { useCallback, useEffect, useState } from 'react';
import { CATALOGS } from 'learning-app-kit/catalog';
import { fetchSanmonModes, modeLockMessage, type SanmonModes } from 'learning-app-kit/sanmon';
import { portalConfig } from './portal';

/** CAT-WARS のアドレス（kit のカタログ catwars の url＝apps.url。古い kit では url が無いので 同じ値を書いておく） */
export const CATWARS_URL = (CATALOGS.catwars as { url?: string } | undefined)?.url ?? 'https://battlemath04catwars.vercel.app';

/** 番号ごとの停止（PRISM で先生が番号を押す。サーバの sanmon_modes が _student_lock を付ける）の文。理由は出さない（SANMON・CAT-WARS と同じ） */
export const STUDENT_LOCK_MESSAGE = 'せんせいと おはなししてね';

/**
 * 入口に出す わけ（開いていれば null）。
 * 番号ごとの停止 →「せんせいと おはなししてね」／授業の時間 →「いまは じゅぎょうの じかん。…」／先生が まだ →「先生が まだ ひらいていないよ」
 */
export function catwarsLock(modes: SanmonModes | null | undefined): string | null {
  const msg = modeLockMessage(modes, 'catwars');
  if (!msg) return null;
  if ((modes as (SanmonModes & { _student_lock?: boolean }) | null | undefined)?._student_lock === true) return STUDENT_LOCK_MESSAGE;
  return msg;
}

/** 'loading'＝まだ読んでいる／'offline'＝読めなかった（CAT-WARS に まかせる）／それ以外＝読めた開け閉め */
export type CatwarsModesState = 'loading' | 'offline' | SanmonModes;

export function useCatwarsModes(studentId: string | null): CatwarsModesState {
  const [state, setState] = useState<CatwarsModesState>('loading');
  const load = useCallback(async () => {
    if (!studentId) { setState('offline'); return; }
    const r = await fetchSanmonModes(portalConfig, studentId);
    setState((prev) => (r.ok ? r.modes : prev === 'loading' ? 'offline' : prev));
  }, [studentId]);
  // SANMON タブを開いたとき（このフックを使う部品が出たとき）に読む
  useEffect(() => { setState('loading'); void load(); }, [load]);
  // SOL に もどってきたとき（先生が授業中に開けた・授業の時間が おわった）に読みなおす
  useEffect(() => {
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);
  return state;
}
