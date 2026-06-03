import { Link } from 'react-router'
import { useProblems } from '../hooks/useProblems.ts'

export function ProblemListPage() {
  const { data: problems, isLoading, error } = useProblems()

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading problems...</div>
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error loading problems: {error.message}</div>
  }

  if (!problems || problems.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Problems</h2>
        <p>No problems found. Did you run the seed script?</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Problem List</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem' }}>Title</th>
            <th style={{ padding: '0.5rem' }}>Difficulty</th>
            <th style={{ padding: '0.5rem' }}>Tags</th>
            <th style={{ padding: '0.5rem' }}>Languages</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>
                <Link to={`/problems/${p.id}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                  {p.title}
                </Link>
              </td>
              <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor:
                      p.difficulty === 'easy' ? '#e8f5e9' : p.difficulty === 'medium' ? '#fff3e0' : '#ffebee',
                    color:
                      p.difficulty === 'easy' ? '#2e7d32' : p.difficulty === 'medium' ? '#ef6c00' : '#c62828',
                  }}
                >
                  {p.difficulty}
                </span>
              </td>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.tags.map((t) => (
                    <span key={t} style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td style={{ padding: '0.5rem' }}>
                {p.supported_languages.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
