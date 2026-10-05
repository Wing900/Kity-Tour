import { useCallback, useEffect, useState } from 'react'
import { chapters, findChapter } from './lib/chapters'
import { renderBlocks } from './components/Blocks'
import { Lightbox, type ZoomTarget } from './components/Lightbox'
import { ProgressBar } from './components/ProgressBar'
import { SectionDots } from './components/SectionDots'
import { Sidebar } from './components/Sidebar'
import { Reveal } from './components/Reveal'

const readSlugFromUrl = (): string => {
  const fromQuery = new URLSearchParams(window.location.search).get('c')
  return fromQuery && findChapter(fromQuery) ? fromQuery : chapters[0]?.slug ?? ''
}

export const ReaderApp = () => {
  const [activeSlug, setActiveSlug] = useState<string>(readSlugFromUrl)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [zoom, setZoom] = useState<ZoomTarget | null>(null)

  const chapter = findChapter(activeSlug) ?? chapters[0]

  useEffect(() => {
    if (!chapter) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('c') === chapter.slug) return
    params.set('c', chapter.slug)
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }, [chapter])

  const selectChapter = useCallback((slug: string) => {
    setActiveSlug(slug)
    setSidebarOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  const nextChapter = chapter
    ? chapters[chapters.findIndex((c) => c.slug === chapter.slug) + 1]
    : undefined

  if (!chapter) {
    return (
      <div className="rd-empty">
        <p>还没有章节内容。请在 src/content/chapters/ 下添加 Markdown 文件。</p>
      </div>
    )
  }

  const ctx = { onZoom: setZoom }

  return (
    <div className="rd-app">
      <ProgressBar />

      <Sidebar
        activeSlug={chapter.slug}
        onSelect={selectChapter}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="rd-topbar">
        <button
          type="button"
          className="rd-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="打开目录"
        >
          <span />
          <span />
          <span />
        </button>
        <span className="rd-topbar-kicker">{chapter.meta.folder}</span>
        <span className="rd-topbar-sep">/</span>
        <span className="rd-topbar-title">{chapter.meta.title}</span>
      </header>

      <main className="rd-main">
        <article className="rd-article" key={chapter.slug}>
          <header className="rd-hero">
            <p className="rd-hero-kicker">
              {chapter.meta.number ? `第 ${chapter.meta.number} 章` : '教程'}
              {chapter.meta.minutes ? ` · 约 ${chapter.meta.minutes} 分钟` : ''}
            </p>
            <h1 className="rd-hero-title">{chapter.meta.title}</h1>
            {chapter.meta.lead ? <p className="rd-hero-lead">{chapter.meta.lead}</p> : null}
          </header>

          {chapter.intro.length > 0 && (
            <div className="rd-intro">{renderBlocks(chapter.intro, ctx)}</div>
          )}

          {chapter.sections.map((section) => (
            <section className="rd-section" id={section.id} key={section.id}>
              <Reveal>
                <h2 className="rd-h2">
                  <span className="rd-h2-bar" aria-hidden="true" />
                  {section.title}
                </h2>
              </Reveal>
              {renderBlocks(section.blocks, ctx)}
            </section>
          ))}

          <footer className="rd-article-foot">
            {nextChapter ? (
              <button
                type="button"
                className="rd-next"
                onClick={() => selectChapter(nextChapter.slug)}
              >
                <span className="rd-next-label">下一章</span>
                <span className="rd-next-title">{nextChapter.meta.title}</span>
                <span className="rd-next-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ) : (
              <p className="rd-end">本教程到此结束。祝你在课堂上看见数学。</p>
            )}
          </footer>
        </article>
      </main>

      <SectionDots key={chapter.slug} sections={chapter.sections} />
      <Lightbox target={zoom} onClose={() => setZoom(null)} />
    </div>
  )
}
