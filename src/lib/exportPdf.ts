// PDF 组装：接收每页 PNG dataURL + 三层目录元数据，输出 PDF
/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf'

export class PdfBuilder {
  private doc: jsPDF
  private pageNum = 0
  private firstPage = true
  private folderOutlines = new Map<string, any>()
  private fileOutlines = new Map<string, any>()

  constructor() {
    this.doc = new jsPDF({ unit: 'px', format: [1280, 720], orientation: 'landscape' })
  }

  addPage(
    imgData: string,
    w: number,
    h: number,
    folderId: string,
    folderName: string,
    fileId: string,
    fileName: string,
    slideNum: number
  ): void {
    if (this.firstPage) {
      this.doc.addImage(imgData, 'JPEG', 0, 0, w, h)
      this.firstPage = false
    } else {
      this.doc.addPage([w, h])
      this.doc.addImage(imgData, 'JPEG', 0, 0, w, h)
    }
    this.pageNum++

    if (!this.folderOutlines.has(folderId)) {
      this.folderOutlines.set(
        folderId,
        this.doc.outline.add(null, folderName, { pageNumber: this.pageNum })
      )
    }
    const fileKey = `${folderId}-${fileId}`
    if (!this.fileOutlines.has(fileKey)) {
      this.fileOutlines.set(
        fileKey,
        this.doc.outline.add(this.folderOutlines.get(folderId), fileName, { pageNumber: this.pageNum })
      )
    }
    this.doc.outline.add(this.fileOutlines.get(fileKey), `第 ${slideNum} 页`, { pageNumber: this.pageNum })
  }

  save(filename: string): void {
    if (this.pageNum === 0) throw new Error('没有可导出的幻灯片')
    this.doc.save(filename)
  }

  get pageCount(): number {
    return this.pageNum
  }
}

// 找 Excalidraw 在 DOM 里渲染的主 canvas（取面积最大的）
export const findExcalidrawCanvas = (): HTMLCanvasElement | null => {
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas'))
  if (canvases.length === 0) return null
  return canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0]
}

// 缩放 canvas 到 max 1280px 宽 + 转 JPEG 85%，体积降 ~10x（文字依然清晰）
export const canvasToJpeg = (src: HTMLCanvasElement, maxW = 1280): { imgData: string; w: number; h: number } => {
  const scale = Math.min(1, maxW / src.width)
  const w = Math.round(src.width * scale)
  const h = Math.round(src.height * scale)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 不可用')
  ctx.drawImage(src, 0, 0, w, h)
  return { imgData: c.toDataURL('image/jpeg', 0.85), w, h }
}

// 链接元数据
export interface LinkEntry {
  folder: string
  file: string
  slide: number
  text: string
  link: string
}

// 从 folders 提取所有 http 链接，非 text 元素查 boundElements 拿内部 text
export const collectLinks = (folders: any[]): LinkEntry[] => {
  const out: LinkEntry[] = []
  for (const folder of folders) {
    for (const file of folder.files) {
      for (let si = 0; si < file.slides.length; si++) {
        const els: any[] = file.slides[si].elements || []
        for (const el of els) {
          if (el.link && typeof el.link === 'string' && el.link.startsWith('http')) {
            let text = ''
            if (el.type === 'text') {
              text = el.text || ''
            } else {
              // 图形元素：查 boundElements 里绑定的 text
              const boundTexts = (el.boundElements || [])
                .filter((b: any) => b.type === 'text')
                .map((b: any) => els.find(e => e.id === b.id))
                .filter(Boolean)
              text = boundTexts.map((t: any) => t.text || '').join(' / ')
            }
            out.push({
              folder: folder.name,
              file: file.name,
              slide: si + 1,
              text,
              link: el.link,
            })
          }
        }
      }
    }
  }
  return out
}

// 绘制链接汇总页（canvas 渲染中文不乱码）
export const drawLinksCanvas = (links: LinkEntry[]): HTMLCanvasElement => {
  const W = 1280
  const padTop = 80
  const rowH = Math.max(48, Math.min(72, (720 - padTop - 40) / Math.max(1, links.length)))
  const H = Math.max(720, padTop + links.length * rowH + 40)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fefcf7'
  ctx.fillRect(0, 0, W, H)
  const fontCn = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif'
  // 标题
  ctx.fillStyle = '#1e1e1e'
  ctx.font = `bold 32px ${fontCn}`
  ctx.fillText('教程内链接汇总', 40, 50)
  ctx.font = `16px ${fontCn}`
  ctx.fillStyle = '#888'
  ctx.fillText(`共 ${links.length} 个链接，按出现顺序列出`, 40, 76)
  // 列表
  links.forEach((l, i) => {
    const y = padTop + i * rowH
    // 来源
    ctx.fillStyle = '#888'
    ctx.font = `13px ${fontCn}`
    ctx.fillText(`[${l.folder} / ${l.file} / 第${l.slide}页]`, 40, y + 18)
    // text 描述（link 绑定的文字，图形元素取 boundElements 内的 text）
    ctx.fillStyle = '#1e1e1e'
    ctx.font = `16px ${fontCn}`
    const desc = (l.text || '(无文字)').replace(/\n/g, ' ').substring(0, 80)
    ctx.fillText(desc, 40, y + 40)
    // URL
    ctx.fillStyle = '#0066cc'
    ctx.font = `15px ${fontCn}`
    ctx.fillText(l.link, 40, y + 62)
  })
  return c
}

export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

// 等待新 Excalidraw canvas 渲染完成（事件驱动，非固定时间）
// 流程：旧 canvas 消失（unmount）→ 新 canvas 出现（remount）→ RAF 两帧 + 渲染完
export const waitForNewCanvas = async (
  prevCanvas: HTMLCanvasElement | null,
  timeout = 5000
): Promise<HTMLCanvasElement | null> => {
  const start = Date.now()
  // ① 等旧 canvas 消失（跨页 remount 时 canvas 会被移除）
  if (prevCanvas) {
    while (Date.now() - start < timeout) {
      const c = findExcalidrawCanvas()
      if (!c || c !== prevCanvas) break
      await wait(30)
    }
  }
  // ② 等新 canvas 出现且尺寸> 0
  let canvas: HTMLCanvasElement | null = null
  while (Date.now() - start < timeout) {
    canvas = findExcalidrawCanvas()
    if (canvas && canvas.width > 0 && canvas.height > 0) break
    await wait(30)
  }
  if (!canvas) return null
  // ③ 等两帧 + 400ms 让 Excalidraw 把场景画完（含图片解码）
  await new Promise<void>(r => { requestAnimationFrame(() => requestAnimationFrame(() => r())) })
  await wait(400)
  return findExcalidrawCanvas() || canvas
}