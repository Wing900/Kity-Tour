import { useEffect } from 'react'

const REQUIRED_COUNT = 8
/** 相邻两次按键允许的最大间隔（毫秒） */
const MAX_INTERVAL_MS = 500

/** 仅排除真正的表单输入；画布 contenteditable 仍计入快捷键 */
function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/**
 * 连续快速按 k（8 次）触发管理员登录弹窗；无可见入口。
 */
export function useAdminUnlockSequence(
  onTrigger: () => void,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) return

    let count = 0
    let lastPressAt = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e.target)) return
      if (e.key !== 'k' && e.key !== 'K') {
        count = 0
        return
      }

      const now = Date.now()
      if (count > 0 && now - lastPressAt > MAX_INTERVAL_MS) {
        count = 0
      }

      count += 1
      lastPressAt = now

      if (count >= REQUIRED_COUNT) {
        count = 0
        lastPressAt = 0
        onTrigger()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onTrigger, enabled])
}
