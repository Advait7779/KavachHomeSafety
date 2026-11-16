import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { SiteProvider } from './site/SiteContext.jsx'

export function render(url, content) {
  return renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}>
        <SiteProvider initialContent={content}><App /></SiteProvider>
      </MemoryRouter>
    </StrictMode>,
  )
}
