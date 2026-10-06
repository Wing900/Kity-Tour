import { useRef, type CSSProperties } from 'react'
import { folderGroups } from '../lib/chapters'
import { ScrollIndicator } from './ScrollIndicator'

interface SidebarProps {
  activeSlug: string
  onSelect: (slug: string) => void
  open: boolean
  onClose: () => void
}

const indexOf = (slug: string): number => {
  let i = 0
  for (const group of folderGroups) {
    for (const chapter of group.items) {
      i += 1
      if (chapter.slug === slug) return i
    }
  }
  return 0
}

export const Sidebar = ({ activeSlug, onSelect, open, onClose }: SidebarProps) => {
  const navRef = useRef<HTMLElement>(null)

  return (
  <>
    <div
      className={`rd-sidebar-scrim${open ? ' is-open' : ''}`}
      onClick={onClose}
      aria-hidden="true"
    />
    <aside className={`rd-sidebar${open ? ' is-open' : ''}`} aria-label="章节目录">
      <div className="rd-brand">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="rd-brand-logo" />
        <div className="rd-brand-text">
          <strong>PlotKityCat</strong>
          <span>教程</span>
        </div>
        <button type="button" className="rd-sidebar-close" onClick={onClose} aria-label="关闭目录">
          ×
        </button>
      </div>

      <div className="rd-sidebar-scroll">
        <nav className="rd-sidebar-nav" ref={navRef}>
          {folderGroups.map((group) => (
            <div className="rd-nav-group" key={group.folder}>
              <p className="rd-nav-group-title">{group.folder}</p>
              <ul className="rd-nav-list">
                {group.items.map((chapter) => (
                  <li key={chapter.slug}>
                    <button
                      type="button"
                      className={`rd-nav-item${chapter.slug === activeSlug ? ' is-active' : ''}`}
                      style={{ '--rd-nav-i': indexOf(chapter.slug) } as CSSProperties}
                      onClick={() => onSelect(chapter.slug)}
                    >
                      <span className="rd-nav-index">
                        {String(indexOf(chapter.slug)).padStart(2, '0')}
                      </span>
                      <span className="rd-nav-title">{chapter.meta.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <ScrollIndicator targetRef={navRef} />
      </div>
    </aside>
  </>
  )
}
