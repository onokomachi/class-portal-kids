# SOL — 子ども用ハブ（class-portal-kids）

学級ポータルの一部。種類: **portal**。

## このアプリだけのこと

- 単元の一覧は Supabase の `apps` 表から出す。単元を足したら `apps` に1行足す（portal-connect スキル）。
- タブは3つ：ホーム（各アプリへ飛ぶ・きょうの ふくしゅう だけ）／SANMON（4年のときだけ。入口・スタミナ・町のメーター・かけら）／じぶんの きろく。
- 番号を変える（ヘッダーの「ばんごうを かえる」）には先生のパスワード（kit の `UnlockPrompt`。サーバの `verify_unlock`。PRISM で学級ごとに変えられる）。はじめに名乗るときは「これで いい？」を1回はさむ。
- テストの ○× は、日づけを押したときだけ読む（kit の `fetchMyTestDetail`＝サーバの `my_test_detail`。1回5KBほど）。
- 名前は **SOL**（2026-10 先生が決めた。先生用の PRISM と対：子どもが光を出し、PRISM がそれを分けて見る）。ロゴは `public/sol-logo.jpg`（起動画面）・`sol-mark.jpg`（ヘッダー・名乗りの画面）・`apple-touch-icon.png`。
  開くたびに PRISM と同じ起動画面（presented by onokomachi → ロゴ。`SplashScreen.tsx`）。配色はロゴの色（紺の地に水色・むらさき・ミント。`index.css`）。「SOL」の字は Michroma・白（`.sol-word`。Google Fonts）、マークは ふちどりなしの正方形、SANMON タブの中（`.theme-sanmon`）だけ緑と金。
- テストの × の問題には「アプリで『項目名』を れんしゅう」ボタン（アプリを開く。項目をじかに開く仕組みはまだ無いので項目名を出す）。
- **SANMON のスタミナは2しゅるい**（2026-11-09）：町のスタミナ（小4算数の単元アプリの正解・本番テストの点数ぶん・実力の階段でのぼった段ぶん・その町のぼうけんだけ・50まで。くわしい数は SANMON の CLAUDE.md と `2026-11-10-sanmon-balance.sql`）と共通スタミナ（がんばりボーナス＝はじめての段・熟達・100まで）。国語・英語・5〜6年はスタミナにならない（2026-11-10 23:15〜）。アプリの無い町（大きい数・折れ線グラフ・角）は SANMON の れんしゅう・ふくしゅうの正解でその町にたまる（2026-11-11〜）。SANMON タブのメーターは共通（kit の `SanmonStatus.stamina`）。**町のスタミナも SANMON タブに出す**（`SanmonSection` の「町の スタミナ」。多い順・0は出さない。2026-11-11。前は共通だけで、アプリの正解が見えず「増えていない」ように見えた）。町ごとの数は `towns`（kit 0699225 以降）。説明文は `SanmonTab.tsx`。
- **先生がまだ開いていない単元**（PRISM の SOL タブで学級ごと。kit の `fetchClosedApps`＝サーバの `my_closed_apps`）は「たんげんを えらぶ」の下に 🔒（押せない）、ふくしゅうにも出さない（`lib/useClosedApps.ts`）。アプリの中でも kit の JoinGate が止める。
- **ログイン必須**（2026-11-07。PRISM の管理タブのスイッチ＝`portal_settings.require_join`。kit の `loadPortalConfig`・`usePortalConfig`）：入っているときは名乗りの画面に「あとで入れる」を出さず、名乗るまでホームに進めない（`App.tsx` の `mustJoin`）。体験の入口（`#trial`）は名乗りなしのまま。
- **体験の入口**（2026-11-07。`components/TrialHub.tsx`）：`https://class-portal-kids.vercel.app/#trial`。名乗りは聞かず、PRISM の管理タブで「体験に出す」にしたアプリ（サーバの `trial_apps`）を学年ごとに並べ、`#trial` 付きで開く。
  並びはサーバの `trial_apps`（SANMON → 学年 → 算数・国語・外国語活動 → 年間の順＝`apps.year_order`。2026-11-08）。SANMON だけはいちばん上に、SANMON タブと同じ緑と金の大きなカード（`.theme-sanmon`）で出す。
  体験中のタブは kit の `isTrial()`（タブの中だけ覚える）。「たいけんを おわる」で ふつうの SOL にもどる。
- **背景の動画**（2026-11-07。`components/SolBackground.tsx`）：ロゴの輪が回る動画（音なし・約1.0MB。`videos/sol/bg4.*`。中央を切り出して大きく、前→逆の「振り子」の19秒ループ。折り返しで速さがゼロまで落ちてから逆に加速し、そこで少し明るく息をする。クロスフェード版・単純な往復版は、折り返しの切り替わりが目立つため やめた。作り方：元の8秒をコマの混ぜ合わせで時間をなめらかに進める）を、全画面の後ろの中央に（ロゴを切らない）。`mix-blend-mode: screen` で黒地は消えて今の背景に重なる。
  動画は共通の置き場 `learning-media`（`videos/sol/`。`src/lib/media.ts`）。SOL の `public/` に入れない（直すたびに保存されて Vercel の容量を使う）。置き場のファイルは上書きしない（変えるときは新しい名前で足す）。
  「動きを減らす」・データ節約のときは先頭の1枚だけ。読めないときは何も出さない。SANMON タブの中は出さない（`Hub` が body に `in-sanmon` を付ける）。
- **トップ画面（名乗りの画面）**（2026-11-07。`components/Join.tsx`・`index.css` の `.on-join` / `.join-*` / `.sol-title`）：背景の動画のロゴを上（横長の画面では左）に寄せ、**「SOL」の文字は動画のロゴの円の中**に重ねる。
  動画（`.sol-bg`）と文字（`.join-hero`）は同じ余白（`padding-bottom` / 横長は `padding-right`）で動かすので、文字はいつも円の中心に入る（文字の大きさは `--join-s` の約10％。円は動画の幅の約42％）。
  入力欄はすりガラスのパネル（`.join-panel`）。静止画のロゴは出さない（動画のロゴとダブるため）。`.sol-bg` は flex にすること（grid だと縦に伸びて上寄せになり、文字と中心がずれる）。
  **ホーム・体験の入口の背景にも「SOL」の文字**（2026-11-09 先生が案Aに決めた。`SolBackground` の `.sol-center`）：動画のロゴの円の中、カードの後ろ（`#root` の下）。カードのすき間・上のあきから見える。
  名乗りの画面のあいだは消し（`.on-join .sol-center`。自分の `.join-hero` があるため。位置は動画と同じ余白で動かす）、SANMON タブでは出さない（`.in-sanmon`）。
  ホームと体験の入口の上の帯は `.sol-header`（すりガラス＋光のふち）。
- きょうの ふくしゅう は、サーバの次の日（間をあけて繰り返す）で選び、教科を交互にまぜて並べる（`toDueItems`・`interleaveBySubject`）。はじめの3つを先に出す。

## 確かめ方
- `npm run check`（型チェック・ビルド・このアプリの自動チェック・学級ポータルのルール点検）
- 共通ファイルを kit の版にそろえる: `npx learning-app-kit-platform fix`

<!-- platform:begin（learning-app-kit が配る。手で書きかえない。直すときは kit の platform/CLAUDE.common.md） -->
## 学級ポータル共通のルール（learning-app-kit が配る。ここは手で書きかえない）

このリポジトリは、複数のアプリがつながった1つの仕組み（学級ポータル）の一部です。
1つのアプリだけを見て直すと、ほかのアプリ・先生用画面（PRISM）・データベースとずれます。

- **構成**: `learning-app-kit`（共通部品・記録の送信・カタログ・実力の階段）／単元アプリ（算数・国語）／
  `class-portal-teacher`（PRISM・先生用）／`class-portal-kids`（子ども用ハブ）／Supabase `gakkyu-portal`／
  `onokomachi-master-DB`（知識集）。
- **始めと終わり**: 作業の前に kb スキルで関係する知見を引く。直したこと・分かったことは最後に kb save で残す。
- **共通ファイルは、このリポジトリで直さない。** どれが共通ファイルかは `npm run platform` が教える。
  直すときは learning-app-kit の `platform/families/<種類>/files/` を直して kit の版を上げ、
  各アプリで kit を上げてから `npx learning-app-kit-platform fix` で配る（1つのアプリだけ直すと、直しが届かない）。
- **記録の名前（skillId）はカタログの skill_id と同じ文字列にする。** レベルIDがすでに `compare-basic` なら、
  前に何かを足さない。問題・レベルを足したり名前を変えたりしたら、カタログを作り直して kit に入れる（portal-connect スキル）。
- **送る記録の形・データベースの表・PRISM の画面に関わる変更**は、関係するリポジトリを全部つないだセッションで行う。
  単体のセッションで気づいたら、直さずに PR とユーザーへの報告に「全体セッションで直すこと」として書く。
- **kit はコミットのSHAで固定している。** 上げるときは `npx learning-app-kit-platform update` → `npm run check`。
- **新しいアプリは、作りはじめに `npx learning-app-kit-platform init <種類>`**（math / kokugo / portal / standalone）。
  CLAUDE.md・共通ファイル・CI・build 前の点検がそろう。そのあと CLAUDE.md の上の段にアプリだけのことを書く。
- 子どもの氏名は扱わない（出席番号だけ）。APIキー・トークン・パスワードはファイルにも知識集にも書かない。
- **終わる前に `npm run check` を通す**（このルールの点検 `npm run platform` も入っている）。
- PR の本文に「ほかのアプリ・PRISM・データベースへの影響」を1行書く（無ければ「なし」）。
- 毎週月曜の朝、各アプリの CI が kit を最新に上げ、`npm run check` が通れば main に自動で反映する（Vercel が本番に出す。持ち主の操作は要らない）。
  失敗のメールが来たら（kit の変更でアプリが通らない／CI の設定が変わる更新）、全体セッションで直す。
  kit の変更は、全アプリに月曜の朝いっせいに届く。kit の PR では「ほかのアプリへの影響」を必ず書く。
- Vercel の build の前にもこの点検が走る（`prebuild`）。ずれたままでは本番に出ない。
<!-- platform:end -->
