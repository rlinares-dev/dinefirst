/**
 * DineFirst — Seed realistic data for testing (idempotent-ish)
 * - Clears reservations/sessions/orders and repopulates with realistic data
 * - Uses FUTURE dates so the dashboard shows "próximas reservas"
 * - Creates active table sessions + delivered/pending orders
 * Run: node scripts/seed-realistic-data.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !KEY) {
  console.error('Missing env vars.')
  process.exit(1)
}

const h = {
  'Content-Type': 'application/json',
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  Prefer: 'return=representation',
}

async function req(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path}: ${text}`)
  return text ? JSON.parse(text) : []
}

const ins = (t, rows) => req('POST', t, rows)
const get = (t, q = '') => req('GET', `${t}?${q}`)
const del = (t, q) => req('DELETE', `${t}?${q}`)

// ─── Date helpers (today = 2026-04-08) ─────────────────────────────────────
const today = new Date()
const iso = (d) => d.toISOString().split('T')[0]
const addDays = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return iso(d)
}
const nowMinus = (minutes) => {
  const d = new Date(today)
  d.setMinutes(d.getMinutes() - minutes)
  return d.toISOString()
}

async function main() {
  console.log('=== DineFirst Realistic Seed ===\n')

  // 1. Fetch existing data
  console.log('1. Loading existing entities...')
  const rests = await get('restaurants', 'select=id,slug,name')
  const profiles = await get('profiles', 'select=*')
  const tables = await get('tables', 'select=*')
  const items = await get('menu_items', 'select=id,restaurant_id,name,price')

  const taberna = rests.find((r) => r.slug === 'la-taberna-del-chef')
  const rincon = rests.find((r) => r.slug === 'el-rincon-de-la-abuela')
  const sake = rests.find((r) => r.slug === 'sake-and-fusion')
  const comensal = profiles.find((p) => p.email === 'comensal@demo.com')
  const javier = profiles.find((p) => p.email === 'javier@demo.com')

  if (!taberna || !rincon || !sake) throw new Error('Missing restaurants')
  if (!comensal || !javier) throw new Error('Missing demo users')

  console.log(`   ✓ ${rests.length} restaurants, ${profiles.length} profiles`)
  console.log(`   ✓ ${tables.length} tables, ${items.length} menu items\n`)

  const tabernaTables = tables.filter((t) => t.restaurant_id === taberna.id)
  const rinconTables = tables.filter((t) => t.restaurant_id === rincon.id)
  const sakeTables = tables.filter((t) => t.restaurant_id === sake.id)
  const tabernaItems = items.filter((i) => i.restaurant_id === taberna.id)
  const rinconItems = items.filter((i) => i.restaurant_id === rincon.id)

  // 2. Wipe transactional data (NOT reviews/menus/tables)
  console.log('2. Clearing old transactional data...')
  try { await del('order_items', 'id=neq.00000000-0000-0000-0000-000000000000') } catch (e) { console.log('   order_items:', e.message) }
  try { await del('orders', 'id=neq.00000000-0000-0000-0000-000000000000') } catch (e) { console.log('   orders:', e.message) }
  try { await del('table_sessions', 'id=neq.00000000-0000-0000-0000-000000000000') } catch (e) { console.log('   table_sessions:', e.message) }
  try { await del('reservations', 'id=neq.00000000-0000-0000-0000-000000000000') } catch (e) { console.log('   reservations:', e.message) }
  console.log('   ✓ cleared\n')

  // 3. Reservations (today, tomorrow, this week)
  console.log('3. Creating reservations...')
  const reservations = await ins('reservations', [
    // TODAY - confirmed
    { user_id: comensal.id, restaurant_id: taberna.id, table_id: tabernaTables[0]?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[0]?.name, date: addDays(0), time: '21:00', party_size: 2, status: 'confirmed', confirmation_code: 'DF-HOY-001', whatsapp_consent: true, special_requests: 'Mesa tranquila, aniversario' },
    { user_id: javier.id, restaurant_id: taberna.id, table_id: tabernaTables[1]?.id, user_name: 'Javier López', user_email: 'javier@demo.com', user_phone: '+34 600 333 444', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[1]?.name, date: addDays(0), time: '22:00', party_size: 4, status: 'confirmed', confirmation_code: 'DF-HOY-002', whatsapp_consent: false, special_requests: '' },
    // TODAY - pending
    { user_id: comensal.id, restaurant_id: taberna.id, table_id: tabernaTables[2]?.id, user_name: 'Carmen Ruiz', user_email: 'carmen@example.com', user_phone: '+34 611 000 111', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[2]?.name, date: addDays(0), time: '20:30', party_size: 3, status: 'pending', confirmation_code: 'DF-HOY-003', whatsapp_consent: true, special_requests: 'Intolerancia al gluten' },
    // TOMORROW
    { user_id: comensal.id, restaurant_id: taberna.id, table_id: tabernaTables[0]?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[0]?.name, date: addDays(1), time: '14:30', party_size: 2, status: 'confirmed', confirmation_code: 'DF-MAN-001', whatsapp_consent: false, special_requests: '' },
    { user_id: javier.id, restaurant_id: taberna.id, table_id: tabernaTables[3]?.id, user_name: 'Pablo Sánchez', user_email: 'pablo@example.com', user_phone: '+34 622 111 222', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[3]?.name, date: addDays(1), time: '21:30', party_size: 6, status: 'confirmed', confirmation_code: 'DF-MAN-002', whatsapp_consent: true, special_requests: 'Cumpleaños, traer tarta' },
    // THIS WEEK
    { user_id: comensal.id, restaurant_id: taberna.id, table_id: tabernaTables[1]?.id, user_name: 'Laura Martín', user_email: 'laura@example.com', user_phone: '+34 633 222 333', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[1]?.name, date: addDays(3), time: '20:00', party_size: 2, status: 'confirmed', confirmation_code: 'DF-SEM-001', whatsapp_consent: false, special_requests: '' },
    { user_id: javier.id, restaurant_id: taberna.id, table_id: tabernaTables[2]?.id, user_name: 'Daniel Torres', user_email: 'daniel@example.com', user_phone: '+34 644 333 444', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[2]?.name, date: addDays(5), time: '21:00', party_size: 4, status: 'pending', confirmation_code: 'DF-SEM-002', whatsapp_consent: true, special_requests: '' },
    // Other restaurants
    { user_id: comensal.id, restaurant_id: rincon.id, table_id: rinconTables[0]?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: rincon.name, restaurant_city: 'barcelona', table_name: rinconTables[0]?.name, date: addDays(2), time: '14:00', party_size: 4, status: 'confirmed', confirmation_code: 'DF-RIN-001', whatsapp_consent: false, special_requests: '' },
    { user_id: comensal.id, restaurant_id: sake.id, table_id: sakeTables[0]?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: sake.name, restaurant_city: 'madrid', table_name: sakeTables[0]?.name, date: addDays(4), time: '21:00', party_size: 2, status: 'confirmed', confirmation_code: 'DF-SAK-001', whatsapp_consent: true, special_requests: 'Alergia al marisco' },
    // PAST (cancelled - shows in history)
    { user_id: comensal.id, restaurant_id: taberna.id, table_id: tabernaTables[0]?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: taberna.name, restaurant_city: 'madrid', table_name: tabernaTables[0]?.name, date: addDays(-3), time: '21:00', party_size: 2, status: 'cancelled', confirmation_code: 'DF-PAS-001', whatsapp_consent: false, special_requests: '' },
  ])
  console.log(`   ✓ ${reservations.length} reservations\n`)

  // 4. Active sessions (mesas con gente sentada AHORA)
  console.log('4. Creating active table sessions (en curso)...')
  const activeSessions = await ins('table_sessions', [
    { table_id: tabernaTables[0].id, restaurant_id: taberna.id, started_at: nowMinus(45), total_amount: 0 },
    { table_id: tabernaTables[1].id, restaurant_id: taberna.id, started_at: nowMinus(20), total_amount: 0 },
  ])
  console.log(`   ✓ ${activeSessions.length} active sessions\n`)

  // 5. Closed sessions from past days (para el historial + analíticas)
  console.log('5. Creating closed sessions from past days...')
  const closedSessions = []
  for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(20, 0, 0, 0)
    const startedAt = date.toISOString()
    const closedAt = new Date(date.getTime() + 90 * 60 * 1000).toISOString()
    // 2-3 sesiones cerradas por día
    const sessionsPerDay = 2 + (daysAgo % 2)
    for (let i = 0; i < sessionsPerDay; i++) {
      const tbl = tabernaTables[i % tabernaTables.length]
      closedSessions.push({
        table_id: tbl.id,
        restaurant_id: taberna.id,
        started_at: startedAt,
        closed_at: closedAt,
        total_amount: 0, // trigger will recompute
      })
    }
  }
  const insertedClosed = await ins('table_sessions', closedSessions)
  console.log(`   ✓ ${insertedClosed.length} closed sessions\n`)

  // 6. Orders for active sessions (entregados + pendientes)
  console.log('6. Creating orders for active sessions...')
  const session1 = activeSessions[0]
  const session2 = activeSessions[1]

  // Session 1: 2 pedidos entregados + 1 pendiente
  const order1 = await ins('orders', [
    { session_id: session1.id, table_id: session1.table_id, restaurant_id: taberna.id, status: 'served', notes: '' },
  ])
  await ins('order_items', [
    { order_id: order1[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Croquetas')).id, name: 'Croquetas de jamón ibérico', price: 12, quantity: 2, notes: '' },
    { order_id: order1[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Vino')).id, name: 'Vino de la casa (copa)', price: 6, quantity: 2, notes: '' },
  ])

  const order2 = await ins('orders', [
    { session_id: session1.id, table_id: session1.table_id, restaurant_id: taberna.id, status: 'pending', notes: 'Sin cebolla' },
  ])
  await ins('order_items', [
    { order_id: order2[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Cocido')).id, name: 'Cocido madrileño', price: 24, quantity: 1, notes: '' },
    { order_id: order2[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Lubina')).id, name: 'Lubina a la sal', price: 28, quantity: 1, notes: '' },
  ])

  // Session 2: 1 pedido entregado
  const order3 = await ins('orders', [
    { session_id: session2.id, table_id: session2.table_id, restaurant_id: taberna.id, status: 'served', notes: '' },
  ])
  await ins('order_items', [
    { order_id: order3[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Gazpacho')).id, name: 'Gazpacho de temporada', price: 9, quantity: 4, notes: '' },
    { order_id: order3[0].id, menu_item_id: tabernaItems.find(i => i.name.includes('Agua')).id, name: 'Agua mineral', price: 3, quantity: 2, notes: '' },
  ])
  console.log('   ✓ 3 orders con items en sesiones activas\n')

  // 7. Orders for closed sessions (random plates per day for analytics)
  console.log('7. Creating orders for closed sessions (historial + analíticas)...')
  let closedOrderCount = 0
  const popularItems = tabernaItems.filter((i) => ['Croquetas','Cocido','Lubina','Gazpacho','Torrija','Vino','Steak','Entrecot'].some((k) => i.name.includes(k)))
  for (const sess of insertedClosed) {
    const numOrders = 1 + Math.floor(Math.random() * 2)
    for (let k = 0; k < numOrders; k++) {
      const ord = await ins('orders', [{
        session_id: sess.id, table_id: sess.table_id, restaurant_id: taberna.id, status: 'served', notes: '',
      }])
      const numItems = 2 + Math.floor(Math.random() * 3)
      const itemsToAdd = []
      for (let j = 0; j < numItems; j++) {
        const it = popularItems[Math.floor(Math.random() * popularItems.length)]
        itemsToAdd.push({
          order_id: ord[0].id,
          menu_item_id: it.id,
          name: it.name,
          price: it.price,
          quantity: 1 + Math.floor(Math.random() * 3),
          notes: '',
        })
      }
      await ins('order_items', itemsToAdd)
      closedOrderCount++
    }
  }
  console.log(`   ✓ ${closedOrderCount} orders históricos\n`)

  // 8. Re-trigger session totals (trigger fires on order INSERT before items exist)
  console.log('8. Recalculating session totals...')
  const allOrders = await get('orders', 'select=id,status')
  for (const o of allOrders) {
    await req('PATCH', `orders?id=eq.${o.id}`, { status: o.status })
  }
  console.log(`   ✓ ${allOrders.length} orders re-triggered\n`)

  console.log('=== DONE ===')
  console.log(`\nResumen:`)
  console.log(`  ${reservations.length} reservas (hoy/mañana/semana/pasado)`)
  console.log(`  ${activeSessions.length} sesiones activas (mesas ocupadas AHORA)`)
  console.log(`  ${insertedClosed.length} sesiones cerradas (últimos 7 días)`)
  console.log(`  ${3 + closedOrderCount} pedidos totales`)
}

main().catch((e) => { console.error('\n✗ Error:', e.message); process.exit(1) })
