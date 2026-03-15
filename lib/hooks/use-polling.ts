import { useEffect, useRef } from 'react'

/**
 * Polls a function at a fixed interval. Automatically cleans up on unmount.
 * Calls `fn` immediately on mount, then every `intervalMs`.
 */
export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
  const savedFn = useRef(fn)

  useEffect(() => {
    savedFn.current = fn
  }, [fn])

  useEffect(() => {
    if (!enabled) return

    savedFn.current()
    const id = setInterval(() => savedFn.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
