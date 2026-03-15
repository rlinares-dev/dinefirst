import { useEffect, useRef, useCallback } from 'react'

const CHANNEL_NAME = 'dinefirst-tpv'

/**
 * Cross-tab sync via BroadcastChannel (falls back to no-op in unsupported envs).
 * Send messages with `broadcast(data)`, receive via `onMessage` callback.
 */
export function useBroadcast<T = unknown>(onMessage?: (data: T) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const ch = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = ch

    if (onMessage) {
      ch.onmessage = (e: MessageEvent<T>) => onMessage(e.data)
    }

    return () => {
      ch.close()
      channelRef.current = null
    }
  }, [onMessage])

  const broadcast = useCallback((data: T) => {
    channelRef.current?.postMessage(data)
  }, [])

  return { broadcast }
}
