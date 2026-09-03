import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { site } from './data'
import { resetInitialScroll } from './initialScroll'

resetInitialScroll({
  history: window.history,
  location: window.location,
  scrollTo: window.scrollTo.bind(window),
  onPageShow: (listener) => window.addEventListener('pageshow', listener, { once: true }),
})

document.title = site.meta.title
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', site.meta.description)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
