import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { type ReactNode, useState } from 'react'

import { UsernameSessionProvider } from '../context/UsernameSessionProvider.tsx'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UsernameSessionProvider>{children}</UsernameSessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
