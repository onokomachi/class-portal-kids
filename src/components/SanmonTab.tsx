/**
 * SANMON タブ（4年のゲーム SANMON:04 の ようす）。2026-10 にホームから分けた。
 *
 * - 入口・スタミナ・町を開くまでのメーター（SanmonSection。前はホームの先頭にあった）
 * - スタミナの たまり方（サーバの _sanmon_pools と同じきまり。町のスタミナ＋共通スタミナ。SANMON の CLAUDE.md）
 * - モンスターの レベルの上限と「かけら」（learning-app-kit/sanmon の sanmonShards。SANMON と同じ関数）
 * 正答率や順位は出さない（くらべる相手は過去の自分だけ）。
 */
import { Gem, Zap } from 'lucide-react';
import type { StudentIdentity } from 'learning-app-kit/sync';
import { SANMON_GROWTH, sanmonShards, type SanmonStatus, type SanmonUnitProgress } from 'learning-app-kit/sanmon';
import { SanmonSection } from './SanmonSection';

export function SanmonTab({ student, status, units, onJoin }: {
  student: StudentIdentity | null;
  status: SanmonStatus | null;
  units: SanmonUnitProgress[];
  onJoin: () => void;
}) {
  const shards = sanmonShards(status);
  return (
    <>
      <SanmonSection student={student} status={status} units={units} onJoin={onJoin} />

      <section className="hud rounded-3xl p-4">
        <p className="font-black text-amber-200 text-sm inline-flex items-center gap-1.5"><Zap size={15} />スタミナの たまり方</p>
        <ul className="mt-2 space-y-1 text-[11px] text-emerald-100/80 leading-relaxed">
          <li>• スタミナは 2しゅるい。<b className="text-amber-200">町のスタミナ</b>と <b className="text-amber-200">共通スタミナ</b>（上の ⚡）</li>
          <li>• 町のスタミナ：単元の アプリで 1問 正解すると、その単元の 町に 1（ふたりの時間は 半分）。1つの 項目で 1日 5まで・もう「できた」の 項目は 半分。町ごとに 50まで。その町の ぼうけんで つかえるよ</li>
          <li>• 本番テスト（SANMON の テストも）：ぜんぶ（表と裏）で 100点まんてんなら 20、70％なら 14 が その単元の 町に たまる。表だけ・裏だけは その分。その日 1回目は ぜんぶ、2・3回目は 半分。ふたりの時間は なし</li>
          <li>• 実力の階段：のぼった 段 ×3 が その単元の 町に たまる（アプリごとに その日 1回目。2回目は 半分）。てっぺんに ついたあとも 毎日 もらえるよ</li>
          <li>• 共通スタミナ：がんばりボーナス（実力の階段で はじめての段 +3 ・ はじめて「できた」 +2）と、まとめの テスト。100まで。どこでも つかえるよ</li>
          <li>• アプリの ない 町（大きい数・折れ線グラフ・角）：SANMON の れんしゅう・ふくしゅうで 正解すると、その町に 1（1つの 項目で 1日 5まで）。SANMON の 本番テストも その町に たまるよ</li>
          <li>• スタミナに なるのは 4年の 算数だけ（国語・英語・5〜6年は ならないよ）</li>
          <li>• ぼうけんの バトル 1回で 5（町のスタミナ → 共通 の じゅん）。スピード・モンスター対戦・クラス対戦は 共通を つかうよ</li>
        </ul>
      </section>

      {student && (
        <section className="hud rounded-3xl p-4">
          <p className="font-black text-emerald-200 text-sm inline-flex items-center gap-1.5"><Gem size={15} />モンスターの レベルの じょうげん</p>
          <p className="text-[11px] text-emerald-100/70 mt-0.5 mb-3 leading-relaxed">
            その単元の アプリで 本番テスト8割の日（5日まで）や 実力の階段（半分・4分の3・てっぺん）で「かけら」が もらえるよ。
            かけら 1こで じょうげんが {SANMON_GROWTH.capPerShard} あがる（さいしょ {SANMON_GROWTH.baseCap}・いちばん上 {SANMON_GROWTH.maxCap}）。
            アプリの ない 単元は、SANMON の れんしゅうで もらえるよ。
          </p>
          <div className="grid gap-1.5">
            {shards.map((u) => (
              <div key={u.key} className="flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                <span className="min-w-0 flex-1 text-xs font-bold text-emerald-50 truncate">{u.name}</span>
                <span className="num text-[11px] text-amber-200 shrink-0 inline-flex items-center gap-0.5"><Gem size={11} />{u.shards}</span>
                <span className="num text-xs font-black text-emerald-300 shrink-0 w-16 text-right">Lv.{u.cap}まで</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
