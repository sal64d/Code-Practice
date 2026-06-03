import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import 'dotenv/config'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// A simple frontmatter parser since we don't have gray-matter
function parseMDX(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error("No frontmatter found")
  
  const frontmatterText = match[1]
  const body = match[2]
  
  const titleMatch = frontmatterText.match(/title:\s*(.+)/)
  const difficultyMatch = frontmatterText.match(/difficulty:\s*(.+)/)
  
  const tagsStr = frontmatterText.match(/tags:\s*\[(.*?)\]/)
  const tags = tagsStr ? tagsStr[1].split(',').map(s => s.replace(/"/g, '').trim()) : []
  
  const langStr = frontmatterText.match(/supportedLanguages:\s*\[(.*?)\]/)
  const supportedLanguages = langStr ? langStr[1].split(',').map(s => s.replace(/"/g, '').trim()) : []

  const tests: any[] = []
  const testBlocks = frontmatterText.matchAll(/- stdin:\s*"([^"]+)"\n\s*expectedStdout:\s*"([^"]+)"/g)
  for (const block of testBlocks) {
    tests.push({
      stdin: block[1].replace(/\\n/g, '\n'),
      expectedStdout: block[2].replace(/\\n/g, '\n')
    })
  }

  const frontmatter = {
    title: titleMatch?.[1].trim() || "Untitled",
    difficulty: difficultyMatch?.[1].trim() || "easy",
    tags,
    supportedLanguages,
    tests
  }
  
  return { frontmatter, body }
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  // Sign in anonymously to pass RLS
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
  if (authError) {
    console.error("Auth error:", authError)
    process.exit(1)
  }
  
  // Upsert profile for the anon user to pass constraints
  const usernameKey = "seed-admin"
  await supabase.rpc('upsert_profile', {
    p_username_key: usernameKey,
    p_display_username: "Seed Admin"
  })

  const filePath = path.resolve(__dirname, '../../../practice_questions/001_array_two_sums.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  
  const { frontmatter, body } = parseMDX(content)
  const problemId = '001_array_two_sums'
  const problemVersionId = crypto.randomUUID()
  const contentHash = crypto.createHash('sha256').update(content).digest('hex')
  const storagePath = `${problemId}/${problemVersionId}/${contentHash}.mdx`

  console.log('Uploading MDX to storage...')
  const { error: uploadError } = await supabase
    .storage
    .from('problem-mdx')
    .upload(storagePath, content, { upsert: true, contentType: 'text/markdown' })
    
  if (uploadError) {
    console.error("Upload error:", uploadError)
    process.exit(1)
  }

  console.log('Inserting into problems...')
  const { error: problemError } = await supabase.from('problems').upsert({
    id: problemId,
    source_type: 'official_repo',
    title: frontmatter.title,
    difficulty: frontmatter.difficulty,
    tags: frontmatter.tags,
    supported_languages: frontmatter.supportedLanguages,
    created_by_username_key: usernameKey
  })

  if (problemError) {
    console.error("Problem error:", problemError)
    process.exit(1)
  }

  console.log('Inserting into problem_versions...')
  const { error: versionError } = await supabase.from('problem_versions').insert({
    id: problemVersionId,
    problem_id: problemId,
    title: frontmatter.title,
    difficulty: frontmatter.difficulty,
    tags: frontmatter.tags,
    supported_languages: frontmatter.supportedLanguages,
    visible_test_count: frontmatter.tests.length,
    parsed_frontmatter: frontmatter,
    mdx_storage_path: storagePath,
    content_hash: contentHash,
    status: 'published',
    version_number: 1,
    created_by_username_key: usernameKey
  })

  if (versionError) {
    console.error("Version error:", versionError)
    process.exit(1)
  }
  
  console.log('Updating problem current_published_version_id...')
  await supabase.from('problems').update({
    current_published_version_id: problemVersionId
  }).eq('id', problemId)

  console.log('Seeding complete!')
}

main()
