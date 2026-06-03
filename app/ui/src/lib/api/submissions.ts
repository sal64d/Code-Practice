import { getSupabaseClient } from '../supabase/client.ts'

export interface SubmissionInput {
  id: string
  username_key: string
  problem_id: string
  problem_version_id: string
  language: 'javascript' | 'php'
  code_text: string
  result: {
    passed: number
    total: number
    durationMs: number
    stdoutBytes: number
  }
}

export async function commitSubmission(input: SubmissionInput) {
  const supabase = getSupabaseClient()
  
  // 1. Upload code snapshot
  const codeStoragePath = `${input.problem_id}/${input.problem_version_id}/${input.id}.txt`
  
  const { error: uploadError } = await supabase
    .storage
    .from('submission-code')
    .upload(codeStoragePath, input.code_text, { contentType: 'text/plain', upsert: true })

  if (uploadError) {
    throw new Error(`Failed to upload code: ${uploadError.message}`)
  }

  // 2. Call commit_submission RPC
  const code_preview = input.code_text.substring(0, 500)
  
  const payload = {
    id: input.id,
    username_key: input.username_key,
    problem_id: input.problem_id,
    problem_version_id: input.problem_version_id,
    language: input.language,
    code_storage_path: codeStoragePath,
    code_preview,
    result: input.result
  }

  const { data, error: rpcError } = await supabase.rpc('commit_submission', { input: payload })

  if (rpcError) {
    throw new Error(`Failed to commit submission: ${rpcError.message}`)
  }

  return data
}
