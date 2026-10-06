/**
 * 轻量 Markdown 子集解析器 —— 零依赖、纯函数。
 *
 * 为什么自己写：本项目不允许未经审批新增依赖，而阅读器需要把内容源
 * 保持为「真 Markdown 文件」（便于后续人工编辑）。故只实现教程实际用到的子集：
 *   标题 / 段落 / 无序·有序列表 / 引用 / 围栏代码 / 分隔线 / 整行图片 / 行内强调与链接。
 *
 * 不支持的语法（刻意）：表格、脚注、HTML 直插、嵌套列表 —— 需要时再加，不做投机实现。
 */

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; label: string }
  | { type: 'image'; src: string; alt: string }

export type Block =
  | { type: 'heading'; level: number; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'code'; lang: string; value: string }
  | { type: 'media'; kind: 'image' | 'video'; src: string; poster?: string; alt: string; caption: string }
  | { type: 'hr' }

export interface Frontmatter {
  number: string
  folder: string
  title: string
  lead: string
  minutes: string
  order: string
}

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/

/** 段落内的软换行：中日韩之间不加空格，其余按英文习惯补一个空格。 */
const joinSoftLines = (lines: string[]): string =>
  lines.reduce((acc, line) => {
    if (!acc) return line
    const prev = acc[acc.length - 1]
    const next = line[0] ?? ''
    return CJK.test(prev) && CJK.test(next) ? acc + line : acc + ' ' + line
  }, '')

const unquote = (value: string): string => {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/** 解析 `---` frontmatter，缺失时返回空 meta 与原文。 */
export const parseFrontmatter = (raw: string): { meta: Partial<Frontmatter>; body: string } => {
  const normalized = raw.replace(/^\uFEFF/, '')
  if (!normalized.startsWith('---')) return { meta: {}, body: normalized }

  const end = normalized.indexOf('\n---', 3)
  if (end === -1) return { meta: {}, body: normalized }

  const head = normalized.slice(3, end).replace(/^\r?\n/, '')
  const body = normalized.slice(end + 4).replace(/^\r?\n/, '')

  const meta: Record<string, string> = {}
  for (const line of head.split(/\r?\n/)) {
    const match = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line.trim())
    if (match) meta[match[1]] = unquote(match[2])
  }
  return { meta, body }
}

const INLINE_RE =
  /(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)|(!\[[^\]\n]*\]\([^)\n]+\))|(\[[^\]\n]+\]\([^)\n]+\))/

/** 解析 `目标 "标题"` 形式，返回 href 与可选 title。 */
const parseTarget = (inner: string): { href: string; title: string } => {
  const match = /^(\S+?)(?:\s+["'](.*)["'])?$/.exec(inner.trim())
  if (!match) return { href: inner.trim(), title: '' }
  return { href: match[1], title: match[2] ?? '' }
}

export const parseInlines = (text: string): Inline[] => {
  const out: Inline[] = []
  let rest = text

  const pushText = (value: string) => {
    if (value) out.push({ type: 'text', value })
  }

  while (rest) {
    const match = INLINE_RE.exec(rest)
    if (!match || match.index === undefined) {
      pushText(rest)
      break
    }

    pushText(rest.slice(0, match.index))
    const token = match[0]
    rest = rest.slice(match.index + token.length)

    if (token.startsWith('**')) {
      out.push({ type: 'strong', value: token.slice(2, -2) })
    } else if (token.startsWith('`')) {
      out.push({ type: 'code', value: token.slice(1, -1) })
    } else if (token.startsWith('![')) {
      const [alt, inner = ''] = token.slice(2, -1).split('](', 2)
      const { href } = parseTarget(inner)
      out.push({ type: 'image', src: href, alt })
    } else if (token.startsWith('[')) {
      const [label, inner = ''] = token.slice(1, -1).split('](', 2)
      const { href } = parseTarget(inner)
      out.push({ type: 'link', href, label })
    } else {
      out.push({ type: 'em', value: token.slice(1, -1) })
    }
  }

  return out
}

/** 取行内的纯文本形式，供生成节标题 / 锚点使用。 */
export const inlineToText = (inlines: Inline[]): string =>
  inlines
    .map((inline) => {
      switch (inline.type) {
        case 'text':
        case 'strong':
        case 'em':
        case 'code':
          return inline.value
        case 'link':
          return inline.label
        case 'image':
          return inline.alt
      }
    })
    .join('')

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

/**
 * 整行媒体：`![alt](src "caption")`
 * 约定：src 为视频扩展名时渲染为播放器，封面取同名 `-cover.webp`
 * （例：`media/xxx.mp4` → 封面 `media/xxx-cover.webp`）。
 */
const parseMediaLine = (line: string): Block | null => {
  const match = /^\s*!\[([^\]]*)\]\(([^)\n]+)\)\s*$/.exec(line)
  if (!match) return null
  const { href, title } = parseTarget(match[2])
  if (VIDEO_EXT.test(href)) {
    return {
      type: 'media',
      kind: 'video',
      src: href,
      poster: href.replace(VIDEO_EXT, '-cover.webp'),
      alt: match[1],
      caption: title
    }
  }
  return { type: 'media', kind: 'image', src: href, alt: match[1], caption: title }
}

const isBlockStart = (line: string): boolean =>
  /^```/.test(line) ||
  /^#{1,6}\s+/.test(line) ||
  /^>\s?/.test(line) ||
  /^\s*([-*+]|\d+\.)\s+/.test(line) ||
  /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
  parseMediaLine(line) !== null

export const parseMarkdown = (body: string): Block[] => {
  const lines = body.split(/\r?\n/)
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    const fence = /^```(.*)$/.exec(line)
    if (fence) {
      const lang = fence[1].trim()
      const buffer: string[] = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) {
        buffer.push(lines[i])
        i += 1
      }
      i += 1 // 跳过收尾 ```
      blocks.push({ type: 'code', lang, value: buffer.join('\n') })
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, inlines: parseInlines(heading[2].trim()) })
      i += 1
      continue
    }

    const media = parseMediaLine(line)
    if (media) {
      blocks.push(media)
      i += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const buffer: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buffer.push(lines[i].replace(/^>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'quote', inlines: parseInlines(joinSoftLines(buffer)) })
      continue
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: Inline[][] = []
      while (i < lines.length) {
        const itemMatch = /^\s*([-*+]|\d+\.)\s+(.*)$/.exec(lines[i])
        if (!itemMatch) break
        items.push(parseInlines(itemMatch[2].trim()))
        i += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const buffer: string[] = [line]
    i += 1
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      buffer.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', inlines: parseInlines(joinSoftLines(buffer)) })
  }

  return blocks
}
