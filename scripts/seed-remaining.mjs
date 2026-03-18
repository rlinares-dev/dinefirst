const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !KEY) {
  console.error('Missing env vars. Run: source .env.local or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const h = { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=representation' }

async function ins(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify(rows) })
  const data = await res.json()
  if (!res.ok) throw new Error(`${table}: ${JSON.stringify(data)}`)
  return data
}

async function get(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: h })
  return res.json()
}

async function main() {
  const rests = await get('restaurants', 'select=id,slug')
  const profiles = await get('profiles', 'select=id,role,email')
  const tables = await get('tables', 'select=id,restaurant_id,name')

  const taberna = rests.find(r => r.slug === 'la-taberna-del-chef').id
  const rincon = rests.find(r => r.slug === 'el-rincon-de-la-abuela').id
  const sake = rests.find(r => r.slug === 'sake-and-fusion').id
  const comensalId = profiles.find(p => p.email === 'comensal@demo.com')?.id
  const javierId = profiles.find(p => p.email === 'javier@demo.com')?.id

  console.log('Inserting menu items...')
  const items = await ins('menu_items', [
    { restaurant_id: taberna, name: 'Croquetas de jamón ibérico', description: 'Bechamel cremosa, jamón ibérico DO', price: 12, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Gazpacho de temporada', description: 'Tomates de huerta, pepino, pimiento', price: 9, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Steak tartar', description: 'Solomillo picado a cuchillo, alcaparras', price: 18, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Cocido madrileño', description: 'Receta tradicional de tres vuelcos', price: 24, category: 'principales', is_available: true, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Lubina a la sal', description: 'Lubina salvaje, sal marina, limón', price: 28, category: 'principales', is_available: true, image_url: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Entrecot de vaca madurada', description: '400g, maduración 45 días', price: 34, category: 'principales', is_available: false, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Torrija caramelizada', description: 'Pan brioche, crema de vainilla', price: 8, category: 'postres', is_available: true, image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Vino de la casa (copa)', description: 'Selección del sumiller', price: 6, category: 'bebidas', is_available: true, image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Agua mineral', description: 'Botella 1L con o sin gas', price: 3, category: 'bebidas', is_available: true, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
    { restaurant_id: rincon, name: 'Ensalada mediterránea', description: 'Tomate, mozzarella, albahaca', price: 10, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Patatas bravas', description: 'Salsa brava casera y alioli', price: 7, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Paella valenciana', description: 'Arroz bomba, pollo, conejo', price: 22, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Fideuà de marisco', description: 'Fideos rossejat, gambas, mejillones', price: 20, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Crema catalana', description: 'Receta tradicional', price: 7, category: 'postres', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Sangría de la casa', description: 'Jarra con fruta fresca', price: 12, category: 'bebidas', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Cerveza artesana', description: 'Selección de cervezas locales', price: 5, category: 'bebidas', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Edamame trufa', description: 'Edamame con sal de trufa negra', price: 8, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Gyozas de wagyu', description: 'Empanadillas japonesas de wagyu', price: 14, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Ramen tonkotsu', description: 'Caldo de cerdo 18h, chashu, nori', price: 16, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Sashimi premium', description: 'Selección de 12 piezas', price: 32, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Mochi helado', description: 'Surtido de 6 mochi artesanales', price: 10, category: 'postres', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Sake premium', description: 'Dassai 45 junmai daiginjo', price: 18, category: 'bebidas', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Matcha latte', description: 'Matcha ceremonial con leche de avena', price: 5, category: 'bebidas', is_available: true, image_url: null },
  ])
  console.log(`  ${items.length} menu items`)

  console.log('Inserting reviews...')
  const reviews = await ins('reviews', [
    { restaurant_id: taberna, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'Las croquetas son increíbles.' },
    { restaurant_id: taberna, user_id: javierId, user_name: 'Javier López', rating: 5, comment: 'Mejor cocido de Madrid.' },
    { restaurant_id: rincon, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'La paella estaba espectacular.' },
    { restaurant_id: rincon, user_id: javierId, user_name: 'Javier López', rating: 5, comment: 'Comida casera de verdad.' },
    { restaurant_id: sake, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'El mejor ramen fuera de Japón.' },
    { restaurant_id: sake, user_id: javierId, user_name: 'Javier López', rating: 4, comment: 'Sashimi fresco y de calidad.' },
  ])
  console.log(`  ${reviews.length} reviews`)

  console.log('Inserting reservations...')
  const t1 = tables.find(t => t.restaurant_id === taberna && t.name === 'Mesa 1')
  const t2 = tables.find(t => t.restaurant_id === rincon && t.name === 'Mesa 1')
  const reservations = await ins('reservations', [
    { user_id: comensalId, restaurant_id: taberna, table_id: t1?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: 'La Taberna del Chef', restaurant_city: 'madrid', table_name: 'Mesa 1', date: '2026-03-20', time: '21:00', party_size: 2, status: 'confirmed', confirmation_code: 'DF-TAB-001', whatsapp_consent: false, special_requests: '' },
    { user_id: comensalId, restaurant_id: rincon, table_id: t2?.id, user_name: 'María García', user_email: 'comensal@demo.com', user_phone: '+34 600 111 222', restaurant_name: 'El Rincón de la Abuela', restaurant_city: 'barcelona', table_name: 'Mesa 1', date: '2026-03-22', time: '14:00', party_size: 4, status: 'pending', confirmation_code: 'DF-RIN-002', whatsapp_consent: false, special_requests: '' },
  ])
  console.log(`  ${reservations.length} reservations`)

  console.log('\nDone! Supabase fully seeded.')
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
