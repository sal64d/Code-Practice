export interface SupabasePublicEnv {
  url: string
  anonKey: string
}

export type SupabaseEnvError =
  | { kind: 'missing'; variables: string[] }
  | { kind: 'invalid_url'; variable: 'VITE_SUPABASE_URL' }

export type SupabaseEnvResult =
  | { ok: true; env: SupabasePublicEnv }
  | { ok: false; error: SupabaseEnvError }

const URL_VARIABLE = 'VITE_SUPABASE_URL'
const ANON_KEY_VARIABLES = [
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const

function readEnv(name: string): string | undefined {
  const value = import.meta.env[name]
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getSupabaseEnv(): SupabaseEnvResult {
  const url = readEnv(URL_VARIABLE)
  const anonKey =
    readEnv('VITE_SUPABASE_ANON_KEY') ??
    readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')

  const missing: string[] = []
  if (!url) {
    missing.push(URL_VARIABLE)
  }
  if (!anonKey) {
    missing.push(...ANON_KEY_VARIABLES)
  }

  if (missing.length > 0) {
    return { ok: false, error: { kind: 'missing', variables: missing } }
  }

  try {
    const parsed = new URL(url!)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        ok: false,
        error: { kind: 'invalid_url', variable: URL_VARIABLE },
      }
    }
  } catch {
    return {
      ok: false,
      error: { kind: 'invalid_url', variable: URL_VARIABLE },
    }
  }

  return {
    ok: true,
    env: {
      url: url!,
      anonKey: anonKey!,
    },
  }
}

export function formatSupabaseEnvError(error: SupabaseEnvError): string {
  if (error.kind === 'invalid_url') {
    return `${error.variable} must be a valid http(s) URL.`
  }

  const keyHint = ANON_KEY_VARIABLES.join(' or ')
  const listed = error.variables.join(', ')
  return `Missing required environment variables: ${listed}. Set ${URL_VARIABLE} and ${keyHint} in app/ui/.env.local (see .env.example).`
}
