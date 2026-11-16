/**
 * SOL に まだ出さないアプリ（2026-11-16）。
 *
 * CAT-WARS（カタログ `catwars`・教科「ゲーム」）は記録を送るが、SOL にはまだ出さない
 * （単元の一覧・きょうの ふくしゅう・体験の入口・じぶんの きろく）。出すときは ここから外す。
 * SANMON（`sanmon`・同じ教科「ゲーム」）は今までどおり出す。
 */
export const NOT_ON_SOL: ReadonlySet<string> = new Set(['catwars']);

/** SOL に出してよいアプリか */
export const onSol = (appId: string): boolean => !NOT_ON_SOL.has(appId);
