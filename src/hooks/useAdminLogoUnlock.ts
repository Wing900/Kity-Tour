import { useCallback, useRef } from 'react'

const REQUIRED_CLICKS = 20

/** 连续点击左上角 Logo 指定次数后触发（不要求快速） */
export function useAdminLogoUnlock(
  onTrigger: () => void,
  enabled: boolean
): () => void {
  const clickCountRef = useRef(0)

  return useCallback(() => {
    if (!enabled) return

    clickCountRef.current += 1
    if (clickCountRef.current >= REQUIRED_CLICKS) {
      clickCountRef.current = 0
      onTrigger()
    }
  }, [onTrigger, enabled])
}
