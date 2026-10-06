/**
 * 路由契约测试：锁定「默认入口是阅读器、旧画布隐藏、旧深链不失效」这三条约定。
 * 这些是纯文件层面的约定，一旦有人手滑改名/删转发脚本，这里会先炸。
 * 运行：node tests/routing.test.mts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

let failed = 0
let passed = 0
const check = (name: string, fn: () => void) => {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${(error as Error).message}`)
  }
}

const rootHtml = read('index.html')
const canvasHtml = read('canvas.html')
const aliasHtml = read('public/read.html')
const viteConfig = read('vite.config.ts')

console.log('路由契约')

check('根路径 index.html 挂载阅读器', () => {
  assert.match(rootHtml, /src="\/src\/reader\/main\.tsx"/, 'index.html 未挂载 src/reader/main.tsx')
  assert.doesNotMatch(rootHtml, /src="\/src\/main\.tsx"/, 'index.html 仍挂载着旧画布入口')
})

check('旧画布降为隐藏页 canvas.html', () => {
  assert.match(canvasHtml, /src="\/src\/main\.tsx"/, 'canvas.html 未挂载旧画布入口')
})

check('根路径转发旧深链 ?f=&file= 到 canvas.html', () => {
  assert.match(rootHtml, /window\.location\.replace\(\s*'\.\/canvas\.html'\s*\+/, '缺少旧深链转发')
  assert.match(rootHtml, /p\.has\('f'\)\s*\|\|\s*p\.has\('file'\)/, '转发条件未覆盖 f / file 参数')
})

check('/read.html 作为别名转发到阅读器根路径且保留查询串', () => {
  assert.match(aliasHtml, /window\.location\.replace\(\s*'\.\/'\s*\+\s*window\.location\.search/, '别名未保留 ?c= 查询串')
})

check('站内已无指向旧入口的链接', () => {
  const hits: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(rel)
      else if (/\.tsx?$/.test(entry.name)) {
        read(rel)
          .split('\n')
          .forEach((line, i) => {
            if (/(href|src)=[^\n]*(canvas\.html|index\.html)/.test(line) && /BASE_URL/.test(line)) {
              hits.push(`${rel}:${i + 1}`)
            }
          })
      }
    }
  }
  walk('src/reader')
  assert.deepEqual(hits, [], `阅读器内仍有旧入口链接：${hits.join(', ')}`)
  assert.doesNotMatch(rootHtml, /切换到画布版/, '根页仍写着「切换到画布版」')
})

check('内联转发脚本 opt-out Cloudflare Rocket Loader', () => {
  // 线上 HTML 由 Cloudflare 改写（实测注入了 rocket-loader.min.js），
  // 内联脚本若被延迟，旧深链转发就会慢到用户先看到阅读器再跳走。
  assert.match(rootHtml, /<script data-cfasync="false">[\s\S]*?canvas\.html/, 'index.html 的转发脚本缺少 data-cfasync="false"')
  assert.match(aliasHtml, /<script data-cfasync="false">/, 'read.html 别名脚本缺少 data-cfasync="false"')
})

check('vite 双入口与文件对应正确', () => {
  assert.match(viteConfig, /canvas:\s*path\.resolve\(__dirname,\s*'canvas\.html'\)/, '缺少画布入口映射')
  assert.match(viteConfig, /reader:\s*path\.resolve\(__dirname,\s*'index\.html'\)/, '缺少阅读器入口映射')
  assert.doesNotMatch(viteConfig, /'read\.html'\)/, 'vite 仍把 read.html 当入口（它现在是 public 里的别名页）')
})

console.log(`\n${passed} passed${failed ? `, ${failed} failed` : ''}`)
process.exit(failed ? 1 : 0)
