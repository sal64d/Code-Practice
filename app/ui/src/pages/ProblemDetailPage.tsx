import { useState, useCallback } from 'react'
import { useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useProblemDetail } from '../hooks/useProblems.ts'
import { CodeEditor } from '../components/CodeEditor.tsx'
import { TestResults } from '../components/TestResults.tsx'
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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left Pane: MDX */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: '1px solid #ccc', backgroundColor: '#fafafa' }}>
        <h1 style={{ marginTop: 0 }}>{data.problem.title}</h1>
        <div style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#666' }}>
          Version: {data.version.version_number} | Difficulty: {data.problem.difficulty}
        </div>
        
        <div className="mdx-content" style={{ lineHeight: '1.6' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.mdxContent}</ReactMarkdown>
        </div>
      </div>

      {/* Right Pane: Editor & Runner */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', backgroundColor: '#f0f0f0', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleRun} 
            disabled={isRunning}
            style={{ padding: '0.5rem 1rem', background: '#2196f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer' }}
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
          
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !runSummary}
            style={{ padding: '0.5rem 1rem', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: (!runSummary || isSubmitting) ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          
          {submitError && <span style={{ color: 'red', alignSelf: 'center' }}>{submitError}</span>}
        </div>
        
        <CodeEditor 
          initialCode={code} 
          onChange={setCode} 
          draftKey={draftKey} 
          language="javascript" 
        />
        
        <div style={{ height: '40%', borderTop: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
          <TestResults summary={runSummary} />
        </div>
      </div>
    </div>
  )
}
