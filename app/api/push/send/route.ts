import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    'mailto:admin@dinefirst.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE,
  )
}

interface PushPayload {
  restaurantId: string
  tableId: string
  tableName: string
  type: 'new_order' | 'bill_requested'
  total?: number
  waiterId?: string
}

export async function POST(req: NextRequest) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  }

  const body = (await req.json()) as PushPayload
  const { restaurantId, tableId, tableName, type, total, waiterId } = body

  if (!restaurantId || !tableName || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Build notification content
  const notification = type === 'new_order'
    ? {
        title: `Nuevo pedido — ${tableName}`,
        body: `Se ha recibido un nuevo pedido en ${tableName}`,
        url: `/dashboard/comandas`,
        tag: `order-${tableId}`,
      }
    : {
        title: `Cuenta solicitada — ${tableName}`,
        body: total ? `${tableName} pide la cuenta · ${total.toFixed(2)}€` : `${tableName} ha pedido la cuenta`,
        url: `/dashboard/tpv/${tableId}`,
        tag: `bill-${tableId}`,
      }

  // Get subscriptions: assigned waiter + restaurant owner
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get owner ID for this restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('owner_id')
    .eq('id', restaurantId)
    .single()

  // Build user IDs to notify
  const targetUserIds: string[] = []
  if (restaurant?.owner_id) targetUserIds.push(restaurant.owner_id)
  if (waiterId) targetUserIds.push(waiterId)

  if (targetUserIds.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Get push subscriptions for target users
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('user_id', targetUserIds)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Send push to all subscriptions
  let sent = 0
  const expired: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(notification),
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired — clean up
          expired.push(sub.id)
        } else {
          console.error('Push send error:', err)
        }
      }
    }),
  )

  // Clean up expired subscriptions
  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }

  return NextResponse.json({ sent, expired: expired.length })
}

// GET handler for static export compatibility
export async function GET() {
  return NextResponse.json({ status: 'push endpoint ready' })
}
