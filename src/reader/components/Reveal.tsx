import { useEffect, useRef, type ReactNode } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface RevealProps {
  children: ReactNode
  className?: string
  /** 进入视口前额外延迟，用于列表错峰 */
  delay?: number
}

/** 滚动揭示：进入视口后加 .is-in，动画交给 CSS，便于 prefers-reduced-motion 统一降级。 */
export const Reveal = ({ children, className = '', delay = 0 }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.classList.add('is-in')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          el.style.transitionDelay = delay ? `${delay}ms` : ''
          el.classList.add('is-in')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`rd-reveal ${className}`.trim()}>
      {children}
    </div>
  )
}
