/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /**
   * publishable key（公開前提のキー）。
   * secret key / service_role key は絶対に入れない。ここはクライアントに焼き込まれる。
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
