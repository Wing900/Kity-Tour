import type { ReactNode } from 'react'
import type { Block, Inline } from '../lib/markdown'
import { resolveAsset } from '../lib/asset'
import { Media } from './Media'
import type { ZoomTarget } from './Lightbox'
import { Reveal } from './Reveal'

interface RenderContext {
  onZoom: (target: ZoomTarget) => void
}

const renderInline = (inlines: Inline[], key: string): ReactNode[] =>
  inlines.map((inline, index) => {
    const id = `${key}-${index}`
    switch (inline.type) {
      case 'text':
        return inline.value
      case 'strong':
        return <strong key={id}>{inline.value}</strong>
      case 'em':
        return <em key={id}>{inline.value}</em>
      case 'code':
        return (
          <code className="rd-inline-code" key={id}>
            {inline.value}
          </code>
        )
      case 'link':
        return (
          <a key={id} className="rd-link" href={inline.href} target="_blank" rel="noreferrer">
            {inline.label}
          </a>
        )
      case 'image':
        return (
          <img
            key={id}
            className="rd-inline-image"
            src={resolveAsset(inline.src)}
            alt={inline.alt}
            loading="lazy"
          />
        )
    }
  })

/** 块级渲染。heading level>=3 才在此处理，level 2 由长卷分节承担。 */
export const renderBlock = (block: Block, index: number, ctx: RenderContext): ReactNode => {
  const key = `b-${index}`
  switch (block.type) {
    case 'heading': {
      const content = renderInline(block.inlines, key)
      return block.level <= 3 ? (
        <h3 key={key} className="rd-h3">
          {content}
        </h3>
      ) : (
        <h4 key={key} className="rd-h4">
          {content}
        </h4>
      )
    }
    case 'paragraph':
      return (
        <Reveal key={key}>
          <p className="rd-p">{renderInline(block.inlines, key)}</p>
        </Reveal>
      )
    case 'list':
      return (
        <Reveal key={key}>
          {block.ordered ? (
            <ol className="rd-list">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ol>
          ) : (
            <ul className="rd-list">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ul>
          )}
        </Reveal>
      )
    case 'quote':
      return (
        <Reveal key={key}>
          <blockquote className="rd-quote">{renderInline(block.inlines, key)}</blockquote>
        </Reveal>
      )
    case 'code':
      return (
        <Reveal key={key}>
          <pre className="rd-code" data-lang={block.lang || undefined}>
            <code>{block.value}</code>
          </pre>
        </Reveal>
      )
    case 'media':
      return (
        <Media
          key={key}
          kind={block.kind}
          src={block.src}
          poster={block.poster}
          alt={block.alt}
          caption={block.caption}
          onZoom={ctx.onZoom}
        />
      )
    case 'hr':
      return <hr key={key} className="rd-hr" />
  }
}

export const renderBlocks = (blocks: Block[], ctx: RenderContext): ReactNode =>
  blocks.map((block, index) => renderBlock(block, index, ctx))
