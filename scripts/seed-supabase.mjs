/**
 * DineFirst — Seed Supabase with demo data
 * Run: node scripts/seed-supabase.mjs
 */

const SUPABASE_URL = 'https://axrcsdblzqphcdazlhho.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cmNzZGJsenFwaGNkYXpsaGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMDkyNSwiZXhwIjoyMDg4OTg2OTI1fQ.Uxs-RDkdBepaay3eI38SOGmm70a_rk___cINkKCG584'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
}

async function authAdmin(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Auth ${path}: ${JSON.stringify(data)}`)
  return data
}

async function restInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(rows),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Insert ${table}: ${JSON.stringify(data)}`)
  return data
}

async function main() {
  console.log('=== DineFirst Supabase Seed ===\n')

  // 1. Create auth users
  console.log('1. Creating demo users...')
  const users = [
    { email: 'admin@dinefirst.com', password: 'password123', meta: { name: 'Admin DineFirst', role: 'admin', phone: '+34 600 000 001' } },
    { email: 'restaurante@demo.com', password: 'password123', meta: { name: 'Carlos Mendoza', role: 'restaurante', phone: '+34 600 222 333' } },
    { email: 'comensal@demo.com', password: 'password123', meta: { name: 'María García', role: 'comensal', phone: '+34 600 111 222' } },
    { email: 'javier@demo.com', password: 'password123', meta: { name: 'Javier López', role: 'comensal', phone: '+34 600 333 444' } },
  ]

  const userIds = {}
  for (const u of users) {
    try {
      const result = await authAdmin('POST', 'users', {
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: u.meta,
      })
      userIds[u.email] = result.id
      console.log(`   ✓ ${u.email} → ${result.id}`)
    } catch (e) {
      // User might already exist
      console.log(`   ⚠ ${u.email}: ${e.message}`)
      // Try to find existing user
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, { headers })
      const listData = await listRes.json()
      const existing = listData.users?.find(x => x.email === u.email)
      if (existing) {
        userIds[u.email] = existing.id
        console.log(`   → Found existing: ${existing.id}`)
      }
    }
  }

  const adminId = userIds['admin@dinefirst.com']
  const ownerId = userIds['restaurante@demo.com']
  const comensalId = userIds['comensal@demo.com']
  const javierId = userIds['javier@demo.com']

  if (!ownerId) {
    console.error('\n✗ Could not find owner user ID. Aborting.')
    process.exit(1)
  }

  console.log('\n2. Creating restaurants...')
  const restaurants = await restInsert('restaurants', [
    {
      owner_id: ownerId,
      name: 'La Taberna del Chef',
      slug: 'la-taberna-del-chef',
      city: 'madrid',
      address: 'Calle Gran Vía 42, Madrid',
      cuisine_type: 'Española contemporánea',
      capacity: 60,
      description: 'Cocina de autor con raíces en la tradición española. Productos de temporada y técnicas modernas en un ambiente acogedor.',
      phone: '+34 910 123 456',
      opening_hours: 'Mar-Dom 13:00-16:00, 20:00-23:30',
      plan: 'pro',
      is_active: true,
      rating: 4.80,
      review_count: 3,
      images: [],
    },
    {
      owner_id: ownerId,
      name: 'El Rincón de la Abuela',
      slug: 'el-rincon-de-la-abuela',
      city: 'barcelona',
      address: 'Passeig de Gràcia 88, Barcelona',
      cuisine_type: 'Mediterránea tradicional',
      capacity: 45,
      description: 'Recetas familiares transmitidas por generaciones. Cocina casera con los mejores ingredientes del Mediterráneo.',
      phone: '+34 932 456 789',
      opening_hours: 'Lun-Sab 12:30-16:00, 19:30-23:00',
      plan: 'basic',
      is_active: true,
      rating: 4.67,
      review_count: 3,
      images: [],
    },
    {
      owner_id: ownerId,
      name: 'Sake & Fusion',
      slug: 'sake-and-fusion',
      city: 'madrid',
      address: 'Calle Serrano 15, Madrid',
      cuisine_type: 'Japonesa fusión',
      capacity: 35,
      description: 'La mejor fusión entre la cocina japonesa tradicional y la vanguardia occidental. Sushi, ramen y platos de autor.',
      phone: '+34 910 789 012',
      opening_hours: 'Lun-Dom 13:00-16:00, 20:00-00:00',
      plan: 'premium',
      is_active: true,
      rating: 4.50,
      review_count: 2,
      images: [],
    },
  ])
  const restIds = {}
  restaurants.forEach(r => { restIds[r.slug] = r.id; console.log(`   ✓ ${r.name} → ${r.id}`) })

  const taberna = restIds['la-taberna-del-chef']
  const rincon = restIds['el-rincon-de-la-abuela']
  const sake = restIds['sake-and-fusion']

  // 3. Create camarero users (linked to taberna)
  console.log('\n3. Creating camarero users...')
  const camareros = [
    { email: 'elena-cam@dinefirst.internal', password: 'password123', meta: { name: 'Elena Ruiz', role: 'camarero', phone: '+34 600 777 888', username: 'elena', restaurant_id: taberna } },
    { email: 'diego-cam@dinefirst.internal', password: 'password123', meta: { name: 'Diego Torres', role: 'camarero', phone: '+34 600 999 000', username: 'diego', restaurant_id: taberna } },
  ]
  for (const c of camareros) {
    try {
      const result = await authAdmin('POST', 'users', {
        email: c.email,
        password: c.password,
        email_confirm: true,
        user_metadata: c.meta,
      })
      console.log(`   ✓ ${c.meta.username} → ${result.id}`)
    } catch (e) {
      console.log(`   ⚠ ${c.meta.username}: ${e.message}`)
    }
  }

  // 4. Tables
  console.log('\n4. Creating tables...')
  const tables = await restInsert('tables', [
    { restaurant_id: taberna, name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'free' },
    { restaurant_id: taberna, name: 'Mesa 2', capacity: 4, location: 'Interior', status: 'free' },
    { restaurant_id: taberna, name: 'Mesa 3', capacity: 4, location: 'Interior', status: 'free' },
    { restaurant_id: taberna, name: 'Mesa 4', capacity: 6, location: 'Privado', status: 'free' },
    { restaurant_id: taberna, name: 'Mesa 5', capacity: 8, location: 'Privado', status: 'free' },
    { restaurant_id: rincon, name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'free' },
    { restaurant_id: rincon, name: 'Mesa 2', capacity: 4, location: 'Salón', status: 'free' },
    { restaurant_id: rincon, name: 'Mesa 3', capacity: 6, location: 'Salón', status: 'free' },
    { restaurant_id: rincon, name: 'Mesa 4', capacity: 8, location: 'Reservado', status: 'free' },
    { restaurant_id: sake, name: 'Mesa 1', capacity: 2, location: 'Barra', status: 'free' },
    { restaurant_id: sake, name: 'Mesa 2', capacity: 4, location: 'Tatami', status: 'free' },
    { restaurant_id: sake, name: 'Mesa 3', capacity: 4, location: 'Tatami', status: 'free' },
    { restaurant_id: sake, name: 'Mesa 4', capacity: 6, location: 'Privado', status: 'free' },
    { restaurant_id: sake, name: 'Mesa 5', capacity: 2, location: 'Barra', status: 'free' },
  ])
  console.log(`   ✓ ${tables.length} mesas creadas`)

  // 5. Menu items
  console.log('\n5. Creating menu items...')
  const menuItems = await restInsert('menu_items', [
    // La Taberna del Chef
    { restaurant_id: taberna, name: 'Croquetas de jamón ibérico', description: 'Bechamel cremosa, jamón ibérico DO, panko dorado', price: 12, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Gazpacho de temporada', description: 'Tomates de huerta, pepino, pimiento y aceite virgen extra', price: 9, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Steak tartar', description: 'Solomillo picado a cuchillo, alcaparras, mostaza Dijon, yema curada', price: 18, category: 'entrantes', is_available: true, image_url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Cocido madrileño', description: 'Receta tradicional de tres vuelcos, garbanzos de Fuentesaúco', price: 24, category: 'principales', is_available: true, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Lubina a la sal', description: 'Lubina salvaje, sal marina, aceite de oliva arbequina, limón', price: 28, category: 'principales', is_available: true, image_url: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Entrecot de vaca madurada', description: '400g, maduración 45 días, chimichurri casero, patatas paja', price: 34, category: 'principales', is_available: false, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Torrija caramelizada', description: 'Pan brioche, crema de vainilla, helado de azafrán', price: 8, category: 'postres', is_available: true, image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Vino de la casa (copa)', description: 'Selección del sumiller, rota cada semana', price: 6, category: 'bebidas', is_available: true, image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
    { restaurant_id: taberna, name: 'Agua mineral', description: 'Botella 1L con o sin gas', price: 3, category: 'bebidas', is_available: true, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
    // El Rincón de la Abuela
    { restaurant_id: rincon, name: 'Ensalada mediterránea', description: 'Tomate, mozzarella, albahaca, aceite virgen', price: 10, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Patatas bravas', description: 'Salsa brava casera y alioli', price: 7, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Paella valenciana', description: 'Arroz bomba, pollo, conejo, judías, garrofón', price: 22, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Fideuà de marisco', description: 'Fideos rossejat, gambas, mejillones, alioli', price: 20, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Crema catalana', description: 'Receta tradicional con azúcar caramelizado', price: 7, category: 'postres', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Sangría de la casa', description: 'Jarra de sangría con fruta fresca', price: 12, category: 'bebidas', is_available: true, image_url: null },
    { restaurant_id: rincon, name: 'Cerveza artesana', description: 'Selección de cervezas locales', price: 5, category: 'bebidas', is_available: true, image_url: null },
    // Sake & Fusion
    { restaurant_id: sake, name: 'Edamame trufa', description: 'Edamame con sal de trufa negra', price: 8, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Gyozas de wagyu', description: 'Empanadillas japonesas rellenas de wagyu', price: 14, category: 'entrantes', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Ramen tonkotsu', description: 'Caldo de cerdo 18h, chashu, huevo marinado, nori', price: 16, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Sashimi premium', description: 'Selección de 12 piezas del mercado', price: 32, category: 'principales', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Mochi helado', description: 'Surtido de 6 mochi artesanales', price: 10, category: 'postres', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Sake premium', description: 'Dassai 45 junmai daiginjo', price: 18, category: 'bebidas', is_available: true, image_url: null },
    { restaurant_id: sake, name: 'Matcha latte', description: 'Matcha ceremonial con leche de avena', price: 5, category: 'bebidas', is_available: true, image_url: null },
  ])
  console.log(`   ✓ ${menuItems.length} items de menú creados`)

  // 6. Reviews
  if (comensalId && javierId) {
    console.log('\n6. Creating reviews...')
    const reviews = await restInsert('reviews', [
      { restaurant_id: taberna, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'Las croquetas son increíbles. Ambiente muy acogedor.' },
      { restaurant_id: taberna, user_id: javierId, user_name: 'Javier López', rating: 5, comment: 'Mejor cocido de Madrid, sin duda.' },
      { restaurant_id: rincon, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'La paella estaba espectacular. Volveremos seguro.' },
      { restaurant_id: rincon, user_id: javierId, user_name: 'Javier López', rating: 5, comment: 'Comida casera de verdad. Las bravas están de 10.' },
      { restaurant_id: sake, user_id: comensalId, user_name: 'María García', rating: 5, comment: 'El mejor ramen que he probado fuera de Japón.' },
      { restaurant_id: sake, user_id: javierId, user_name: 'Javier López', rating: 4, comment: 'Sashimi fresco y de calidad. El sake premium vale la pena.' },
    ])
    console.log(`   ✓ ${reviews.length} reseñas creadas`)
  }

  // 7. Sample reservations
  if (comensalId) {
    console.log('\n7. Creating sample reservations...')
    const tablesList = tables.filter(t => t.restaurant_id === taberna)
    const reservations = await restInsert('reservations', [
      {
        user_id: comensalId,
        restaurant_id: taberna,
        table_id: tablesList[0]?.id,
        user_name: 'María García',
        user_email: 'comensal@demo.com',
        user_phone: '+34 600 111 222',
        restaurant_name: 'La Taberna del Chef',
        restaurant_city: 'madrid',
        table_name: 'Mesa 1',
        date: '2026-03-20',
        time: '21:00',
        party_size: 2,
        status: 'confirmed',
        confirmation_code: 'DF-TAB-001',
      },
      {
        user_id: comensalId,
        restaurant_id: rincon,
        table_id: tables.find(t => t.restaurant_id === rincon)?.id,
        user_name: 'María García',
        user_email: 'comensal@demo.com',
        user_phone: '+34 600 111 222',
        restaurant_name: 'El Rincón de la Abuela',
        restaurant_city: 'barcelona',
        table_name: 'Mesa 1',
        date: '2026-03-22',
        time: '14:00',
        party_size: 4,
        status: 'pending',
        confirmation_code: 'DF-RIN-002',
      },
    ])
    console.log(`   ✓ ${reservations.length} reservas creadas`)
  }

  console.log('\n=== Seed completado ===')
  console.log('\nCuentas demo:')
  console.log('  admin@dinefirst.com / password123 → /admin')
  console.log('  restaurante@demo.com / password123 → /dashboard')
  console.log('  comensal@demo.com / password123 → /app')
  console.log('  Camarero: elena / password123 (la-taberna-del-chef)')
  console.log('  Camarero: diego / password123 (la-taberna-del-chef)')
}

main().catch(e => { console.error('\n✗ Error:', e.message); process.exit(1) })
