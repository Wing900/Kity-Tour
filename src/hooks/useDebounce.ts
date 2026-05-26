import { useEffect, useRef, useMemo } from 'react'

export type DebouncedFunction<T extends (...args: any[]) => void> = T & {
  flush: () => void
  cancel: () => void
}

export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fnRef = useRef(fn)
  const pendingArgsRef = useRef<Parameters<T> | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useMemo(() => {
    const flush = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (pendingArgsRef.current) {
        fnRef.current(...pendingArgsRef.current)
        pendingArgsRef.current = null
      }
    }

    const cancel = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      pendingArgsRef.current = null
    }

    const debouncedFn = ((...args: Parameters<T>) => {
      pendingArgsRef.current = args
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        pendingArgsRef.current = null
        fnRef.current(...args)
      }, delay)
    }) as DebouncedFunction<T>

    debouncedFn.flush = flush
    debouncedFn.cancel = cancel

    return debouncedFn
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delay is the only tunable
  }, [delay])
}
