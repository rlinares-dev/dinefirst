import { getTablesForRestaurant, updateTableStatus, createSession, getActiveSessionForTable } from '@/lib/data'

// We test the timeout logic directly rather than the hook (which needs React)
// This tests the same logic that useTableTimeout performs each tick

beforeEach(() => {
  localStorage.clear()
})

describe('Table timeout logic', () => {
  it('reverts en_route table to free when no session exists', () => {
    const tables = getTablesForRestaurant('rest-1')
    const table = tables.find((t) => t.status === 'free')!
    updateTableStatus(table.id, 'en_route')

    // Simulate timeout check: no session → revert to free
    const enRouteTables = getTablesForRestaurant('rest-1').filter((t) => t.status === 'en_route')
    enRouteTables.forEach((t) => {
      const session = getActiveSessionForTable(t.id)
      if (!session) {
        updateTableStatus(t.id, 'free')
      }
    })

    const updated = getTablesForRestaurant('rest-1').find((t) => t.id === table.id)
    expect(updated?.status).toBe('free')
  })

  it('keeps en_route table with active recent session', () => {
    const tables = getTablesForRestaurant('rest-1')
    const table = tables.find((t) => t.status === 'free')!

    // Create session (marks as occupied), then set to en_route manually
    const session = createSession(table.id, 'rest-1')
    updateTableStatus(table.id, 'en_route')

    // Simulate timeout check: session exists, startedAt is recent → keep
    const TIMEOUT_MS = 15 * 60 * 1000
    const enRouteTables = getTablesForRestaurant('rest-1').filter((t) => t.status === 'en_route')
    enRouteTables.forEach((t) => {
      const activeSession = getActiveSessionForTable(t.id)
      if (!activeSession) {
        updateTableStatus(t.id, 'free')
        return
      }
      const elapsed = Date.now() - new Date(activeSession.startedAt).getTime()
      if (elapsed > TIMEOUT_MS) {
        updateTableStatus(t.id, 'free')
      }
    })

    const updated = getTablesForRestaurant('rest-1').find((t) => t.id === table.id)
    expect(updated?.status).toBe('en_route') // Still en_route — session is recent
  })
})
