import { getSupabaseClient } from '../supabase/client.ts'

export interface ProblemListItem {
  id: string
  title: string
  difficulty: string
  tags: string[]
  supported_languages: string[]
  current_published_version_id: string | null
}

export async function getProblems(): Promise<ProblemListItem[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('problems')
    .select('id, title, difficulty, tags, supported_languages, current_published_version_id')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as ProblemListItem[]
}

export interface ProblemDetail {
  id: string
  title: string
  difficulty: string
  tags: string[]
  supported_languages: string[]
  current_published_version_id: string | null
}

export interface ProblemVersion {
  id: string
  problem_id: string
  version_number: number | null
  title: string
  difficulty: string
  tags: string[]
  supported_languages: string[]
  visible_test_count: number
  parsed_frontmatter: any
  mdx_storage_path: string
  content_hash: string
  status: string
  published_at: string | null
}

export async function getProblemAndVersion(
  problemId: string,
  versionId?: string
): Promise<{ problem: ProblemDetail; version: ProblemVersion; mdxContent: string }> {
  const supabase = getSupabaseClient()

  // 1. Get Problem
  const { data: problem, error: problemError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', problemId)
    .single()

  if (problemError || !problem) {
    throw new Error(problemError?.message || 'Problem not found')
  }

  // 2. Get Version
  const targetVersionId = versionId || problem.current_published_version_id
  if (!targetVersionId) {
    throw new Error('Problem has no published versions')
  }

  const { data: version, error: versionError } = await supabase
    .from('problem_versions')
    .select('*')
    .eq('id', targetVersionId)
    .single()

  if (versionError || !version) {
    throw new Error(versionError?.message || 'Version not found')
  }

  // 3. Get MDX from Storage
  const { data: mdxBlob, error: mdxError } = await supabase
    .storage
    .from('problem-mdx')
    .download(version.mdx_storage_path)

  if (mdxError || !mdxBlob) {
    throw new Error(mdxError?.message || 'Failed to download MDX content')
  }

  const mdxContent = await mdxBlob.text()

  return { problem: problem as ProblemDetail, version: version as ProblemVersion, mdxContent }
}
