import { useState, useCallback } from 'react'
import { useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useProblemDetail } from '../hooks/useProblems.ts'
import { CodeEditor } from '../components/CodeEditor.tsx'
import { TestResultsPanel } from '../design-system/components/TestResultsPanel.tsx'
import { ProblemPageLayout } from '../design-system/layouts/ProblemPageLayout.tsx'
import { useRunner } from '../lib/runner/useRunner.ts'
import type { TestCase } from '../lib/runner/useRunner.ts'
import { commitSubmission } from '../lib/api/submissions.ts'

export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>()
  const { data, isLoading, error } = useProblemDetail(problemId || '')
  
  const [code, setCode] = useState('// Write your code here\n')
  const { runCode, isRunning, runSummary } = useRunner()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleRun = useCallback(async () => {
    if (!data?.version.parsed_frontmatter?.tests) return
    const tests: TestCase[] = data.version.parsed_frontmatter.tests
    await runCode(code, tests)
  }, [code, data, runCode])

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
          stdoutBytes: runSummary.stdoutBytes
        }
      })
      alert('Submission successful!')
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }, [code, data, runSummary])

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading problem...</div>
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error.message}</div>
  if (!data) return null

  const draftKey = `draft:${localStorage.getItem('usernameKey') || 'anon'}:${data.version.id}:javascript`

  return (
    <ProblemPageLayout
      title={data.problem.title}
      difficulty={data.problem.difficulty}
      versionNumber={data.version.version_number || 1}
      mdxContent={<ReactMarkdown remarkPlugins={[remarkGfm]}>{data.mdxContent}</ReactMarkdown>}
      editor={
        <CodeEditor 
          initialCode={code} 
          onChange={setCode} 
          draftKey={draftKey} 
          language="javascript" 
        />
      }
      results={<TestResultsPanel summary={runSummary} />}
      onRun={() => void handleRun()}
      onSubmit={() => void handleSubmit()}
      isRunning={isRunning}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  )
}
