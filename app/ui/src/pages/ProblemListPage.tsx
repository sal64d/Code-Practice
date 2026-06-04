import { useProblems } from '../hooks/useProblems.ts'
import { ProblemTable } from '../design-system/layouts/ProblemTable'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export function ProblemListPage() {
  const { data: problems, isLoading, error } = useProblems()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Error loading problems: {error.message}</Typography>
      </Box>
    )
  }

  return <ProblemTable problems={problems || []} />
}
