// Open Sans: 400 for text, 600 for emphasis, 700 for page headings in forms (docs/DESIGN.md).
import '@fontsource/open-sans/latin-400.css'
import '@fontsource/open-sans/latin-ext-400.css'
import '@fontsource/open-sans/latin-600.css'
import '@fontsource/open-sans/latin-ext-600.css'
import '@fontsource/open-sans/latin-700.css'
import '@fontsource/open-sans/latin-ext-700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/sheet.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { prefetchConfig } from './lib/features'
import { AuthProvider } from './lib/auth.tsx'
import { initPreferences } from './lib/preferences'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
  },
})
prefetchConfig(queryClient)
initPreferences()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
