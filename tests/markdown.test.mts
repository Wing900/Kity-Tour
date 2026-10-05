/**
 * Markdown 子集解析器的断言测试。
 * 运行：node tests/markdown.test.mts
 * 说明：不引入测试框架（项目禁止未经审批新增依赖），用 node:assert 直接断言。
 */
import assert from 'node:assert/strict'
import { parseFrontmatter, parseInlines, parseMarkdown } from '../src/reader/lib/markdown.ts'

let passed = 0
const check = (name: string, fn: () => void) => {
  fn()
  passed += 1
  console.log('  ✓', name)
}

console.log('markdown parser')

check('frontmatter 解析并剥离正文', () => {
  const { meta, body } = parseFrontmatter(`---\nnumber: "03"\ntitle: 可视化\nminutes: 2\n---\n\n## 标题\n\n正文`)
  assert.equal(meta.number, '03')
  assert.equal(meta.title, '可视化')
  assert.equal(meta.minutes, '2')
  assert.equal(body.trim().startsWith('## 标题'), true)
})

check('无 frontmatter 时原样返回', () => {
  const { meta, body } = parseFrontmatter('# hi')
  assert.deepEqual(meta, {})
  assert.equal(body, '# hi')
})

check('标题级别', () => {
  const blocks = parseMarkdown('# a\n\n## b\n\n### c')
  assert.deepEqual(
    blocks.map((b) => (b.type === 'heading' ? [b.level, b.inlines[0]] : null)),
    [
      [1, { type: 'text', value: 'a' }],
      [2, { type: 'text', value: 'b' }],
      [3, { type: 'text', value: 'c' }]
    ]
  )
})

check('中日韩软换行不插空格，英文插空格', () => {
  const blocks = parseMarkdown('这是第一行\n这是第二行\n\nhello\nworld')
  const paragraphs = blocks.filter((b) => b.type === 'paragraph')
  assert.equal(paragraphs[0].type === 'paragraph' && paragraphs[0].inlines[0].type === 'text'
    ? paragraphs[0].inlines[0].value
    : '', '这是第一行这是第二行')
  assert.equal(paragraphs[1].type === 'paragraph' && paragraphs[1].inlines[0].type === 'text'
    ? paragraphs[1].inlines[0].value
    : '', 'hello world')
})

check('整行图片 → media(image)，带 caption', () => {
  const blocks = parseMarkdown('![截图](data/a.png "图注在①处")')
  assert.equal(blocks.length, 1)
  const fig = blocks[0]
  assert.equal(fig.type, 'media')
  if (fig.type === 'media') {
    assert.equal(fig.kind, 'image')
    assert.equal(fig.alt, '截图')
    assert.equal(fig.src, 'data/a.png')
    assert.equal(fig.caption, '图注在①处')
  }
})

check('整行视频 → media(video)，封面按 -cover.webp 约定', () => {
  const blocks = parseMarkdown('![介绍视频](media/intro.mp4 "PlotKityCat 介绍")')
  assert.equal(blocks.length, 1)
  const v = blocks[0]
  assert.equal(v.type, 'media')
  if (v.type === 'media') {
    assert.equal(v.kind, 'video')
    assert.equal(v.src, 'media/intro.mp4')
    assert.equal(v.poster, 'media/intro-cover.webp')
    assert.equal(v.caption, 'PlotKityCat 介绍')
  }
})

check('无序 / 有序列表', () => {
  const blocks = parseMarkdown('- 一\n- 二\n\n1. 甲\n2. 乙')
  assert.equal(blocks[0].type, 'list')
  assert.equal(blocks[1].type, 'list')
  if (blocks[0].type === 'list') assert.equal(blocks[0].ordered, false)
  if (blocks[1].type === 'list') {
    assert.equal(blocks[1].ordered, true)
    assert.equal(blocks[1].items.length, 2)
  }
})

check('引用与围栏代码', () => {
  const blocks = parseMarkdown('> 注意这一点\n\n```python\nprint(1)\n```')
  assert.equal(blocks[0].type, 'quote')
  assert.equal(blocks[1].type, 'code')
  if (blocks[1].type === 'code') {
    assert.equal(blocks[1].lang, 'python')
    assert.equal(blocks[1].value, 'print(1)')
  }
})

check('分隔线 hr', () => {
  const blocks = parseMarkdown('a\n\n---\n\nb')
  assert.equal(blocks[1].type, 'hr')
})

check('行内：粗体 / 行内码 / 斜体 / 链接', () => {
  const inlines = parseInlines('看 **这里** 和 `code` 与 *斜* 以及[文档](https://a.b)')
  const kinds = inlines.map((i) => i.type)
  assert.equal(kinds.includes('strong'), true)
  assert.equal(kinds.includes('code'), true)
  assert.equal(kinds.includes('em'), true)
  const link = inlines.find((i) => i.type === 'link')
  assert.equal(link && link.type === 'link' ? link.href : '', 'https://a.b')
})

check('段落不会吞掉紧跟的块级元素', () => {
  const blocks = parseMarkdown('一段文字\n- 列表项')
  assert.deepEqual(blocks.map((b) => b.type), ['paragraph', 'list'])
})

console.log(`\n${passed} passed`)
