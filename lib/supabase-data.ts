/**
 * Capa de datos Supabase — funciones async que consultan PostgreSQL vía Supabase client.
 * Cada función convierte los rows snake_case de Supabase a los tipos camelCase de la app.
 */

import { createClient } from '@/lib/supabase/client'
import type { Restaurant, Table, MenuItem, Reservation, ReservationStatus, Review, TableSession, Order, OrderItem, User, TableStatus, OrderStatus, WaiterRotationState } from '@/types/database'
import type { Tables } from '@/types/supabase'

// ─── Mappers (snake_case → camelCase) ───────────────────────────────────────

function mapRestaurant(r: Tables<'restaurants'>): Restaurant {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    slug: r.slug,
    city: r.city,
    address: r.address,
    cuisineType: r.cuisine_type,
    capacity: r.capacity,
    description: r.description ?? '',
    phone: r.phone ?? '',
    openingHours: r.opening_hours ?? '',
    plan: r.plan,
    isActive: r.is_active,
    rating: Number(r.rating),
    reviewCount: r.review_count,
    images: r.images ?? [],
    createdAt: r.created_at,
  }
}

function mapTable(t: Tables<'tables'>): Table {
  return {
    id: t.id,
    restaurantId: t.restaurant_id,
    name: t.name,
    capacity: t.capacity,
    status: t.status as TableStatus,
    location: t.location ?? '',
    qrCode: t.qr_code ?? '',
    assignedWaiterId: t.assigned_waiter_id ?? undefined,
  }
}

function mapMenuItem(m: Tables<'menu_items'>): MenuItem {
  return {
    id: m.id,
    restaurantId: m.restaurant_id,
    name: m.name,
    description: m.description ?? '',
    price: Number(m.price),
    category: m.category,
    isAvailable: m.is_available,
    ...(m.image_url ? { imageUrl: m.image_url } : {}),
  }
}

function mapReservation(r: Tables<'reservations'>): Reservation {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    userPhone: r.user_phone ?? '',
    restaurantId: r.restaurant_id,
    restaurantName: r.restaurant_name,
    restaurantCity: r.restaurant_city ?? '',
    tableId: r.table_id ?? '',
    tableName: r.table_name ?? '',
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    status: r.status as ReservationStatus,
    specialRequests: r.special_requests ?? '',
    confirmationCode: r.confirmation_code,
    createdAt: r.created_at,
  }
}

function mapReview(r: Tables<'reviews'>): Review {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating as Review['rating'],
    comment: r.comment ?? '',
    createdAt: r.created_at,
  }
}

function mapSession(s: Tables<'table_sessions'>): TableSession {
  return {
    id: s.id,
    tableId: s.table_id,
    restaurantId: s.restaurant_id,
    startedAt: s.started_at,
    closedAt: s.closed_at,
    totalAmount: Number(s.total_amount),
    billRequested: s.bill_requested ?? false,
    billRequestedAt: s.bill_requested_at ?? undefined,
    waiterId: s.waiter_id ?? undefined,
  }
}

function mapProfile(p: Tables<'profiles'>): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    phone: p.phone ?? '',
    createdAt: p.created_at,
    ...(p.restaurant_id ? { restaurantId: p.restaurant_id } : {}),
    ...(p.username ? { username: p.username } : {}),
  }
}

// ─── Restaurants ────────────────────────────────────────────────────────────

export async function sbGetRestaurants(): Promise<Restaurant[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('restaurants').select('*').order('name')
  if (error) { console.error('sbGetRestaurants:', error.message); return [] }
  return data.map(mapRestaurant)
}

export async function sbGetRestaurantById(id: string): Promise<Restaurant | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapRestaurant(data)
}

export async function sbGetRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
  if (error || !data) return null
  return mapRestaurant(data)
}

export async function sbGetRestaurantsForOwner(ownerId: string): Promise<Restaurant[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('restaurants').select('*').eq('owner_id', ownerId)
  if (error) { console.error('sbGetRestaurantsForOwner:', error.message); return [] }
  return data.map(mapRestaurant)
}

export async function sbGetRestaurantForCurrentUser(): Promise<Restaurant | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get profile to check role
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return null

  if (profile.role === 'camarero' && profile.restaurant_id) {
    return sbGetRestaurantById(profile.restaurant_id)
  }

  // Owner — get first restaurant
  const rests = await sbGetRestaurantsForOwner(user.id)
  return rests[0] ?? null
}

export async function sbSaveRestaurant(restaurant: Restaurant): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('restaurants').update({
    name: restaurant.name,
    slug: restaurant.slug,
    city: restaurant.city,
    address: restaurant.address,
    cuisine_type: restaurant.cuisineType,
    capacity: restaurant.capacity,
    description: restaurant.description,
    phone: restaurant.phone,
    opening_hours: restaurant.openingHours,
    plan: restaurant.plan,
    is_active: restaurant.isActive,
    images: restaurant.images ?? [],
  }).eq('id', restaurant.id)
  if (error) console.error('sbSaveRestaurant:', error.message)
}

export async function sbGetRestaurantSlugs(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('restaurants').select('slug')
  if (error) return []
  return data.map((r) => r.slug)
}

// ─── Tables ─────────────────────────────────────────────────────────────────

export async function sbGetTableById(tableId: string): Promise<Table | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tables').select('*').eq('id', tableId).single()
  if (error || !data) { console.error('sbGetTableById:', error?.message); return null }
  return mapTable(data)
}

export async function sbGetTableByQrCode(qrCode: string): Promise<Table | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tables').select('*').eq('qr_code', qrCode).single()
  if (error || !data) { console.error('sbGetTableByQrCode:', error?.message); return null }
  return mapTable(data)
}

export async function sbGetTablesForRestaurant(restaurantId: string): Promise<Table[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('name')
  if (error) { console.error('sbGetTablesForRestaurant:', error.message); return [] }
  return data.map(mapTable)
}

export async function sbSaveTable(table: Table): Promise<void> {
  const supabase = createClient()
  const row = {
    restaurant_id: table.restaurantId,
    name: table.name,
    capacity: table.capacity,
    location: table.location,
    status: table.status,
    qr_code: table.qrCode,
  }
  // Upsert: if id looks like UUID, update; otherwise insert
  const { error } = await supabase.from('tables').upsert({ id: table.id, ...row })
  if (error) console.error('sbSaveTable:', error.message)
}

export async function sbDeleteTable(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tables').delete().eq('id', id)
  if (error) console.error('sbDeleteTable:', error.message)
}

export async function sbUpdateTableStatus(tableId: string, status: TableStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tables').update({ status }).eq('id', tableId)
  if (error) console.error('sbUpdateTableStatus:', error.message)
}

// ─── Menu Items ─────────────────────────────────────────────────────────────

export async function sbGetMenuForRestaurant(restaurantId: string): Promise<MenuItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('category').order('name')
  if (error) { console.error('sbGetMenuForRestaurant:', error.message); return [] }
  return data.map(mapMenuItem)
}

export async function sbSaveMenuItem(item: MenuItem): Promise<void> {
  const supabase = createClient()
  const row = {
    restaurant_id: item.restaurantId,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    is_available: item.isAvailable,
    image_url: item.imageUrl ?? null,
  }
  const { error } = await supabase.from('menu_items').upsert({ id: item.id, ...row })
  if (error) console.error('sbSaveMenuItem:', error.message)
}

export async function sbDeleteMenuItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) console.error('sbDeleteMenuItem:', error.message)
}

// ─── Reservations ───────────────────────────────────────────────────────────

export async function sbGetReservationsForRestaurant(restaurantId: string): Promise<Reservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('reservations').select('*').eq('restaurant_id', restaurantId).order('date', { ascending: false })
  if (error) { console.error('sbGetReservationsForRestaurant:', error.message); return [] }
  return data.map(mapReservation)
}

export async function sbGetReservationsForUser(userId: string): Promise<Reservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('reservations').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) { console.error('sbGetReservationsForUser:', error.message); return [] }
  return data.map(mapReservation)
}

export async function sbUpdateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) console.error('sbUpdateReservationStatus:', error.message)
}

export async function sbSaveReservation(reservation: Reservation): Promise<void> {
  const supabase = createClient()
  const row = {
    user_id: reservation.userId,
    restaurant_id: reservation.restaurantId,
    table_id: reservation.tableId || null,
    user_name: reservation.userName,
    user_email: reservation.userEmail,
    user_phone: reservation.userPhone,
    restaurant_name: reservation.restaurantName,
    restaurant_city: reservation.restaurantCity,
    table_name: reservation.tableName,
    date: reservation.date,
    time: reservation.time,
    party_size: reservation.partySize,
    status: reservation.status,
    special_requests: reservation.specialRequests,
    confirmation_code: reservation.confirmationCode,
  }
  const { error } = await supabase.from('reservations').upsert({ id: reservation.id, ...row })
  if (error) console.error('sbSaveReservation:', error.message)
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export async function sbGetReviewsForRestaurant(restaurantId: string): Promise<Review[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('reviews').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false })
  if (error) { console.error('sbGetReviewsForRestaurant:', error.message); return [] }
  return data.map(mapReview)
}

export async function sbSaveReview(review: Review): Promise<void> {
  const supabase = createClient()
  const row = {
    restaurant_id: review.restaurantId,
    user_id: review.userId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
  }
  const { error } = await supabase.from('reviews').upsert({ id: review.id, ...row })
  if (error) console.error('sbSaveReview:', error.message)
}

export async function sbDeleteReview(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) console.error('sbDeleteReview:', error.message)
}

// ─── TPV: Sessions ──────────────────────────────────────────────────────────

export async function sbGetSessionsForRestaurant(restaurantId: string): Promise<TableSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('table_sessions').select('*').eq('restaurant_id', restaurantId)
  if (error) { console.error('sbGetSessionsForRestaurant:', error.message); return [] }
  return data.map(mapSession)
}

export async function sbGetActiveSessionForTable(tableId: string): Promise<TableSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('table_sessions').select('*').eq('table_id', tableId).is('closed_at', null).single()
  if (error || !data) return null
  return mapSession(data)
}

export async function sbCreateSession(tableId: string, restaurantId: string): Promise<TableSession> {
  const supabase = createClient()
  const { data, error } = await supabase.from('table_sessions').insert({
    table_id: tableId,
    restaurant_id: restaurantId,
  }).select().single()
  if (error) throw new Error(error.message)
  await sbUpdateTableStatus(tableId, 'occupied')
  return mapSession(data!)
}

export async function sbCloseSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { data: session } = await supabase.from('table_sessions').select('table_id').eq('id', sessionId).single()
  const { error } = await supabase.from('table_sessions').update({ closed_at: new Date().toISOString() }).eq('id', sessionId)
  if (error) console.error('sbCloseSession:', error.message)
  if (session) await sbUpdateTableStatus(session.table_id, 'free')
}

export async function sbGetSessionById(sessionId: string): Promise<TableSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('table_sessions').select('*').eq('id', sessionId).single()
  if (error || !data) { console.error('sbGetSessionById:', error?.message); return null }
  return mapSession(data)
}

export async function sbRequestBill(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('table_sessions').update({
    bill_requested: true,
    bill_requested_at: new Date().toISOString(),
  }).eq('id', sessionId)
  if (error) console.error('sbRequestBill:', error.message)
}

// ─── TPV: Orders ────────────────────────────────────────────────────────────

export async function sbGetOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
  const supabase = createClient()
  const { data: orders, error } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false })
  if (error) { console.error('sbGetOrdersForRestaurant:', error.message); return [] }

  // Fetch all order items for these orders in one query
  const orderIds = orders.map((o) => o.id)
  if (orderIds.length === 0) return []

  const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds)
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push({
      id: item.id,
      orderId: item.order_id,
      menuItemId: item.menu_item_id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      notes: item.notes ?? '',
    })
    itemsByOrder.set(item.order_id, list)
  }

  return orders.map((o) => ({
    id: o.id,
    sessionId: o.session_id,
    tableId: o.table_id,
    restaurantId: o.restaurant_id,
    status: o.status as OrderStatus,
    notes: o.notes ?? '',
    createdAt: o.created_at,
    items: itemsByOrder.get(o.id) ?? [],
  }))
}

export async function sbGetOrdersForSession(sessionId: string): Promise<Order[]> {
  const supabase = createClient()
  const { data: orders, error } = await supabase.from('orders').select('*').eq('session_id', sessionId)
  if (error) return []

  const orderIds = orders.map((o) => o.id)
  if (orderIds.length === 0) return []

  const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds)
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push({
      id: item.id,
      orderId: item.order_id,
      menuItemId: item.menu_item_id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      notes: item.notes ?? '',
    })
    itemsByOrder.set(item.order_id, list)
  }

  return orders.map((o) => ({
    id: o.id,
    sessionId: o.session_id,
    tableId: o.table_id,
    restaurantId: o.restaurant_id,
    status: o.status as OrderStatus,
    notes: o.notes ?? '',
    createdAt: o.created_at,
    items: itemsByOrder.get(o.id) ?? [],
  }))
}

export async function sbCreateOrder(
  sessionId: string,
  tableId: string,
  restaurantId: string,
  items: Omit<OrderItem, 'id' | 'orderId'>[],
  notes: string = ''
): Promise<Order> {
  const supabase = createClient()
  const { data: order, error } = await supabase.from('orders').insert({
    session_id: sessionId,
    table_id: tableId,
    restaurant_id: restaurantId,
    notes,
  }).select().single()
  if (error || !order) throw new Error(error?.message ?? 'Failed to create order')

  const orderItems = items.map((i) => ({
    order_id: order.id,
    menu_item_id: i.menuItemId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    notes: i.notes ?? '',
  }))
  const { data: savedItems } = await supabase.from('order_items').insert(orderItems).select()

  return {
    id: order.id,
    sessionId: order.session_id,
    tableId: order.table_id,
    restaurantId: order.restaurant_id,
    status: order.status as OrderStatus,
    notes: order.notes ?? '',
    createdAt: order.created_at,
    items: (savedItems ?? []).map((i) => ({
      id: i.id,
      orderId: i.order_id,
      menuItemId: i.menu_item_id,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
      notes: i.notes ?? '',
    })),
  }
}

export async function sbUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) console.error('sbUpdateOrderStatus:', error.message)
}

export async function sbGetPendingOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
  const allOrders = await sbGetOrdersForRestaurant(restaurantId)
  return allOrders.filter((o) => o.status === 'pending' || o.status === 'preparing')
}

// ─── Camareros ──────────────────────────────────────────────────────────────

export async function sbGetCamarerosForRestaurant(restaurantId: string): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'camarero').eq('restaurant_id', restaurantId)
  if (error) { console.error('sbGetCamarerosForRestaurant:', error.message); return [] }
  return data.map(mapProfile)
}

export async function sbIsUsernameTaken(username: string, restaurantId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('id').eq('role', 'camarero').eq('restaurant_id', restaurantId).eq('username', username).limit(1)
  return (data?.length ?? 0) > 0
}

// ─── Waiter Assignment & Rotation ────────────────────────────────────────────

export async function sbAssignWaiterToTable(tableId: string, waiterId: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tables').update({ assigned_waiter_id: waiterId }).eq('id', tableId)
  if (error) console.error('sbAssignWaiterToTable:', error.message)
}

export async function sbGetRotationState(restaurantId: string): Promise<WaiterRotationState | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('waiter_rotation_state').select('*').eq('restaurant_id', restaurantId).single()
  if (error || !data) return null
  return {
    restaurantId: data.restaurant_id,
    lastRotationDate: data.last_rotation_date,
    lastExtraWaiterId: data.last_extra_waiter_id,
    updatedAt: data.updated_at,
  }
}

async function sbSaveRotationState(state: WaiterRotationState): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('waiter_rotation_state').upsert({
    restaurant_id: state.restaurantId,
    last_rotation_date: state.lastRotationDate,
    last_extra_waiter_id: state.lastExtraWaiterId,
    updated_at: new Date().toISOString(),
  })
  if (error) console.error('sbSaveRotationState:', error.message)
}

/**
 * Rotate waiter-table assignments via Supabase.
 * Only runs once per day. Returns true if rotation happened.
 */
export async function sbRotateWaiterAssignments(restaurantId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  const state = await sbGetRotationState(restaurantId)

  if (state && state.lastRotationDate === today) return false

  const tables = (await sbGetTablesForRestaurant(restaurantId))
    .filter((t) => t.status !== 'inactive')
    .sort((a, b) => a.name.localeCompare(b.name))

  const waiters = (await sbGetCamarerosForRestaurant(restaurantId))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (waiters.length === 0 || tables.length === 0) return false

  const tablesPerWaiter = Math.floor(tables.length / waiters.length)
  const extraTables = tables.length % waiters.length

  let extraStartIdx = 0
  if (state?.lastExtraWaiterId) {
    const lastIdx = waiters.findIndex((w) => w.id === state.lastExtraWaiterId)
    if (lastIdx >= 0) extraStartIdx = (lastIdx + 1) % waiters.length
  }

  const supabase = createClient()
  let tableIdx = 0
  let newExtraWaiterId: string | null = null

  for (let i = 0; i < waiters.length; i++) {
    const waiterIdx = (extraStartIdx + i) % waiters.length
    const waiter = waiters[waiterIdx]
    const count = tablesPerWaiter + (i < extraTables ? 1 : 0)
    if (i < extraTables) newExtraWaiterId = waiter.id

    for (let j = 0; j < count; j++) {
      if (tableIdx < tables.length) {
        await supabase.from('tables').update({ assigned_waiter_id: waiter.id }).eq('id', tables[tableIdx].id)
        tableIdx++
      }
    }
  }

  await sbSaveRotationState({
    restaurantId,
    lastRotationDate: today,
    lastExtraWaiterId: newExtraWaiterId,
    updatedAt: new Date().toISOString(),
  })

  return true
}

export async function sbGetTablesForWaiter(restaurantId: string, waiterId: string): Promise<Table[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).eq('assigned_waiter_id', waiterId)
  if (error) { console.error('sbGetTablesForWaiter:', error.message); return [] }
  return data.map(mapTable)
}
