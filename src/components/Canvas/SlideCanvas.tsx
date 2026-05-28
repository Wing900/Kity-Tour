import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react'
import { Excalidraw, getCommonBounds } from '@excalidraw/excalidraw'
import { useTour, type Slide } from '../../context/TourContext'
import { useDebounce } from '../../hooks/useDebounce'
import { openExternalLink } from '../../utils/openLink'
import { FileQuestion } from 'lucide-react'
import '@excalidraw/excalidraw/index.css'

const PREVIEW_PADDING = 48
const MIN_PREVIEW_ZOOM = 0.1
const MAX_PREVIEW_ZOOM = 2
const WHEEL_ZOOM_FACTOR = 1.0015
const LEGACY_PREVIEW_FRAME_ID = '__preview-fit-debug-frame__'
const LEGACY_PREVIEW_CENTER_ID = '__preview-fit-debug-center__'

const isLegacyPreviewElement = (element: any) =>
  element.id === LEGACY_PREVIEW_FRAME_ID || element.id === LEGACY_PREVIEW_CENTER_ID

const getVisibleSlideElements = (slide: Slide | undefined) =>
  (slide?.elements || []).filter((element: any) =>
    !element.isDeleted && !isLegacyPreviewElement(element)
  )

const computePreviewFitAppState = (
  elements: any[],
  viewport: { width: number; height: number } | null
) => {
  if (!viewport?.width || !viewport.height || !elements.length) return {}

  const [minX, minY, maxX, maxY] = getCommonBounds(elements)
  const usableWidth = Math.max(1, viewport.width - PREVIEW_PADDING * 2)
  const usableHeight = Math.max(1, viewport.height - PREVIEW_PADDING * 2)
  const boundsWidth = Math.max(1, maxX - minX)
  const boundsHeight = Math.max(1, maxY - minY)
  const zoomValue = Math.min(
    MAX_PREVIEW_ZOOM,
    Math.max(
      MIN_PREVIEW_ZOOM,
      Math.min(usableWidth / boundsWidth, usableHeight / boundsHeight)
    )
  )

  const centerX = minX + boundsWidth / 2
  const centerY = minY + boundsHeight / 2

  return {
    scrollX: viewport.width / (2 * zoomValue) - centerX,
    scrollY: viewport.height / (2 * zoomValue) - centerY,
    zoom: { value: zoomValue }
  }
}

const buildAppState = (
  slide: Slide | undefined,
  isAdmin: boolean,
  viewport: { width: number; height: number } | null
) => {
  const appState = slide?.appState ?? {}
  const { scrollX, scrollY, zoom, width, height, ...readerAppState } = appState
  const visibleElements = getVisibleSlideElements(slide)

  return {
    ...(isAdmin ? appState : readerAppState),
    ...(!isAdmin ? computePreviewFitAppState(visibleElements, viewport) : {}),
    viewBackgroundColor: '#fdf9f3',
    theme: 'light' as const,
    viewModeEnabled: !isAdmin,
    currentItemStrokeWidth: 1,
    currentItemRoughness: 0
  }
}

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
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null)
  const activeSlideRef = useRef('')
  const isSyncingRef = useRef(false)
  const debouncedSaveRef = useRef<{ flush: () => void } | null>(null)
  const canvasInnerRef = useRef<HTMLDivElement | null>(null)

  const activeFolder = folders.find(f => f.id === activeFolderId)
  const activeFile = activeFolder?.files.find(f => f.id === activeFileId)
  const activeSlide: Slide | undefined = activeFile?.slides[currentSlideIndex]
  const activeSlideId = activeSlide?.id || ''

  const debouncedSave = useDebounce(
    (slideId: string, elements: any[], appState: any, files: Record<string, any>) => {
      if (!isAdmin) return
      updateSlideCanvas(slideId, elements, appState, files)
    },
    800
  )
  debouncedSaveRef.current = debouncedSave

  const handleChange = (elements: readonly any[], appState: any, files: Record<string, any>) => {
    if (isSyncingRef.current || !isAdmin || !activeSlideId) return
    const validElements = elements.filter(el => !el.isDeleted && !isLegacyPreviewElement(el))
    const currentFiles = excalidrawAPI?.getFiles?.() ?? files ?? {}
    debouncedSave(activeSlideId, validElements, appState, currentFiles)
  }

  // 仅在切换幻灯片时加载画布；切换前先保存上一页
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.flush()
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      debouncedSaveRef.current?.flush()
    }
  }, [isAdmin])

  useEffect(() => {
    const handleBeforeUnload = () => {
      debouncedSaveRef.current?.flush()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  useLayoutEffect(() => {
    if (!canvasInnerRef.current) return

    const updateViewport = () => {
      const nextViewport = {
        width: canvasInnerRef.current?.clientWidth ?? 0,
        height: canvasInnerRef.current?.clientHeight ?? 0
      }
      if (!nextViewport.width || !nextViewport.height) return
      setViewport((current) => {
        if (current?.width === nextViewport.width && current?.height === nextViewport.height) {
          return current
        }
        return nextViewport
      })
    }

    updateViewport()
    const observer = new ResizeObserver(() => {
      updateViewport()
    })
    observer.observe(canvasInnerRef.current)
    return () => {
      observer.disconnect()
    }
  }, [activeFileId, activeSlideId])

  useEffect(() => {
    if (isAdmin || !excalidrawAPI || !activeSlide || !viewport) return

    const visibleElements = getVisibleSlideElements(activeSlide)
    excalidrawAPI.updateScene({
      elements: visibleElements,
      files: activeSlide.files || {},
      appState: buildAppState(activeSlide, false, viewport)
    })
  }, [activeSlide, activeSlideId, currentSlideIndex, excalidrawAPI, isAdmin, viewport])

  useEffect(() => {
    if (isAdmin || !excalidrawAPI || !canvasInnerRef.current) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const appState = excalidrawAPI.getAppState?.()
      if (!appState?.zoom?.value) return

      const rect = canvasInnerRef.current?.getBoundingClientRect()
      if (!rect) return

      const currentZoom = appState.zoom.value
      const nextZoom = Math.min(
        MAX_PREVIEW_ZOOM,
        Math.max(MIN_PREVIEW_ZOOM, currentZoom * Math.pow(WHEEL_ZOOM_FACTOR, -event.deltaY))
      )
      const mouseSceneX = (event.clientX - rect.left) / currentZoom - appState.scrollX
      const mouseSceneY = (event.clientY - rect.top) / currentZoom - appState.scrollY

      excalidrawAPI.updateScene({
        appState: {
          ...appState,
          viewModeEnabled: true,
          zoom: { value: nextZoom },
          scrollX: (event.clientX - rect.left) / nextZoom - mouseSceneX,
          scrollY: (event.clientY - rect.top) / nextZoom - mouseSceneY
        }
      })
    }

    const target = canvasInnerRef.current
    target.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      target.removeEventListener('wheel', handleWheel)
    }
  }, [excalidrawAPI, isAdmin])

  useEffect(() => {
    if (!activeFileId || !activeSlideId) return

    const slideIdentifier = `${activeFileId}-${activeSlideId}-${isAdmin ? 'edit' : 'view'}`
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
    // folders 仅作读取，不列入 deps，避免保存后反复 updateScene
  // eslint-disable-next-line react-hooks/exhaustive-deps -- folders
  }, [activeSlideId, activeFileId, activeFolderId, isAdmin])

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

  const visibleElements = getVisibleSlideElements(activeSlide)
  const shouldWaitForPreviewViewport = !isAdmin && visibleElements.length > 0 && !viewport

  return (
    <div className={`slide-canvas-card${isAdmin ? '' : ' slide-canvas-card--readonly'}`}>
      <div ref={canvasInnerRef} className="canvas-inner">
        {!shouldWaitForPreviewViewport && (
          <Excalidraw
            key={`${activeSlideId}-${isAdmin ? 'edit' : 'view'}`}
            excalidrawAPI={handleExcalidrawAPI}
            langCode="zh-CN"
            viewModeEnabled={!isAdmin}
            theme="light"
            onChange={handleChange}
            onLinkOpen={handleLinkOpen}
            initialData={{
              elements: visibleElements,
              appState: buildAppState(activeSlide, isAdmin, viewport),
              files: activeSlide.files || {}
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
        )}
      </div>
    </div>
  )
}
