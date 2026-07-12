import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearLegacyServiceWorkers } from './utils/clearLegacyServiceWorkers'

clearLegacyServiceWorkers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 首屏 splash 淡出：等 React 首帧 + 一帧，再触发 CSS opacity 过渡
const splash = document.getElementById('app-splash')
if (splash) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      splash.classList.add('is-hidden')
      const cleanup = () => splash.remove()
      splash.addEventListener('transitionend', cleanup, { once: true })
      window.setTimeout(cleanup, 1200)
    }),
  )
}