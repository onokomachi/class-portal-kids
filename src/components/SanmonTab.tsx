/**
 * SANMON タブ（4年のゲーム SANMON:04 の ようす）。2026-10 にホームから分けた。
 *
 * - 入口・スタミナ・町を開くまでのメーター（SanmonSection。前はホームの先頭にあった）
 * - スタミナの たまり方（サーバの _sanmon_stamina と同じきまり。SANMON の CLAUDE.md）
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
          <li>• 単元の アプリで 1問 正解すると 1（ふたりの時間は 半分）</li>
          <li>• 1つの 項目で 1日 5まで。もう「できた」になった 項目は 半分。いろいろな 項目や 苦手な ところで よく たまるよ</li>
          <li>• がんばりボーナス：本番テストで 8割 +5 ・ 実力の階段で あたらしい段 +3 ・ はじめて「できた」 +2</li>
          <li>• バトル 1回で 5 つかうよ（ためられるのは 100まで）</li>
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
