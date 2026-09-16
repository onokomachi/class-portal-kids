/**
 * 学級ポータルへの接続設定。
 *
 * 使うのは publishable key だけ。この画面でできるのは
 * 「自分の名乗りを解決する」と「自分の記録を読む」の2つだけで、
 * 他人のデータには手が届かない（サーバ側で閉じてある）。
 */
function env(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'): string | undefined {
  return (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
}

export const portalConfig = {
  supabaseUrl: env('VITE_SUPABASE_URL'),
  supabaseKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
};

export const isConfigured = !!(portalConfig.supabaseUrl && portalConfig.supabaseKey);
