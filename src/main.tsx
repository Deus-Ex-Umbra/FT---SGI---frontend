import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './lib/api'
import { instalarInterceptorFetch } from './lib/fetch-interceptor'

instalarInterceptorFetch({ apiBaseUrl: API_BASE_URL })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
