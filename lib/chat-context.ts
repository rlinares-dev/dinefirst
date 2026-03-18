import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Builds a context string with real-time restaurant data for the AI chat.
 * Runs server-side only (API route).
 */
export async function buildRestaurantContext(restaurantId: string): Promise<string> {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = new Date().toISOString().slice(0, 10)

  // Parallel queries
  const [
    { data: restaurant },
    { data: tables },
    { data: menuItems },
    { data: sessions },
    { data: orders },
    { data: reservations },
    { data: waiters },
  ] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
    supabase.from('tables').select('*').eq('restaurant_id', restaurantId),
    supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId),
    supabase.from('table_sessions').select('*').eq('restaurant_id', restaurantId),
    supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', restaurantId),
    supabase.from('reservations').select('*').eq('restaurant_id', restaurantId),
    supabase.from('profiles').select('*').eq('restaurant_id', restaurantId).eq('role', 'camarero'),
  ])

  const allTables = tables ?? []
  const allMenu = menuItems ?? []
  const allSessions = sessions ?? []
  const allOrders = orders ?? []
  const allReservations = reservations ?? []
  const allWaiters = waiters ?? []

  // Today's sessions
  const todaySessions = allSessions.filter((s) => s.started_at?.startsWith(today))
  const activeSessions = allSessions.filter((s) => !s.closed_at)
  const closedToday = todaySessions.filter((s) => s.closed_at)

  // Revenue today
  const revenueToday = closedToday.reduce((sum, s) => sum + (s.total_amount ?? 0), 0)

  // Today's orders
  const todayOrders = allOrders.filter((o) => o.created_at?.startsWith(today))
  const pendingOrders = todayOrders.filter((o) => o.status === 'pending')
  const preparingOrders = todayOrders.filter((o) => o.status === 'preparing')

  // Top sold items today
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const order of todayOrders) {
    const items = (order as unknown as { order_items: { name: string; quantity: number; price: number }[] }).order_items ?? []
    for (const item of items) {
      if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 }
      itemCounts[item.name].count += item.quantity
      itemCounts[item.name].revenue += item.price * item.quantity
    }
  }
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Tables status
  const tablesByStatus = {
    free: allTables.filter((t) => t.status === 'free').length,
    occupied: allTables.filter((t) => t.status === 'occupied').length,
    reserved: allTables.filter((t) => t.status === 'reserved').length,
    en_route: allTables.filter((t) => t.status === 'en_route').length,
  }

  // Reservations today/tomorrow
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const reservationsToday = allReservations.filter((r) => r.date === today)
  const reservationsTomorrow = allReservations.filter((r) => r.date === tomorrow)

  // Menu summary
  const menuByCategory: Record<string, { count: number; avgPrice: number }> = {}
  for (const item of allMenu) {
    const cat = item.category
    if (!menuByCategory[cat]) menuByCategory[cat] = { count: 0, avgPrice: 0 }
    menuByCategory[cat].count++
    menuByCategory[cat].avgPrice += item.price
  }
  for (const cat of Object.keys(menuByCategory)) {
    menuByCategory[cat].avgPrice = menuByCategory[cat].avgPrice / menuByCategory[cat].count
  }

  // Build context string
  const lines: string[] = [
    `=== CONTEXTO DEL RESTAURANTE ===`,
    `Nombre: ${restaurant?.name ?? 'Desconocido'}`,
    `Ciudad: ${restaurant?.city ?? '?'} | Dirección: ${restaurant?.address ?? '?'}`,
    `Cocina: ${restaurant?.cuisine_type ?? '?'} | Rating: ${restaurant?.rating ?? '?'}/5 (${restaurant?.review_count ?? 0} reseñas)`,
    `Plan: ${restaurant?.plan ?? 'basic'}`,
    ``,
    `=== HOY (${today}) ===`,
    `Facturación: ${revenueToday.toFixed(2)}€`,
    `Sesiones hoy: ${todaySessions.length} (${activeSessions.length} activas, ${closedToday.length} cerradas)`,
    `Pedidos hoy: ${todayOrders.length} (${pendingOrders.length} pendientes, ${preparingOrders.length} preparando)`,
    ``,
    `=== MESAS (${allTables.length} total) ===`,
    `Libres: ${tablesByStatus.free} | Ocupadas: ${tablesByStatus.occupied} | Reservadas: ${tablesByStatus.reserved} | En camino: ${tablesByStatus.en_route}`,
    ``,
    `=== EQUIPO (${allWaiters.length} camareros) ===`,
    ...allWaiters.map((w) => {
      const assignedTables = allTables.filter((t) => t.assigned_waiter_id === w.id)
      return `- ${w.name}: ${assignedTables.length} mesas asignadas`
    }),
    ``,
    `=== PLATOS MÁS VENDIDOS HOY ===`,
    ...(topItems.length > 0
      ? topItems.map((i, idx) => `${idx + 1}. ${i.name} — ${i.count} uds (${i.revenue.toFixed(2)}€)`)
      : ['Sin ventas todavía']),
    ``,
    `=== MENÚ (${allMenu.length} items) ===`,
    ...Object.entries(menuByCategory).map(([cat, info]) =>
      `${cat}: ${info.count} items, precio medio ${info.avgPrice.toFixed(2)}€`
    ),
    ``,
    `=== RESERVAS ===`,
    `Hoy: ${reservationsToday.length} | Mañana: ${reservationsTomorrow.length}`,
    ...(reservationsToday.length > 0
      ? reservationsToday.slice(0, 5).map((r) => `- ${r.time} — ${r.user_name} (${r.party_size} pax) [${r.status}]`)
      : []),
  ]

  return lines.join('\n')
}
