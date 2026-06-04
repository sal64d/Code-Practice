import { parse as parseYaml } from 'yaml'

import type { ProblemRunnerFrontmatter } from '../runner/types.ts'

export interface ParsedMdxDocument {
  frontmatter: ProblemRunnerFrontmatter & {
    title: string
    difficulty: string
    tags: string[]
    supportedLanguages: string[]
  }
  body: string
}

export function getMdxBody(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)
  return match ? match[1].trimStart() : content
}

export function parseMdxDocument(content: string): ParsedMdxDocument {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('No YAML frontmatter found in MDX document')
  }

  const frontmatter = parseYaml(match[1]) as ParsedMdxDocument['frontmatter']
  if (!frontmatter?.title) {
    throw new Error('Frontmatter must include title')
  }

  return {
    frontmatter,
    body: match[2].trimStart(),
  }
}

export function getVisibleTestCount(frontmatter: ProblemRunnerFrontmatter): number {
  if (!frontmatter.tests) return 0
  if (Array.isArray(frontmatter.tests)) return frontmatter.tests.length
  return frontmatter.tests.visible?.length ?? 0
}
