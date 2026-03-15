import {
  getTablesForRestaurant,
  updateTableStatus,
  getTablesByStatus,
  getTableByQrCode,
  createSession,
  closeSession,
  getActiveSessionForTable,
  getSessionsForRestaurant,
  createOrder,
  getOrdersForSession,
  getOrdersForRestaurant,
  getPendingOrdersForRestaurant,
  updateOrderStatus,
} from '@/lib/data'

beforeEach(() => {
  localStorage.clear()
})

// Use t1-6 (free, 8 seats, Privado) — guaranteed no mock session
const FREE_TABLE_ID = 't1-6'

// ─── Tables ───────────────────────────────────────────────────────────────────

describe('Table management', () => {
  it('loads mock tables for restaurant rest-1', () => {
    const tables = getTablesForRestaurant('rest-1')
    expect(tables.length).toBeGreaterThan(0)
    tables.forEach((t) => expect(t.restaurantId).toBe('rest-1'))
  })

  it('updateTableStatus changes a table status', () => {
    updateTableStatus(FREE_TABLE_ID, 'occupied')
    const updated = getTablesForRestaurant('rest-1').find((t) => t.id === FREE_TABLE_ID)
    expect(updated?.status).toBe('occupied')
  })

  it('getTablesByStatus filters correctly', () => {
    const freeTables = getTablesByStatus('rest-1', 'free')
    expect(freeTables.length).toBeGreaterThan(0)
    freeTables.forEach((t) => expect(t.status).toBe('free'))
  })

  it('getTableByQrCode finds a table by QR', () => {
    const found = getTableByQrCode('df-rest1-t6')
    expect(found).not.toBeNull()
    expect(found?.id).toBe(FREE_TABLE_ID)
  })

  it('getTableByQrCode returns null for unknown code', () => {
    expect(getTableByQrCode('nonexistent-qr')).toBeNull()
  })
})

// ─── Sessions ─────────────────────────────────────────────────────────────────

describe('Session management', () => {
  it('createSession creates a session and marks table occupied', () => {
    const session = createSession(FREE_TABLE_ID, 'rest-1')
    expect(session.tableId).toBe(FREE_TABLE_ID)
    expect(session.restaurantId).toBe('rest-1')
    expect(session.closedAt).toBeNull()

    const updatedTable = getTablesForRestaurant('rest-1').find((t) => t.id === FREE_TABLE_ID)
    expect(updatedTable?.status).toBe('occupied')
  })

  it('getActiveSessionForTable returns the open session', () => {
    const session = createSession(FREE_TABLE_ID, 'rest-1')

    const active = getActiveSessionForTable(FREE_TABLE_ID)
    expect(active).not.toBeNull()
    expect(active?.id).toBe(session.id)
  })

  it('closeSession closes session and frees table', () => {
    const session = createSession(FREE_TABLE_ID, 'rest-1')
    closeSession(session.id)

    const active = getActiveSessionForTable(FREE_TABLE_ID)
    expect(active).toBeNull()

    const updatedTable = getTablesForRestaurant('rest-1').find((t) => t.id === FREE_TABLE_ID)
    expect(updatedTable?.status).toBe('free')
  })

  it('closeSession calculates total from orders', () => {
    const session = createSession(FREE_TABLE_ID, 'rest-1')

    createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-1', name: 'Test Item', price: 12.5, quantity: 2, notes: '' },
    ])

    closeSession(session.id)

    const sessions = getSessionsForRestaurant('rest-1')
    const closed = sessions.find((s) => s.id === session.id)
    expect(closed?.totalAmount).toBe(25)
  })

  it('getSessionsForRestaurant returns all sessions for a restaurant', () => {
    const sessions = getSessionsForRestaurant('rest-1')
    sessions.forEach((s) => expect(s.restaurantId).toBe('rest-1'))
  })
})

// ─── Orders ───────────────────────────────────────────────────────────────────

describe('Order management', () => {
  function setupSession() {
    return createSession(FREE_TABLE_ID, 'rest-1')
  }

  it('createOrder creates an order with correct items', () => {
    const session = setupSession()

    const order = createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-1', name: 'Bruschetta', price: 8.5, quantity: 1, notes: '' },
      { menuItemId: 'mi-2', name: 'Risotto', price: 14.0, quantity: 2, notes: 'Sin queso' },
    ], 'Mesa exterior')

    expect(order.sessionId).toBe(session.id)
    expect(order.status).toBe('pending')
    expect(order.notes).toBe('Mesa exterior')
    expect(order.items).toHaveLength(2)
    expect(order.items[0].name).toBe('Bruschetta')
    expect(order.items[1].notes).toBe('Sin queso')
  })

  it('getOrdersForSession returns orders for a specific session', () => {
    const session = setupSession()

    createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-1', name: 'Test', price: 10, quantity: 1, notes: '' },
    ])

    const orders = getOrdersForSession(session.id)
    expect(orders.length).toBeGreaterThanOrEqual(1)
    orders.forEach((o) => expect(o.sessionId).toBe(session.id))
  })

  it('getOrdersForRestaurant returns orders for the restaurant', () => {
    const orders = getOrdersForRestaurant('rest-1')
    orders.forEach((o) => expect(o.restaurantId).toBe('rest-1'))
  })

  it('updateOrderStatus transitions order status', () => {
    const session = setupSession()

    const order = createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-1', name: 'Test', price: 10, quantity: 1, notes: '' },
    ])
    expect(order.status).toBe('pending')

    updateOrderStatus(order.id, 'preparing')
    const updated = getOrdersForSession(session.id).find((o) => o.id === order.id)
    expect(updated?.status).toBe('preparing')

    updateOrderStatus(order.id, 'served')
    const served = getOrdersForSession(session.id).find((o) => o.id === order.id)
    expect(served?.status).toBe('served')
  })

  it('getPendingOrdersForRestaurant returns only pending/preparing', () => {
    const session = setupSession()

    const o1 = createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-1', name: 'A', price: 5, quantity: 1, notes: '' },
    ])
    const o2 = createOrder(session.id, FREE_TABLE_ID, 'rest-1', [
      { menuItemId: 'mi-2', name: 'B', price: 5, quantity: 1, notes: '' },
    ])
    updateOrderStatus(o2.id, 'served')

    const pending = getPendingOrdersForRestaurant('rest-1')
    const pendingIds = pending.map((o) => o.id)
    expect(pendingIds).toContain(o1.id)
    expect(pendingIds).not.toContain(o2.id)
  })
})
