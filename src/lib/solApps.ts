/**
 * SOL の一覧に まだ出さないアプリ（2026-11-16）。
 *
 * CAT-WARS（カタログ `catwars`・教科「ゲーム」）は記録を送るが、**じぶんの きろく・きょうの ふくしゅう・単元の一覧には出さない**
 * （記録は「CAT-WARS」という単元のように見えてしまう。ふくしゅうや項目の練習は 単元アプリで するもの。SANMON は今までどおり出す）。
 * 2026-11-16 CW-5c から、CAT-WARS の入口は **SANMON タブ**（components/CatwarsCard.tsx。スタミナが SANMON と共通のため）と
 * **体験の入口**（components/TrialHub.tsx。先生が PRISM で「体験に出す」にしたときだけ）に出す。この2か所は onSol を見ない。
 * 一覧に出すときは ここから外す。
 */
export const NOT_ON_SOL: ReadonlySet<string> = new Set(['catwars']);

/** SOL の一覧（じぶんの きろく・ふくしゅう・単元の一覧）に出してよいアプリか */
export const onSol = (appId: string): boolean => !NOT_ON_SOL.has(appId);
