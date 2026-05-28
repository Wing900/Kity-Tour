import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { buildSceneAssetPath } from './src/lib/sceneFilePaths'

const ensureDir = (filePath: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

const writeDataUrlAsset = (targetPath: string, dataURL: string) => {
  const [, base64Payload = ''] = dataURL.split(',', 2)
  ensureDir(targetPath)
  fs.writeFileSync(targetPath, Buffer.from(base64Payload, 'base64'))
}

const externalizeSceneFiles = (folders: any[], publicDir: string) =>
  folders.map((folder) => ({
    ...folder,
    files: folder.files.map((file: any) => ({
      ...file,
      slides: file.slides.map((slide: any) => {
        const files = Object.fromEntries(
          Object.entries(slide.files ?? {}).map(([fileId, fileData]: [string, any]) => {
            if (!fileData?.dataURL) {
              return [fileId, fileData]
            }

            const assetPath = buildSceneAssetPath(slide.id, fileId, fileData.mimeType)
            const targetPath = path.resolve(publicDir, assetPath)
            writeDataUrlAsset(targetPath, fileData.dataURL)

            return [fileId, {
              id: fileData.id ?? fileId,
              mimeType: fileData.mimeType,
              created: fileData.created,
              lastRetrieved: fileData.lastRetrieved,
              assetPath
            }]
          })
        )

        return {
          ...slide,
          files
        }
      })
    }))
  }))

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
            const publicDir = path.resolve(__dirname, 'public')
            const filePath = path.resolve(__dirname, 'public/data/tour-data.json')
            const normalizedData = {
              ...data,
              folders: externalizeSceneFiles(data.folders ?? [], publicDir)
            }
            
            ensureDir(filePath)
            
            // 格式化写入文件
            fs.writeFileSync(filePath, JSON.stringify(normalizedData, null, 2), 'utf-8')
            
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
