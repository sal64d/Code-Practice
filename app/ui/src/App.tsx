import { AppProviders } from './providers/AppProviders.tsx'
import { AppRoutes } from './routes/AppRoutes.tsx'
import './App.css'

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
