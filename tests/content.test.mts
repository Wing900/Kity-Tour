/**
 * 内容完整性测试：确保每一章的元数据、图片路径、外链都是真实有效的。
 * 运行：node tests/content.test.mts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parseFrontmatter, parseMarkdown, type Block } from '../src/reader/lib/markdown.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'src/content/chapters')
const PUBLIC_DIR = path.join(ROOT, 'public')

interface Chapter {
  file: string
  slug: string
  number: string
  folder: string
  title: string
  order: number
  blocks: Block[]
}

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))

const chapters: Chapter[] = files.map((file) => {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  return {
    file,
    slug: file.replace(/\.md$/, ''),
    number: meta.number ?? '',
    folder: meta.folder ?? '',
    title: meta.title ?? '',
    order: Number(meta.order),
    blocks: parseMarkdown(body)
  }
})

const check = (name: string, fn: () => void) => {
  fn()
  console.log('  ✓', name)
}

console.log('content integrity')

check('每一章都填了 number / folder / title / order', () => {
  for (const c of chapters) {
    assert.ok(c.number, `${c.file} 缺 number`)
    assert.ok(c.folder, `${c.file} 缺 folder`)
    assert.ok(c.title, `${c.file} 缺 title`)
    assert.ok(Number.isFinite(c.order), `${c.file} 缺 order`)
  }
})

check('章节编号唯一', () => {
  const numbers = chapters.map((c) => c.number)
  assert.equal(new Set(numbers).size, numbers.length, `重复编号：${numbers.join(',')}`)
})

check('章节 slug 唯一', () => {
  const slugs = chapters.map((c) => c.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})

check('所有图片与视频文件真实存在（含视频封面）', () => {
  let images = 0
  let videos = 0
  for (const c of chapters) {
    for (const block of c.blocks) {
      if (block.type !== 'media') continue
      if (block.kind === 'image') {
        images += 1
        assert.ok(
          fs.existsSync(path.join(PUBLIC_DIR, block.src)),
          `${c.file} 引用了不存在的图片：${block.src}`
        )
      } else {
        videos += 1
        assert.ok(
          fs.existsSync(path.join(PUBLIC_DIR, block.src)),
          `${c.file} 引用了不存在的视频：${block.src}`
        )
        assert.ok(block.poster, `${c.file} 视频缺少封面：${block.src}`)
        assert.ok(
          fs.existsSync(path.join(PUBLIC_DIR, block.poster!)),
          `${c.file} 引用了不存在的视频封面：${block.poster}`
        )
      }
    }
  }
  assert.ok(images > 0, '没有任何图片')
  assert.ok(videos > 0, '没有任何视频')
  console.log(`      （共校验 ${images} 张图 / ${videos} 个视频）`)
})

check('所有外链都是 http(s)', () => {
  const hrefs = chapters.flatMap((c) =>
    c.blocks.flatMap((b) => {
      if (b.type === 'paragraph' || b.type === 'quote' || b.type === 'list') {
        const inlines = b.type === 'list' ? b.items.flat() : b.inlines
        return inlines.flatMap((i) => (i.type === 'link' ? [i.href] : []))
      }
      return []
    })
  )
  assert.ok(hrefs.length > 0, '没有任何链接')
  for (const href of hrefs) {
    assert.match(href, /^https?:\/\//, `非法链接：${href}`)
  }
  console.log(`      （共校验 ${hrefs.length} 条外链）`)
})

check('章节顺序连续且无空缺', () => {
  const orders = chapters.map((c) => c.order).sort((a, b) => a - b)
  orders.forEach((n, i) => assert.equal(n, i + 1, `order 不连续，出现在 ${n}`))
})

console.log(`\n${chapters.length} 章 / ${chapters.reduce((n, c) => n + c.blocks.length, 0)} 块`)
for (const c of chapters.sort((a, b) => a.order - b.order)) {
  const sections = c.blocks.filter((b) => b.type === 'heading' && b.level === 2).length
  console.log(`  ${c.number}  [${c.folder}] ${c.title}  —  ${sections} 节`)
}
