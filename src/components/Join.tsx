/**
 * はじめの1回だけ、がっきゅうコードと出席番号を入れる画面。
 *
 * 氏名は聞かない。サーバにも氏名は無い。
 * 入れなくても各アプリへは行けるようにしてある——学級コードを忘れた子が
 * 学習そのものをあきらめることにならないように。
 */
import { useEffect, useState } from 'react';
import { resolveStudent, type StudentIdentity } from 'learning-app-kit/sync';
import { Loader2 } from 'lucide-react';
import { portalConfig } from '../lib/portal';

interface Props {
  onDone: (s: StudentIdentity) => void;
  /** 「あとで入れる」。PRISM の「ログイン必須」が入っているときは渡さない（ボタンを出さない） */
  onSkip?: () => void;
}

export function Join({ onDone, onSkip }: Props) {
  const [code, setCode] = useState('');
  const [num, setNum] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 入れまちがい（＝ほかの子の きろくになる）を減らすため、送る前に1回「これで いい？」
  const [confirming, setConfirming] = useState(false);

  // 動画のロゴを上（横長の画面では左）に寄せる（index.css の .on-join）。このあいだ「SOL」の文字は動画のロゴの円の中に入る
  useEffect(() => {
    document.body.classList.add('on-join');
    return () => document.body.classList.remove('on-join');
  }, []);

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
    <div className="join-page">
      {/* 動画のロゴの円の中の「SOL」。動画と同じ余白で動くので、いつも円の中に入る */}
      <div className="join-hero" aria-hidden><h1 className="sol-title">SOL</h1></div>

      <div className="join-wrap">
        <div className="join-panel">
          {confirming ? (
            <form onSubmit={submit} style={{ textAlign: 'center' }}>
              <p className="join-lead" style={{ fontSize: 15, color: '#eaf6ff' }}>これで いい？</p>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#8fb4d9', letterSpacing: '0.16em' }}>がっきゅうコード</p>
              <p className="join-big sol-glow" style={{ margin: '0 0 14px', fontSize: 26, color: '#fff', letterSpacing: '0.12em', wordBreak: 'break-all' }}>{code.trim()}</p>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#8fb4d9', letterSpacing: '0.16em' }}>しゅっせき番号</p>
              <p className="join-big sol-glow" style={{ margin: 0, fontSize: 48, lineHeight: 1.1, color: '#fff' }}>{num}</p>
              <p className="join-note" style={{ marginBottom: 18 }}>
                まちがえると、ほかの人の きろくに なってしまうよ。あとから かえるには せんせいの パスワードが いるよ。
              </p>
              <button type="submit" className="join-go">はい、はじめる</button>
              <button type="button" className="join-sub" onClick={() => setConfirming(false)}>なおす</button>
            </form>
          ) : (
            <form onSubmit={submit}>
              <p className="join-lead">はじめに、じぶんのことを おしえてね</p>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="code" className="join-label">がっきゅうコード</label>
                <input id="code" className="join-input" value={code} onChange={(e) => setCode(e.target.value)} required
                  placeholder="せんせいから きいてね" autoComplete="off" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="num" className="join-label">しゅっせき番号</label>
                <input id="num" className="join-input" type="number" inputMode="numeric" min={1} max={100} required
                  value={num} onChange={(e) => setNum(e.target.value)} placeholder="12" />
              </div>

              <button type="submit" className="join-go" disabled={busy}>
                {busy && <Loader2 size={18} className="animate-spin" />}はじめる
              </button>

              {error && <p className="join-err">{error}</p>}

              {onSkip ? (
                <button type="button" className="join-skip" onClick={onSkip}>あとで入れる（このまま つかう）</button>
              ) : (
                <p className="join-note">SOL は がっきゅうコードと しゅっせき番号を 入れて つかうよ。わからないときは せんせいに きいてね。</p>
              )}
              <p className="join-note" style={{ marginTop: onSkip ? 6 : 8 }}>なまえは きかないよ。「なんばんの人か」だけが きろくされるよ。</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
