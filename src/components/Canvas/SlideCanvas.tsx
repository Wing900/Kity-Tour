import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useTour, type Slide } from '../../context/TourContext'
import { useDebounce } from '../../hooks/useDebounce'
import { openExternalLink } from '../../utils/openLink'
import { FileQuestion } from 'lucide-react'
import '@excalidraw/excalidraw/index.css'

const buildAppState = (slide: Slide | undefined, isAdmin: boolean) => ({
  ...(slide?.appState ?? {}),
  viewBackgroundColor: '#fdf9f3',
  theme: 'light' as const,
  viewModeEnabled: !isAdmin,
  currentItemStrokeWidth: 1,
  currentItemRoughness: 0
})

export const SlideCanvas: React.FC = () => {
  const {
    folders,
    activeFolderId,
    activeFileId,
    currentSlideIndex,
    isAdmin,
    updateSlideCanvas
  } = useTour()

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const activeSlideRef = useRef('')
  const isSyncingRef = useRef(false)
  const debouncedSaveRef = useRef<{ flush: () => void } | null>(null)

  const activeFolder = folders.find(f => f.id === activeFolderId)
  const activeFile = activeFolder?.files.find(f => f.id === activeFileId)
  const activeSlide: Slide | undefined = activeFile?.slides[currentSlideIndex]
  const activeSlideId = activeSlide?.id || ''

  const debouncedSave = useDebounce(
    (slideId: string, elements: any[], appState: any) => {
      if (!isAdmin) return
      updateSlideCanvas(slideId, elements, appState)
    },
    800
  )
  debouncedSaveRef.current = debouncedSave

  const handleChange = (elements: readonly any[], appState: any) => {
    if (isSyncingRef.current || !isAdmin || !activeSlideId) return
    const validElements = elements.filter(el => !el.isDeleted)
    debouncedSave(activeSlideId, validElements, appState)
  }

  const loadSlideIntoCanvas = useCallback(
    (slide: Slide) => {
      if (!excalidrawAPI) return

      isSyncingRef.current = true
      excalidrawAPI.updateScene({
        elements: slide.elements || [],
        appState: buildAppState(slide, isAdmin)
      })

      window.setTimeout(() => {
        if (!excalidrawAPI) {
          isSyncingRef.current = false
          return
        }
        const { scrollX, scrollY, zoom } = slide.appState ?? {}
        if (scrollX != null || scrollY != null || zoom != null) {
          excalidrawAPI.updateScene({
            appState: {
              scrollX: scrollX ?? 0,
              scrollY: scrollY ?? 0,
              zoom: zoom ?? { value: 1 },
              viewModeEnabled: !isAdmin
            }
          })
        } else if (slide.elements?.length) {
          excalidrawAPI.scrollToContent(undefined, {
            fitToViewport: true,
            viewportZoomFactor: 0.9,
            animate: false
          })
        }
        window.setTimeout(() => {
          isSyncingRef.current = false
        }, 50)
      }, 50)
    },
    [excalidrawAPI, isAdmin]
  )

  // 仅在切换幻灯片时加载画布；切换前先保存上一页
  useEffect(() => {
    if (!excalidrawAPI || !activeFileId || !activeSlideId) return

    const slideIdentifier = `${activeFileId}-${activeSlideId}`
    if (activeSlideRef.current === slideIdentifier) return

    const file = folders
      .find(f => f.id === activeFolderId)
      ?.files.find(f => f.id === activeFileId)
    const slide = file?.slides.find(s => s.id === activeSlideId)
    if (!slide) return

    if (activeSlideRef.current) {
      debouncedSaveRef.current?.flush()
    }

    activeSlideRef.current = slideIdentifier
    loadSlideIntoCanvas(slide)
    // folders 仅作读取，不列入 deps，避免保存后反复 updateScene
  // eslint-disable-next-line react-hooks/exhaustive-deps -- folders
  }, [excalidrawAPI, activeSlideId, activeFileId, activeFolderId, loadSlideIntoCanvas])

  const handleExcalidrawAPI = useCallback((api: any) => {
    setExcalidrawAPI((prev: any) => (prev === api ? prev : api))
  }, [])

  const handleLinkOpen = useCallback((element: { link: string | null }, event: CustomEvent) => {
    if (!element.link) return
    event.preventDefault()
    openExternalLink(element.link)
  }, [])

  if (!activeFile || !activeSlide) {
    return (
      <div className="canvas-empty-state">
        <FileQuestion className="empty-state-icon" />
        <h3 className="empty-state-title">这里还没有内容</h3>
        <p className="empty-state-desc">
          {isAdmin
            ? '请在左侧侧边栏中新建文件夹和教程文件，开始绘制教程。'
            : '请点击左侧目录树中的文件开始学习。'}
        </p>
      </div>
    )
  }

  return (
    <div className={`slide-canvas-card${isAdmin ? '' : ' slide-canvas-card--readonly'}`}>
      <div className="canvas-inner">
        <Excalidraw
          key={`${activeSlideId}-${isAdmin ? 'edit' : 'view'}`}
          excalidrawAPI={handleExcalidrawAPI}
          langCode="zh-CN"
          viewModeEnabled={!isAdmin}
          theme="light"
          onChange={handleChange}
          onLinkOpen={handleLinkOpen}
          initialData={{
            elements: activeSlide.elements || [],
            appState: buildAppState(activeSlide, isAdmin)
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: isAdmin,
              export: false,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false
            },
            welcomeScreen: false
          }}
        />
      </div>
    </div>
  )
}
