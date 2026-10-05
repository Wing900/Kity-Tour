import {
  inlineToText,
  parseFrontmatter,
  parseMarkdown,
  type Block,
  type Frontmatter
} from './markdown.ts'

export interface Section {
  id: string
  title: string
  blocks: Block[]
}

export interface Chapter {
  slug: string
  meta: Frontmatter
  /** 第一个 h2 之前的引言块 */
  intro: Block[]
  sections: Section[]
  order: number
}

const modules = import.meta.glob('../../content/chapters/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

const slugOf = (path: string): string => {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

/** 把扁平的块序列切成「引言 + 若干以 h2 起头的节」，供右侧圆点导航使用。 */
const toSections = (blocks: Block[]): { intro: Block[]; sections: Section[] } => {
  const intro: Block[] = []
  const sections: Section[] = []
  let current: Section | null = null

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 2) {
      current = {
        id: `s-${sections.length + 1}`,
        title: inlineToText(block.inlines),
        blocks: []
      }
      sections.push(current)
      continue
    }
    if (current) current.blocks.push(block)
    else intro.push(block)
  }

  return { intro, sections }
}

export const chapters: Chapter[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw)
    const normalized: Frontmatter = {
      number: meta.number ?? '',
      folder: meta.folder ?? '未分组',
      title: meta.title ?? slugOf(path),
      lead: meta.lead ?? '',
      minutes: meta.minutes ?? '',
      order: meta.order ?? ''
    }
    const { intro, sections } = toSections(parseMarkdown(body))
    return {
      slug: slugOf(path),
      meta: normalized,
      intro,
      sections,
      order: Number(normalized.order) || 999
    }
  })
  .sort((a, b) => a.order - b.order)

export interface FolderGroup {
  folder: string
  items: Chapter[]
}

/** 按 meta.folder 分组，保留章节排序决定的出现顺序。 */
export const folderGroups: FolderGroup[] = chapters.reduce<FolderGroup[]>((groups, chapter) => {
  const found = groups.find((g) => g.folder === chapter.meta.folder)
  if (found) found.items.push(chapter)
  else groups.push({ folder: chapter.meta.folder, items: [chapter] })
  return groups
}, [])

export const findChapter = (slug: string): Chapter | undefined =>
  chapters.find((c) => c.slug === slug)
