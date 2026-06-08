import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import 'dotenv/config'
import { fileURLToPath } from 'url'

import { getVisibleTestCount, parseMdxDocument } from '../src/lib/mdx/parseFrontmatter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OFFICIAL_VERSION_NUMBER = 1

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const { error: authError } = await supabase.auth.signInAnonymously()
  if (authError) {
    console.error('Auth error:', authError)
    process.exit(1)
  }

  const usernameKey = 'seed-admin'
  await supabase.rpc('upsert_profile', {
    p_username_key: usernameKey,
    p_display_username: 'Seed Admin',
  })

  const problemsDir = path.resolve(__dirname, '../../../practice_questions')
  const problemFiles = fs
    .readdirSync(problemsDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()

  if (problemFiles.length === 0) {
    console.error(`No problem files found in ${problemsDir}`)
    process.exit(1)
  }

  async function seedProblem(filePath: string, problemId: string) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { frontmatter } = parseMdxDocument(content)
    const contentHash = crypto.createHash('sha256').update(content).digest('hex')

    const { data: existingVersion, error: existingVersionError } = await supabase
      .from('problem_versions')
      .select('id, content_hash')
      .eq('problem_id', problemId)
      .eq('version_number', OFFICIAL_VERSION_NUMBER)
      .maybeSingle()

    if (existingVersionError) {
      console.error(`Failed to look up existing version for ${problemId}:`, existingVersionError)
      process.exit(1)
    }

    const problemVersionId = existingVersion?.id ?? crypto.randomUUID()
    const storagePath = `${problemId}/${problemVersionId}/${contentHash}.mdx`

    console.log(`Uploading MDX for ${problemId} to storage...`)
    const { error: uploadError } = await supabase.storage
      .from('problem-mdx')
      .upload(storagePath, content, { upsert: true, contentType: 'text/markdown' })

    if (uploadError) {
      console.error(`Upload error for ${problemId}:`, uploadError)
      process.exit(1)
    }

    console.log(`Upserting problem ${problemId}...`)
    const { error: problemError } = await supabase.from('problems').upsert({
      id: problemId,
      source_type: 'official_repo',
      title: frontmatter.title,
      difficulty: frontmatter.difficulty,
      tags: frontmatter.tags,
      supported_languages: frontmatter.supportedLanguages,
      created_by_username_key: usernameKey,
    })

    if (problemError) {
      console.error(`Problem error for ${problemId}:`, problemError)
      process.exit(1)
    }

    const versionPayload = {
      problem_id: problemId,
      title: frontmatter.title,
      difficulty: frontmatter.difficulty,
      tags: frontmatter.tags,
      supported_languages: frontmatter.supportedLanguages,
      visible_test_count: getVisibleTestCount(frontmatter),
      parsed_frontmatter: frontmatter,
      mdx_storage_path: storagePath,
      content_hash: contentHash,
      status: 'published' as const,
      version_number: OFFICIAL_VERSION_NUMBER,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existingVersion) {
      console.log(
        existingVersion.content_hash === contentHash
          ? `Refreshing ${problemId} official version 1 (content unchanged)...`
          : `Updating ${problemId} official version 1 with new content...`,
      )
      const { error: versionError } = await supabase
        .from('problem_versions')
        .update(versionPayload)
        .eq('id', existingVersion.id)

      if (versionError) {
        console.error(`Version update error for ${problemId}:`, versionError)
        process.exit(1)
      }
    } else {
      console.log(`Inserting ${problemId} official version 1...`)
      const { error: versionError } = await supabase.from('problem_versions').insert({
        id: problemVersionId,
        ...versionPayload,
        created_by_username_key: usernameKey,
      })

      if (versionError) {
        console.error(`Version insert error for ${problemId}:`, versionError)
        process.exit(1)
      }
    }

    console.log(`Ensuring ${problemId} current_published_version_id points at version 1...`)
    const { error: publishError } = await supabase
      .from('problems')
      .update({ current_published_version_id: problemVersionId })
      .eq('id', problemId)

    if (publishError) {
      console.error(`Publish pointer error for ${problemId}:`, publishError)
      process.exit(1)
    }
  }

  for (const fileName of problemFiles) {
    const filePath = path.join(problemsDir, fileName)
    const problemId = path.basename(fileName, path.extname(fileName))
    await seedProblem(filePath, problemId)
  }

  console.log(`Seeding complete! ${problemFiles.length} problem(s) processed.`)
}

main()
