import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 自定义插件：处理本地开发时的数据保存
const savePlugin = () => ({
  name: 'save-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.method === 'POST' && req.url === '/api/save') {
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const filePath = path.resolve(__dirname, 'public/data/tour-data.json')
            
            // 确保目录存在
            fs.mkdirSync(path.dirname(filePath), { recursive: true })
            
            // 格式化写入文件
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
            
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: '数据保存成功！' }))
          } catch (error: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: error.message }))
          }
        })
        return
      }
      next()
    })
  }
})

// https://vite.dev/config/
// GitHub Pages 项目站路径为 /Kity-Tour/，本地 dev 仍用 /
const base = process.env.GITHUB_PAGES === 'true' ? '/Kity-Tour/' : '/'

export default defineConfig({
  base,
  plugins: [react(), savePlugin()],
  define: {
    'process.env': {}
  }
})
