import { useEffect, useRef } from 'react'
import { getTablesForRestaurant, getActiveSessionForTable, updateTableStatus, closeSession } from '@/lib/data'

const TIMEOUT_MINUTES = 15

/**
 * Auto-reverts tables in `en_route` status back to `free`
 * if no session activity for TIMEOUT_MINUTES.
 */
export function useTableTimeout(restaurantId: string, enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) return

    function checkTimeouts() {
      const tables = getTablesForRestaurant(restaurantId)
      const enRouteTables = tables.filter((t) => t.status === 'en_route')

      enRouteTables.forEach((table) => {
        const session = getActiveSessionForTable(table.id)
        if (!session) {
          // No session, revert to free
          updateTableStatus(table.id, 'free')
          return
        }

        const elapsed = Date.now() - new Date(session.startedAt).getTime()
        if (elapsed > TIMEOUT_MINUTES * 60 * 1000) {
          closeSession(session.id)
        }
      })
    }

    checkTimeouts()
    intervalRef.current = setInterval(checkTimeouts, 60000) // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [restaurantId, enabled])
}
