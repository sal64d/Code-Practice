import { upsertProfile } from '../api/profiles.ts'
import { getSupabaseClient } from '../supabase/client.ts'

export async function ensureAnonymousAuthSession(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: sessionData } = await supabase.auth.getSession()

  if (sessionData.session) {
    return
  }

  const { error } = await supabase.auth.signInAnonymously()
  if (error) {
    throw new Error(error.message)
  }
}

export async function bootstrapUsernameSession(
  usernameKey: string,
  displayUsername: string,
): Promise<void> {
  await ensureAnonymousAuthSession()
  await upsertProfile(usernameKey, displayUsername)
}
