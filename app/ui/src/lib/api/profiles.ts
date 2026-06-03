import { getSupabaseClient } from '../supabase/client.ts'
import type { ProfileRow } from '../../types/database.ts'

export async function upsertProfile(
  usernameKey: string,
  displayUsername: string,
): Promise<ProfileRow> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('upsert_profile', {
    username_key: usernameKey,
    display_username: displayUsername,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Profile upsert returned no data.')
  }

  return data
}
