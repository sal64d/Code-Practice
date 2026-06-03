import {
  formatSupabaseEnvError,
  getSupabaseEnv,
} from '../lib/supabase/env.ts'

export function ConfigError() {
  const envResult = getSupabaseEnv()
  if (envResult.ok) {
    return null
  }

  return (
    <div className="config-error" role="alert">
      <h1>Configuration required</h1>
      <p>{formatSupabaseEnvError(envResult.error)}</p>
      <p className="config-error__hint">
        Copy <code>app/ui/.env.example</code> to <code>app/ui/.env.local</code> and
        fill in your Supabase project values. Never put service-role keys in Vite env
        files.
      </p>
    </div>
  )
}
