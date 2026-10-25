/**
 * はじめの1回だけ、がっきゅうコードと出席番号を入れる画面。
 *
 * 氏名は聞かない。サーバにも氏名は無い。
 * 入れなくても各アプリへは行けるようにしてある——学級コードを忘れた子が
 * 学習そのものをあきらめることにならないように。
 */
import { useState } from 'react';
import { resolveStudent, type StudentIdentity } from 'learning-app-kit/sync';
import { School, Loader2 } from 'lucide-react';
import { portalConfig } from '../lib/portal';

interface Props {
  onDone: (s: StudentIdentity) => void;
  onSkip: () => void;
}

export function Join({ onDone, onSkip }: Props) {
  const [code, setCode] = useState('');
  const [num, setNum] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 入れまちがい（＝ほかの子の きろくになる）を減らすため、送る前に1回「これで いい？」
  const [confirming, setConfirming] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirming) { setError(null); setConfirming(true); return; }
    setConfirming(false);
    setBusy(true); setError(null);
    const r = await resolveStudent(portalConfig, code, Number(num));
    setBusy(false);
    if (r.ok) onDone(r.student);
    else setError(r.message);
  };

  return (
    <div className="min-h-screen grid place-items-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-grid place-items-center w-16 h-16 rounded-3xl bg-sky-500 text-white mb-3">
            <School size={30} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-[0.2em]">SOL</h1>
          <p className="text-sm text-slate-500 mt-1">はじめに、じぶんのことを おしえてね</p>
        </div>

        {confirming ? (
          <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-center">
            <p className="text-lg font-black text-slate-800">これで いい？</p>
            <p className="text-base text-slate-700">
              がっきゅうコード <b>{code.trim()}</b> の <b className="text-2xl text-sky-600">{num}</b> ばん
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              まちがえると、ほかの人の きろくに なってしまうよ。あとから かえるには せんせいの パスワードが いるよ。
            </p>
            <button type="submit" className="w-full rounded-xl bg-sky-500 text-white font-black py-3.5 text-base hover:bg-sky-600">
              はい、はじめる
            </button>
            <button type="button" onClick={() => setConfirming(false)}
              className="w-full rounded-xl ring-1 ring-slate-200 text-slate-600 font-bold py-3 text-sm">
              なおす
            </button>
          </form>
        ) : (
        <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-slate-700 mb-1.5">
              がっきゅうコード
            </label>
            <input
              id="code" value={code} onChange={(e) => setCode(e.target.value)} required
              placeholder="せんせいから きいてね"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base
                         focus:outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label htmlFor="num" className="block text-sm font-bold text-slate-700 mb-1.5">
              しゅっせき番号
            </label>
            <input
              id="num" type="number" inputMode="numeric" min={1} max={100} required
              value={num} onChange={(e) => setNum(e.target.value)} placeholder="12"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base
                         focus:outline-none focus:border-sky-400"
            />
          </div>

          <button
            type="submit" disabled={busy}
            className="w-full rounded-xl bg-sky-500 text-white font-black py-3.5 text-base
                       flex items-center justify-center gap-2
                       hover:bg-sky-600 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {busy && <Loader2 size={18} className="animate-spin" />}
            はじめる
          </button>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            なまえは きかないよ。「なんばんの人か」だけが きろくされるよ。
          </p>
        </form>
        )}

        <button onClick={onSkip}
          className="w-full mt-3 text-sm text-slate-500 underline underline-offset-4 py-2">
          あとで入れる（このまま つかう）
        </button>
      </div>
    </div>
  );
}
