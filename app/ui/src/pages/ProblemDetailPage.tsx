import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { useProblemDetail } from '../hooks/useProblems.ts'
import { CodeEditor } from '../components/CodeEditor.tsx'
import { TestResultsPanel } from '../design-system/components/TestResultsPanel.tsx'
import { ProblemPageLayout } from '../design-system/layouts/ProblemPageLayout.tsx'
import { useRunner } from '../lib/runner/useRunner.ts'
import { commitSubmission } from '../lib/api/submissions.ts'
import { getStarterCode, normalizeTests, resolveRunnerConfig } from '../lib/runner/normalizeTests.ts'
import type { ProblemRunnerFrontmatter } from '../lib/runner/types.ts'

const FALLBACK_STARTER = '// Write your code here\n'

function VisibleTestsPreview({
  tests,
  mode,
}: {
  tests: Array<{ name?: string; inputDisplay: string; expectedDisplay: string }>
  mode: 'script' | 'function'
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Visible tests ({mode === 'function' ? 'function mode' : 'script mode'})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {tests.map((test, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {test.name ?? `Test ${index + 1}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Input
            </Typography>
            <Box component="pre" sx={{ m: 0, mb: 0.5, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {test.inputDisplay}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Expected {mode === 'function' ? 'result' : 'output'}
            </Typography>
            <Box component="pre" sx={{ m: 0, fontSize: '0.75rem' }}>
              {test.expectedDisplay}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>()
  const { data, isLoading, error } = useProblemDetail(problemId || '')

  const frontmatter = data?.version.parsed_frontmatter as ProblemRunnerFrontmatter | undefined
  const runner = useMemo(() => (frontmatter ? resolveRunnerConfig(frontmatter) : { mode: 'script' as const }), [frontmatter])
  const resolvedTests = useMemo(() => {
    if (!frontmatter) return []
    try {
      return normalizeTests(frontmatter)
    } catch {
      return []
    }
  }, [frontmatter])

  const starterCode = useMemo(
    () => (frontmatter ? getStarterCode(frontmatter, 'javascript') : undefined) ?? FALLBACK_STARTER,
    [frontmatter],
  )

  const [code, setCode] = useState('')
  const { runCode, isRunning, runSummary } = useRunner()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleRun = useCallback(async () => {
    if (!resolvedTests.length) return
    await runCode(code, {
      runner,
      signature: frontmatter?.signature,
      tests: resolvedTests,
    })
  }, [code, frontmatter?.signature, resolvedTests, runCode, runner])

  const handleSubmit = useCallback(async () => {
    if (!data || !runSummary) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const usernameKey = localStorage.getItem('usernameKey')
      if (!usernameKey) throw new Error('Not logged in')

      const submissionId = crypto.randomUUID()
      await commitSubmission({
        id: submissionId,
        username_key: usernameKey,
        problem_id: data.problem.id,
        problem_version_id: data.version.id,
        language: 'javascript',
        code_text: code,
        result: {
          passed: runSummary.passed,
          total: runSummary.total,
          durationMs: runSummary.durationMs,
          stdoutBytes: runSummary.stdoutBytes,
        },
      })
      alert('Submission successful!')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [code, data, runSummary])

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading problem...</div>
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</div>
  if (!data) return null

  const draftKey = `draft:${localStorage.getItem('usernameKey') || 'anon'}:${data.version.id}:javascript:${data.version.content_hash}`

  return (
    <ProblemPageLayout
      title={data.problem.title}
      difficulty={data.problem.difficulty}
      versionNumber={data.version.version_number || 1}
      mdxContent={
        <>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.mdxBody}</ReactMarkdown>
          {resolvedTests.length > 0 && (
            <VisibleTestsPreview tests={resolvedTests} mode={runner.mode} />
          )}
        </>
      }
      editor={
        <CodeEditor
          initialCode={starterCode}
          onChange={setCode}
          draftKey={draftKey}
          language="javascript"
        />
      }
      results={<TestResultsPanel summary={runSummary} mode={runner.mode} />}
      onRun={() => void handleRun()}
      onSubmit={() => void handleSubmit()}
      isRunning={isRunning}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  )
}
