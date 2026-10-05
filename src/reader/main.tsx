import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/reader.css'
import { ReaderApp } from './ReaderApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReaderApp />
  </StrictMode>,
)

// splash 淡出：等 React 首帧 + 一帧再触发过渡
const splash = document.getElementById('reader-splash')
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
