import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SiteProvider } from './site/SiteContext.jsx'

const root = document.getElementById('root')
const contentNode = document.getElementById('site-content')
const initialContent = contentNode ? JSON.parse(contentNode.textContent) : undefined
const application = (
  <StrictMode>
    <BrowserRouter>
      <SiteProvider initialContent={initialContent}><App /></SiteProvider>
    </BrowserRouter>
  </StrictMode>
)

if (root.hasChildNodes()) hydrateRoot(root, application)
else createRoot(root).render(application)
