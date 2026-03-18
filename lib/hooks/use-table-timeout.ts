import { useEffect, useRef } from 'react'
import { getTablesForRestaurant, getActiveSessionForTable, updateTableStatus, closeSession } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import { sbGetTablesForRestaurant, sbGetActiveSessionForTable, sbUpdateTableStatus, sbCloseSession } from '@/lib/supabase-data'

const TIMEOUT_MINUTES = 15

/**
 * Auto-reverts tables in `en_route` status back to `free`
 * if no session activity for TIMEOUT_MINUTES.
 */
export function useTableTimeout(restaurantId: string, enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled || !restaurantId) return

    async function checkTimeouts() {
      const sb = isSupabaseConfigured()
      const tables = sb
        ? await sbGetTablesForRestaurant(restaurantId)
        : getTablesForRestaurant(restaurantId)
      const enRouteTables = tables.filter((t) => t.status === 'en_route')

      for (const table of enRouteTables) {
        const session = sb
          ? await sbGetActiveSessionForTable(table.id)
          : getActiveSessionForTable(table.id)
        if (!session) {
          if (sb) { await sbUpdateTableStatus(table.id, 'free') } else { updateTableStatus(table.id, 'free') }
          continue
        }

        const elapsed = Date.now() - new Date(session.startedAt).getTime()
        if (elapsed > TIMEOUT_MINUTES * 60 * 1000) {
          if (sb) { await sbCloseSession(session.id) } else { closeSession(session.id) }
        }
      }
    }

    checkTimeouts()
    intervalRef.current = setInterval(checkTimeouts, 60000) // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [restaurantId, enabled])
}
