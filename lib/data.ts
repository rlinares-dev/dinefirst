import type { User, Restaurant, Table, MenuItem, Reservation, ReservationStatus, Review, TableStatus, TableSession, Order, OrderStatus, OrderItem, WaiterRotationState } from '@/types/database'
import {
  MOCK_USERS,
  MOCK_RESTAURANTS,
  MOCK_TABLES,
  MOCK_MENU_ITEMS,
  MOCK_RESERVATIONS,
  MOCK_REVIEWS,
  MOCK_SESSIONS,
  MOCK_ORDERS,
} from './mock-data'

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, defaults: T): T {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(defaults))
  const raw = localStorage.getItem(key)
  if (!raw) {
    const json = JSON.stringify(defaults)
    localStorage.setItem(key, json)
    return JSON.parse(json) as T
  }
  return JSON.parse(raw) as T
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'DF-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

const KEY_USER = 'df_user'

export function getUser(): User | null {
  return load<User | null>(KEY_USER, null)
}

export function setUser(user: User): void {
  save(KEY_USER, user)
}

export function clearUser(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(KEY_USER)
}

// ─── User Registry ────────────────────────────────────────────────────────────

const KEY_USERS = 'df_users'

export function getUsers(): User[] {
  const stored = load<User[]>(KEY_USERS, MOCK_USERS)
  // Migración: fusiona usuarios del mock que falten en localStorage
  // (p.ej. camareros añadidos en versiones posteriores). Así un usuario
  // que cacheó `df_users` antes de existir los camareros puede loguearse
  // como empleado sin borrar su localStorage.
  if (typeof window === 'undefined') return stored
  const storedIds = new Set(stored.map((u) => u.id))
  const missing = MOCK_USERS.filter((u) => !storedIds.has(u.id))
  if (missing.length === 0) return stored
  const merged = [...stored, ...missing]
  save(KEY_USERS, merged)
  return merged
}

export function loginWithCredentials(email: string, password: string): User | null {
  if (password !== 'password123') return null
  return getUsers().find((u) => u.email === email && u.role !== 'camarero') ?? null
}

export function loginCamarero(username: string, password: string, restaurantSlug: string): User | null {
  if (password !== 'password123') return null

  // Paso 1: intentar con los datos mock "limpios" (inmunes a contaminación
  // desde Supabase en localStorage). Así las cuentas demo elena/diego
  // funcionan aunque `df_restaurants` tenga UUIDs de Supabase.
  const mockRestaurant = MOCK_RESTAURANTS.find((r) => r.slug === restaurantSlug)
  if (mockRestaurant) {
    const mockCamarero = MOCK_USERS.find(
      (u) => u.role === 'camarero' && u.restaurantId === mockRestaurant.id && u.username === username,
    )
    if (mockCamarero) return mockCamarero
  }

  // Paso 2: intentar con lo que haya en localStorage (camareros creados
  // desde el dashboard de "Equipo" se guardan aquí).
  const restaurants = load<Restaurant[]>(KEY_RESTAURANTS, MOCK_RESTAURANTS)
  const restaurant = restaurants.find((r) => r.slug === restaurantSlug)
  if (!restaurant) return null
  return (
    getUsers().find(
      (u) => u.role === 'camarero' && u.restaurantId === restaurant.id && u.username === username,
    ) ?? null
  )
}

export function getRestaurantSlugs(): string[] {
  const restaurants = load<Restaurant[]>(KEY_RESTAURANTS, MOCK_RESTAURANTS)
  return restaurants.map((r) => r.slug)
}

export function getCamarerosForRestaurant(restaurantId: string): User[] {
  return getUsers().filter((u) => u.role === 'camarero' && u.restaurantId === restaurantId)
}

export function isUsernameTaken(username: string, restaurantId: string): boolean {
  return getCamarerosForRestaurant(restaurantId).some((u) => u.username === username)
}

export function createCamarero(data: { name: string; username: string; phone: string; restaurantId: string }): User {
  const users = getUsers()
  const newUser: User = {
    id: generateId(),
    name: data.name,
    email: '',
    username: data.username,
    role: 'camarero',
    phone: data.phone,
    createdAt: new Date().toISOString(),
    restaurantId: data.restaurantId,
  }
  users.push(newUser)
  save(KEY_USERS, users)
  return newUser
}

export function deleteCamarero(id: string): void {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === id && u.role === 'camarero')
  if (idx >= 0) {
    users.splice(idx, 1)
    save(KEY_USERS, users)
  }
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

const KEY_RESTAURANTS = 'df_restaurants'

export function getRestaurants(): Restaurant[] {
  return load<Restaurant[]>(KEY_RESTAURANTS, MOCK_RESTAURANTS)
}

export function getRestaurantBySlug(city: string, slug: string): Restaurant | null {
  const restaurants = getRestaurants()
  return restaurants.find((r) => r.city === city && r.slug === slug) ?? null
}

export function getRestaurantById(id: string): Restaurant | null {
  return getRestaurants().find((r) => r.id === id) ?? null
}

export function getRestaurantsForOwner(ownerId: string): Restaurant[] {
  return getRestaurants().filter((r) => r.ownerId === ownerId)
}

export function getRestaurantForCurrentUser(): Restaurant | null {
  const user = getUser()
  if (!user) return null
  if (user.role === 'camarero' && user.restaurantId) {
    return getRestaurantById(user.restaurantId)
  }
  const rests = getRestaurantsForOwner(user.id)
  return rests[0] ?? getRestaurantById('rest-1')
}

export function saveRestaurant(restaurant: Restaurant): void {
  const list = getRestaurants()
  const idx = list.findIndex((r) => r.id === restaurant.id)
  if (idx >= 0) list[idx] = restaurant
  else list.push(restaurant)
  save(KEY_RESTAURANTS, list)
}

// ─── Tables ──────────────────────────────────────────────────────────────────

const KEY_TABLES = 'df_tables'

export function getTables(): Table[] {
  return load<Table[]>(KEY_TABLES, MOCK_TABLES)
}

export function getTablesForRestaurant(restaurantId: string): Table[] {
  return getTables().filter((t) => t.restaurantId === restaurantId)
}

export function saveTable(table: Table): void {
  const list = getTables()
  const idx = list.findIndex((t) => t.id === table.id)
  if (idx >= 0) list[idx] = table
  else list.push(table)
  save(KEY_TABLES, list)
}

export function deleteTable(id: string): void {
  const list = getTables().filter((t) => t.id !== id)
  save(KEY_TABLES, list)
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

const KEY_MENU = 'df_menu_items'

export function getMenuItems(): MenuItem[] {
  return load<MenuItem[]>(KEY_MENU, MOCK_MENU_ITEMS)
}

export function getMenuForRestaurant(restaurantId: string): MenuItem[] {
  return getMenuItems().filter((m) => m.restaurantId === restaurantId)
}

export function saveMenuItem(item: MenuItem): void {
  const list = getMenuItems()
  const idx = list.findIndex((m) => m.id === item.id)
  if (idx >= 0) list[idx] = item
  else list.push(item)
  save(KEY_MENU, list)
}

export function deleteMenuItem(id: string): void {
  const list = getMenuItems().filter((m) => m.id !== id)
  save(KEY_MENU, list)
}

// ─── Reservations ─────────────────────────────────────────────────────────────

const KEY_RESERVATIONS = 'df_reservations'

export function getReservations(): Reservation[] {
  return load<Reservation[]>(KEY_RESERVATIONS, MOCK_RESERVATIONS)
}

export function getReservationsForRestaurant(restaurantId: string): Reservation[] {
  return getReservations().filter((r) => r.restaurantId === restaurantId)
}

export function getReservationsForUser(userId: string): Reservation[] {
  return getReservations().filter((r) => r.userId === userId)
}

export function saveReservation(reservation: Reservation): void {
  const list = getReservations()
  const idx = list.findIndex((r) => r.id === reservation.id)
  if (idx >= 0) list[idx] = reservation
  else list.push(reservation)
  save(KEY_RESERVATIONS, list)
}

export function updateReservationStatus(id: string, status: ReservationStatus): void {
  const list = getReservations()
  const item = list.find((r) => r.id === id)
  if (item) {
    item.status = status
    save(KEY_RESERVATIONS, list)
  }
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

const KEY_REVIEWS = 'df_reviews'

export function getReviews(): Review[] {
  return load<Review[]>(KEY_REVIEWS, MOCK_REVIEWS)
}

export function getReviewsForRestaurant(restaurantId: string): Review[] {
  return getReviews().filter((r) => r.restaurantId === restaurantId)
}

export function saveReview(review: Review): void {
  const list = getReviews()
  const idx = list.findIndex((r) => r.id === review.id)
  if (idx >= 0) list[idx] = review
  else list.push(review)
  save(KEY_REVIEWS, list)
}

export function deleteReview(id: string): void {
  const list = getReviews().filter((r) => r.id !== id)
  save(KEY_REVIEWS, list)
}

export function respondToReview(reviewId: string, response: string): void {
  const list = getReviews()
  const review = list.find((r) => r.id === reviewId)
  if (review) {
    review.response = response
    review.respondedAt = new Date().toISOString()
    save(KEY_REVIEWS, list)
  }
}

export function recalculateRestaurantRating(restaurantId: string): void {
  const reviews = getReviewsForRestaurant(restaurantId)
  const restaurant = getRestaurantById(restaurantId)
  if (!restaurant) return
  if (reviews.length === 0) {
    saveRestaurant({ ...restaurant, rating: 0, reviewCount: 0 })
    return
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  saveRestaurant({
    ...restaurant,
    rating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  })
}

/**
 * Check if a user can leave a verified review for a restaurant.
 * Returns the reservationId if a confirmed/completed reservation exists
 * that hasn't been reviewed yet.
 */
export function getVerifiableReservation(userId: string, restaurantId: string): string | null {
  const reservations = getReservationsForUser(userId)
    .filter((r) => r.restaurantId === restaurantId && r.status === 'confirmed')
  const reviews = getReviewsForRestaurant(restaurantId)
  const reviewedReservationIds = new Set(reviews.filter((r) => r.reservationId).map((r) => r.reservationId))
  const unreviewedReservation = reservations.find((r) => !reviewedReservationIds.has(r.id))
  return unreviewedReservation?.id ?? null
}

/**
 * Check if a user already reviewed a specific restaurant (any review, verified or not).
 */
export function hasUserReviewedRestaurant(userId: string, restaurantId: string): boolean {
  return getReviewsForRestaurant(restaurantId).some((r) => r.userId === userId)
}

// ─── Table Status ────────────────────────────────────────────────────────────

export function getTablesByStatus(restaurantId: string, status: TableStatus): Table[] {
  return getTablesForRestaurant(restaurantId).filter((t) => t.status === status)
}

export function updateTableStatus(tableId: string, status: TableStatus): void {
  const list = getTables()
  const table = list.find((t) => t.id === tableId)
  if (table) {
    table.status = status
    save(KEY_TABLES, list)
  }
}

export function getTableByQrCode(qrCode: string): Table | null {
  return getTables().find((t) => t.qrCode === qrCode) ?? null
}

// ─── Table Sessions ──────────────────────────────────────────────────────────

const KEY_SESSIONS = 'df_sessions'

export function getSessions(): TableSession[] {
  return load<TableSession[]>(KEY_SESSIONS, MOCK_SESSIONS)
}

export function getActiveSessionForTable(tableId: string): TableSession | null {
  return getSessions().find((s) => s.tableId === tableId && !s.closedAt) ?? null
}

export function getSessionsForRestaurant(restaurantId: string): TableSession[] {
  return getSessions().filter((s) => s.restaurantId === restaurantId)
}

export function createSession(tableId: string, restaurantId: string): TableSession {
  const session: TableSession = {
    id: generateId(),
    tableId,
    restaurantId,
    startedAt: new Date().toISOString(),
    closedAt: null,
    totalAmount: 0,
  }
  const list = getSessions()
  list.push(session)
  save(KEY_SESSIONS, list)
  updateTableStatus(tableId, 'occupied')
  return session
}

export function closeSession(sessionId: string): void {
  const list = getSessions()
  const session = list.find((s) => s.id === sessionId)
  if (session) {
    session.closedAt = new Date().toISOString()
    // Calculate total from orders
    const orders = getOrdersForSession(sessionId)
    session.totalAmount = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
      0
    )
    save(KEY_SESSIONS, list)
    updateTableStatus(session.tableId, 'free')
  }
}

export function getSessionById(sessionId: string): TableSession | null {
  return getSessions().find((s) => s.id === sessionId) ?? null
}

export function requestBill(sessionId: string): void {
  const list = getSessions()
  const session = list.find((s) => s.id === sessionId)
  if (session) {
    session.billRequested = true
    session.billRequestedAt = new Date().toISOString()
    // Pre-calculate total from non-cancelled orders
    const orders = getOrdersForSession(sessionId)
    session.totalAmount = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0)
    save(KEY_SESSIONS, list)
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

const KEY_ORDERS = 'df_orders'

export function getOrders(): Order[] {
  return load<Order[]>(KEY_ORDERS, MOCK_ORDERS)
}

export function getOrdersForSession(sessionId: string): Order[] {
  return getOrders().filter((o) => o.sessionId === sessionId)
}

export function getOrdersForRestaurant(restaurantId: string): Order[] {
  return getOrders().filter((o) => o.restaurantId === restaurantId)
}

export function getPendingOrdersForRestaurant(restaurantId: string): Order[] {
  return getOrdersForRestaurant(restaurantId).filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  )
}

export function createOrder(
  sessionId: string,
  tableId: string,
  restaurantId: string,
  items: Omit<OrderItem, 'id' | 'orderId'>[],
  notes: string = ''
): Order {
  const orderId = generateId()
  const order: Order = {
    id: orderId,
    sessionId,
    tableId,
    restaurantId,
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      ...item,
      id: generateId(),
      orderId,
    })),
  }
  const list = getOrders()
  list.push(order)
  save(KEY_ORDERS, list)
  return order
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const list = getOrders()
  const order = list.find((o) => o.id === orderId)
  if (order) {
    order.status = status
    save(KEY_ORDERS, list)
  }
}

// ─── Image utilities ─────────────────────────────────────────────────────────

const MAX_IMG_SIZE = 800
const IMG_QUALITY = 0.7

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > MAX_IMG_SIZE || height > MAX_IMG_SIZE) {
          if (width > height) {
            height = (height * MAX_IMG_SIZE) / width
            width = MAX_IMG_SIZE
          } else {
            width = (width * MAX_IMG_SIZE) / height
            height = MAX_IMG_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Waiter Assignment & Rotation ────────────────────────────────────────────

const KEY_ROTATION_STATE = 'df_rotation_state'

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getRotationState(restaurantId: string): WaiterRotationState | null {
  const all = load<Record<string, WaiterRotationState>>(KEY_ROTATION_STATE, {})
  return all[restaurantId] ?? null
}

function saveRotationState(state: WaiterRotationState): void {
  const all = load<Record<string, WaiterRotationState>>(KEY_ROTATION_STATE, {})
  all[state.restaurantId] = state
  save(KEY_ROTATION_STATE, all)
}

export function assignWaiterToTable(tableId: string, waiterId: string | null): void {
  const list = getTables()
  const idx = list.findIndex((t) => t.id === tableId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], assignedWaiterId: waiterId ?? undefined }
    save(KEY_TABLES, list)
  }
}

/**
 * Rotate waiter-table assignments for a restaurant.
 * Only runs once per day (based on lastRotationDate).
 * Returns true if rotation happened, false if skipped.
 */
export function rotateWaiterAssignments(restaurantId: string): boolean {
  const today = getTodayDate()
  const state = getRotationState(restaurantId)

  // Skip if already rotated today
  if (state && state.lastRotationDate === today) return false

  const tables = getTablesForRestaurant(restaurantId)
    .filter((t) => t.status !== 'inactive')
    .sort((a, b) => a.name.localeCompare(b.name))

  const waiters = getCamarerosForRestaurant(restaurantId)
    .sort((a, b) => a.id.localeCompare(b.id))

  if (waiters.length === 0 || tables.length === 0) return false

  // Round-robin assignment
  const assignments: Record<string, string> = {}
  const tablesPerWaiter = Math.floor(tables.length / waiters.length)
  const extraTables = tables.length % waiters.length

  // Determine who gets extra tables — alternate from last time
  let extraStartIdx = 0
  if (state?.lastExtraWaiterId) {
    const lastIdx = waiters.findIndex((w) => w.id === state.lastExtraWaiterId)
    if (lastIdx >= 0) extraStartIdx = (lastIdx + 1) % waiters.length
  }

  let tableIdx = 0
  let newExtraWaiterId: string | null = null

  for (let i = 0; i < waiters.length; i++) {
    const waiterIdx = (extraStartIdx + i) % waiters.length
    const waiter = waiters[waiterIdx]
    const count = tablesPerWaiter + (i < extraTables ? 1 : 0)
    if (i < extraTables) newExtraWaiterId = waiter.id

    for (let j = 0; j < count; j++) {
      if (tableIdx < tables.length) {
        assignments[tables[tableIdx].id] = waiter.id
        tableIdx++
      }
    }
  }

  // Apply assignments
  const allTables = getTables()
  for (const [tId, wId] of Object.entries(assignments)) {
    const idx = allTables.findIndex((t) => t.id === tId)
    if (idx >= 0) allTables[idx] = { ...allTables[idx], assignedWaiterId: wId }
  }
  save(KEY_TABLES, allTables)

  // Save rotation state
  saveRotationState({
    restaurantId,
    lastRotationDate: today,
    lastExtraWaiterId: newExtraWaiterId,
    updatedAt: new Date().toISOString(),
  })

  return true
}

export function getTablesForWaiter(restaurantId: string, waiterId: string): Table[] {
  return getTablesForRestaurant(restaurantId).filter((t) => t.assignedWaiterId === waiterId)
}
