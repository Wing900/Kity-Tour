import { useEffect, useState, type RefObject } from 'react'

interface IndicatorState {
  height: number
  top: number
  visible: boolean
}

/**
 * 自绘滚动指示器。
 *
 * 为什么不用原生滚动条：本机 Chrome 为 Windows overlay 模式（gutter = 0），
 * 且实测 ::-webkit-scrollbar 在该模式下被忽略，无法自绘 —— 原生条只能隐藏。
 * 这里用 4px 圆角条复刻位置反馈：只在悬停侧栏时浮现，滚动时 spring 跟随。
 */
export const ScrollIndicator = ({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) => {
  const [state, setState] = useState<IndicatorState>({ height: 0, top: 0, visible: false })

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    let frame = 0
    const measure = () => {
      frame = 0
      const { scrollTop, scrollHeight, clientHeight } = el
      const overflow = scrollHeight - clientHeight
      const visible = overflow > 4
      const height = Math.max(30, (clientHeight / scrollHeight) * clientHeight)
      const top = visible ? (scrollTop / overflow) * (clientHeight - height) : 0
      setState((prev) =>
        prev.visible === visible &&
        prev.height === height &&
        Math.abs(prev.top - top) < 0.5
          ? prev
          : { height, top, visible }
      )
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    el.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [targetRef])

  if (!state.visible) return null

  return (
    <div
      className="rd-scroll-indicator"
      aria-hidden="true"
      style={{ height: `${state.height}px`, transform: `translateY(${state.top}px)` }}
    />
  )
}
