// 教程 PDF 导出：遍历所有 folder/file/slide，每张导出 canvas PNG 组装 PDF + 三层目录
/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportToCanvas } from '@excalidraw/excalidraw'
import { jsPDF } from 'jspdf'
import type { Folder, Slide } from '../context/TourContext'

const LEGACY_PREVIEW_FRAME_ID = '__preview-fit-debug-frame__'
const LEGACY_PREVIEW_CENTER_ID = '__preview-fit-debug-center__'

const isLegacyPreviewElement = (el: any) =>
  el.id === LEGACY_PREVIEW_FRAME_ID || el.id === LEGACY_PREVIEW_CENTER_ID

// 画布字体易读写化（与 SlideCanvas 保持一致）：Virgil(1) → Helvetica(2)
const normalizeFontFamily = (elements: any[]) =>
  elements.map((el: any) =>
    el.type === 'text' && el.fontFamily === 1 ? { ...el, fontFamily: 2 } : el
  )

const getVisibleElements = (slide: Slide) =>
  (slide.elements || []).filter((el: any) => !el.isDeleted && !isLegacyPreviewElement(el))

export type ExportProgress = (done: number, total: number, current: string) => void

export async function exportTutorialPdf(
  folders: Folder[],
  onProgress?: ExportProgress
): Promise<void> {
  const doc = new jsPDF({ unit: 'px', format: [1280, 720], orientation: 'landscape' })

  let pageNum = 0
  let firstPage = true
  const folderOutlines = new Map<string, any>()
  const fileOutlines = new Map<string, any>()

  // 算总数（用于进度）
  const total = folders.reduce(
    (n, f) => n + f.files.reduce((m, file) => m + file.slides.length, 0),
    0
  )
  let done = 0

  for (const folder of folders) {
    for (const file of folder.files) {
      for (let slideIdx = 0; slideIdx < file.slides.length; slideIdx++) {
        const slide = file.slides[slideIdx]
        const elements = normalizeFontFamily(getVisibleElements(slide))

        if (elements.length === 0) {
          done++
          onProgress?.(done, total, file.name)
          continue
        }

        const canvas = await exportToCanvas(
          elements,
          {
            ...(slide.appState || {}),
            exportBackground: true,
            viewBackgroundColor: '#fefcf7',
            exportWithDarkMode: false,
          } as any,
          slide.files || {},
          {
            exportBackground: true,
            exportPadding: 20,
            viewBackgroundColor: '#fefcf7',
          }
        )

        const imgData = canvas.toDataURL('image/png')
        const w = canvas.width
        const h = canvas.height

        if (firstPage) {
          doc.addImage(imgData, 'PNG', 0, 0, w, h)
          firstPage = false
        } else {
          doc.addPage([w, h])
          doc.addImage(imgData, 'PNG', 0, 0, w, h)
        }
        pageNum++

        // 三层书签目录：文件夹 → 文件 → 第N页
        if (!folderOutlines.has(folder.id)) {
          const fo = doc.outline.add(null, folder.name, { pageNumber: pageNum })
          folderOutlines.set(folder.id, fo)
        }
        const fileKey = `${folder.id}-${file.id}`
        if (!fileOutlines.has(fileKey)) {
          const fo = doc.outline.add(folderOutlines.get(folder.id), file.name, { pageNumber: pageNum })
          fileOutlines.set(fileKey, fo)
        }
        doc.outline.add(fileOutlines.get(fileKey), `第 ${slideIdx + 1} 页`, { pageNumber: pageNum })

        done++
        onProgress?.(done, total, file.name)
      }
    }
  }

  if (total === 0 || done === 0) {
    throw new Error('没有可导出的幻灯片')
  }

  doc.save(`kity-tour-tutorial-${Date.now()}.pdf`)
}