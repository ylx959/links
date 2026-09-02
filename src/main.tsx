import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { site } from './data'

document.title = site.meta.title
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', site.meta.description)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
