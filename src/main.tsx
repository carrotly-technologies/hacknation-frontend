// Open Sans: 400 for text, 600 for emphasis, 700 for page headings in forms (docs/DESIGN.md).
import '@fontsource/open-sans/latin-400.css'
import '@fontsource/open-sans/latin-ext-400.css'
import '@fontsource/open-sans/latin-600.css'
import '@fontsource/open-sans/latin-ext-600.css'
import '@fontsource/open-sans/latin-700.css'
import '@fontsource/open-sans/latin-ext-700.css'
// Tinos (metric-compatible with Times New Roman): the sheet document only (src/styles/sheet.css).
import '@fontsource/tinos/latin-400.css'
import '@fontsource/tinos/latin-ext-400.css'
import '@fontsource/tinos/latin-700.css'
import '@fontsource/tinos/latin-ext-700.css'
import '@fontsource/tinos/latin-400-italic.css'
import '@fontsource/tinos/latin-ext-400-italic.css'
import '@fontsource/tinos/latin-700-italic.css'
import '@fontsource/tinos/latin-ext-700-italic.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/sheet.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { AuthProvider } from './lib/auth.tsx'
import { initPreferences } from './lib/preferences'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
  },
})
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
