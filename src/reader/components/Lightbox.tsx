import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { resolveAsset } from '../lib/asset'

export interface ZoomTarget {
  src: string
  alt: string
  rect: DOMRect
  naturalWidth: number
  naturalHeight: number
}

const SPRING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CLOSE_MS = 380
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Geometry {
  x: number
  y: number
  width: number
  height: number
}

/** 让图片在视口内等比占满，留出边距。 */
const fitToViewport = (naturalWidth: number, naturalHeight: number): Geometry => {
  const maxW = window.innerWidth * 0.92
  const maxH = window.innerHeight * 0.9
  const ratio = naturalWidth / naturalHeight || 1
  let width = maxW
  let height = width / ratio
  if (height > maxH) {
    height = maxH
    width = height * ratio
  }
  return { x: (window.innerWidth - width) / 2, y: (window.innerHeight - height) / 2, width, height }
}

interface LightboxProps {
  target: ZoomTarget | null
  onClose: () => void
}

/**
 * Apple 风 FLIP 放大层。
 * 先把图片「摆」在缩略图原位，下一帧再 spring 过渡到居中放大后的矩形；
 * 关闭时反向收回原位后再卸载。全程只动 transform，不触发重排。
 */
export const Lightbox = ({ target, onClose }: LightboxProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const geometryRef = useRef<{ from: Geometry; to: Geometry } | null>(null)
  const closingRef = useRef(false)

  /** 先反向收回，再通知父层卸载。 */
  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const node = imageRef.current
    const root = rootRef.current
    const geometry = geometryRef.current
    if (!node || !root || !geometry || prefersReducedMotion()) {
      onClose()
      return
    }
    node.style.transition = `transform ${CLOSE_MS}ms ${SPRING}, opacity 200ms ease-in`
    node.style.transform = `translate3d(${geometry.from.x}px, ${geometry.from.y}px, 0) scale(${geometry.from.width / geometry.to.width})`
    node.style.opacity = '0'
    root.classList.remove('is-open')
    window.setTimeout(onClose, CLOSE_MS)
  }, [onClose])

  // 打开动画：初始贴合缩略图 → 下一帧过渡到放大位置
  useLayoutEffect(() => {
    closingRef.current = false
    if (!target) return
    const node = imageRef.current
    const root = rootRef.current
    if (!node || !root) return

    const to = fitToViewport(target.naturalWidth, target.naturalHeight)
    const from: Geometry = {
      x: target.rect.left,
      y: target.rect.top,
      width: target.rect.width,
      height: target.rect.height
    }
    geometryRef.current = { from, to }

    const reduced = prefersReducedMotion()
    node.style.transition = 'none'
    node.style.transformOrigin = 'top left'
    node.style.width = `${to.width}px`
    node.style.height = `${to.height}px`
    node.style.transform = `translate3d(${from.x}px, ${from.y}px, 0) scale(${from.width / to.width})`
    node.style.opacity = reduced ? '1' : '0.35'

    const raf = requestAnimationFrame(() => {
      if (!reduced) node.style.transition = `transform 460ms ${SPRING}, opacity 260ms ease-out`
      node.style.transform = `translate3d(${to.x}px, ${to.y}px, 0) scale(1)`
      node.style.opacity = '1'
      root.classList.add('is-open')
    })
    return () => cancelAnimationFrame(raf)
  }, [target])

  // ESC 关闭 + 锁滚动
  useEffect(() => {
    if (!target) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [target, handleClose])

  if (!target) return null

  return (
    <div
      ref={rootRef}
      className="rd-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={target.alt || '图片预览'}
      onClick={handleClose}
    >
      <div className="rd-lightbox-backdrop" />
      <img
        ref={imageRef}
        className="rd-lightbox-image"
        src={resolveAsset(target.src)}
        alt={target.alt}
        draggable={false}
      />
      <button type="button" className="rd-lightbox-close" aria-label="关闭预览" onClick={handleClose}>
        ×
      </button>
    </div>
  )
}
