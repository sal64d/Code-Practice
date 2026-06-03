import { useQuery } from '@tanstack/react-query'
import { getProblems, getProblemAndVersion } from '../lib/api/problems.ts'

export function useProblems() {
  return useQuery({
    queryKey: ['problems'],
    queryFn: getProblems,
  })
}

export function useProblemDetail(problemId: string, versionId?: string) {
  return useQuery({
    queryKey: ['problemDetail', problemId, versionId],
    queryFn: () => getProblemAndVersion(problemId, versionId),
    enabled: !!problemId,
  })
}
