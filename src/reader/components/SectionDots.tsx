import { useEffect, useState } from 'react'
import type { Section } from '../lib/chapters'

interface SectionDotsProps {
  sections: Section[]
}

/**
 * 右侧节导航：滚动到哪一节，圆点亮到哪。
 * 章节切换由父层以 key 重挂载，故初始态直接用第一节即可，无需在 effect 里回写 state。
 */
export const SectionDots = ({ sections }: SectionDotsProps) => {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    if (!sections.length) return
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 2) return null

  return (
    <nav className="rd-dots" aria-label="本节导航">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`rd-dot${section.id === activeId ? ' is-active' : ''}`}
          title={section.title}
          aria-label={section.title}
        >
          <span className="rd-dot-tip">{section.title}</span>
        </a>
      ))}
    </nav>
  )
}
