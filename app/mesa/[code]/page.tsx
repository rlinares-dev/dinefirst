'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  getTableByQrCode,
  getRestaurantById,
  getMenuForRestaurant,
  getActiveSessionForTable,
  createSession,
  createOrder,
  getOrdersForSession,
  requestBill,
  getSessionById,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetTableByQrCode,
  sbGetRestaurantById,
  sbGetMenuForRestaurant,
  sbGetActiveSessionForTable,
  sbCreateSession,
  sbCreateOrder,
  sbGetOrdersForSession,
  sbRequestBill,
  sbGetSessionById,
} from '@/lib/supabase-data'
import type { Table, Restaurant, MenuItem, Order } from '@/types/database'
import MenuSection from '@/components/mesa/menu-section'
import CartDrawer from '@/components/mesa/cart-drawer'
import OrderStatusView from '@/components/mesa/order-status'
import { usePolling } from '@/lib/hooks/use-polling'

type MenuCategory = 'entrantes' | 'principales' | 'postres' | 'bebidas'
const CATEGORIES: MenuCategory[] = ['entrantes', 'principales', 'postres', 'bebidas']

interface CartEntry {
  item: MenuItem
  quantity: number
  notes: string
}

export default function MesaClientPage() {
  const params = useParams<{ code: string }>()
  const code = params.code

  const [table, setTable] = useState<Table | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [view, setView] = useState<'menu' | 'orders'>('menu')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [billRequested, setBillRequested] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)

  // Initial load
  useEffect(() => {
    async function init() {
      const sb = isSupabaseConfigured()

      const t = sb ? await sbGetTableByQrCode(code) : getTableByQrCode(code)
      if (!t) {
        setError('Mesa no encontrada. Verifica el código QR.')
        setLoading(false)
        return
      }
      setTable(t)

      const r = sb ? await sbGetRestaurantById(t.restaurantId) : getRestaurantById(t.restaurantId)
      if (!r) {
        setError('Restaurante no encontrado.')
        setLoading(false)
        return
      }
      setRestaurant(r)

      const items = sb ? await sbGetMenuForRestaurant(t.restaurantId) : getMenuForRestaurant(t.restaurantId)
      setMenu(items)

      // Find or create session
      let session = sb ? await sbGetActiveSessionForTable(t.id) : getActiveSessionForTable(t.id)
      if (!session) {
        session = sb ? await sbCreateSession(t.id, t.restaurantId) : createSession(t.id, t.restaurantId)
      }
      setSessionId(session.id)
      setBillRequested(session.billRequested ?? false)

      // Load existing orders
      const existingOrders = sb ? await sbGetOrdersForSession(session.id) : getOrdersForSession(session.id)
      setOrders(existingOrders)
      if (existingOrders.length > 0) {
        setView('orders')
      }

      setLoading(false)
    }
    init()
  }, [code])

  // Poll for order status updates + bill state
  const refreshOrders = useCallback(async () => {
    if (!sessionId) return
    const sb = isSupabaseConfigured()

    // Refresh session state (bill requested, closed)
    const session = sb ? await sbGetSessionById(sessionId) : getSessionById(sessionId)
    if (session) {
      setBillRequested(session.billRequested ?? false)
      if (session.closedAt) {
        setSessionClosed(true)
      }
    }

    const freshOrders = sb ? await sbGetOrdersForSession(sessionId) : getOrdersForSession(sessionId)
    setOrders(freshOrders)
  }, [sessionId])

  usePolling(refreshOrders, 5000, !!sessionId)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item.id]
      if (existing) {
        return { ...prev, [item.id]: { ...existing, quantity: existing.quantity + 1 } }
      }
      return { ...prev, [item.id]: { item, quantity: 1, notes: '' } }
    })
  }

  function removeFromCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item.id]
      if (!existing) return prev
      if (existing.quantity <= 1) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: { ...existing, quantity: existing.quantity - 1 } }
    })
  }

  function removeItemEntirely(itemId: string) {
    setCart((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  function updateItemNotes(itemId: string, notes: string) {
    setCart((prev) => {
      const existing = prev[itemId]
      if (!existing) return prev
      return { ...prev, [itemId]: { ...existing, notes } }
    })
  }

  async function handleSubmit(generalNotes: string) {
    if (!sessionId || !table || !restaurant) return
    setSubmitting(true)

    const items = Object.values(cart).map((ci) => ({
      menuItemId: ci.item.id,
      name: ci.item.name,
      price: ci.item.price,
      quantity: ci.quantity,
      notes: ci.notes,
    }))

    const sb = isSupabaseConfigured()
    if (sb) {
      await sbCreateOrder(sessionId, table.id, restaurant.id, items, generalNotes)
      const freshOrders = await sbGetOrdersForSession(sessionId)
      setOrders(freshOrders)

      // Trigger push notification to waiter/owner
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table.id,
          tableName: table.name,
          type: 'new_order',
          waiterId: table.assignedWaiterId,
        }),
      }).catch(() => { /* push is best-effort */ })
    } else {
      createOrder(sessionId, table.id, restaurant.id, items, generalNotes)
      setOrders(getOrdersForSession(sessionId))
    }

    setCart({})
    setView('orders')
    setSubmitting(false)
  }

  async function handleRequestBill() {
    if (!sessionId || !table || !restaurant) return
    const sb = isSupabaseConfigured()
    if (sb) {
      await sbRequestBill(sessionId)

      // Trigger push notification for bill request
      const totalAmount = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0
      )
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table.id,
          tableName: table.name,
          type: 'bill_requested',
          total: totalAmount,
          waiterId: table.assignedWaiterId,
        }),
      }).catch(() => { /* push is best-effort */ })
    } else {
      requestBill(sessionId)
    }
    setBillRequested(true)
    setView('orders')
  }

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-accent" />
          <p className="text-sm text-foreground-subtle">Cargando carta...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg font-semibold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-foreground-subtle">
            Escanea de nuevo el código QR de tu mesa.
          </p>
        </div>
      </div>
    )
  }

  const cartItems = Object.values(cart)
  const cartQuantities: Record<string, number> = {}
  cartItems.forEach((ci) => { cartQuantities[ci.item.id] = ci.quantity })

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border-subtle bg-background-soft/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{restaurant?.name}</h1>
            <p className="text-xs text-foreground-subtle">{table?.name} · {table?.location}</p>
          </div>
          <div className="flex gap-2">
            {!billRequested && !sessionClosed && (
              <button
                onClick={() => setView('menu')}
                className={view === 'menu'
                  ? 'rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent border border-accent/30'
                  : 'rounded-full border border-border-subtle px-3 py-1 text-xs text-foreground-subtle'}
              >
                Carta
              </button>
            )}
            {orders.length > 0 && (
              <button
                onClick={() => setView('orders')}
                className={view === 'orders'
                  ? 'rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent border border-accent/30'
                  : 'rounded-full border border-border-subtle px-3 py-1 text-xs text-foreground-subtle'}
              >
                {billRequested ? '🧾 Cuenta' : `Pedidos (${orders.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {view === 'menu' && !billRequested && !sessionClosed ? (
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const items = menu.filter((m) => m.category === cat && m.isAvailable)
              return (
                <MenuSection
                  key={cat}
                  category={cat}
                  items={items}
                  cart={cartQuantities}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              )
            })}
            {menu.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm text-foreground-subtle">La carta aún no está disponible.</p>
              </div>
            )}
          </div>
        ) : (
          <OrderStatusView
            orders={orders}
            onOrderMore={() => setView('menu')}
            onRequestBill={handleRequestBill}
            billRequested={billRequested}
            sessionClosed={sessionClosed}
          />
        )}
      </div>

      {/* Cart drawer (only on menu view, not if bill requested) */}
      {view === 'menu' && !billRequested && !sessionClosed && (
        <CartDrawer
          items={cartItems}
          onUpdateNotes={updateItemNotes}
          onRemove={removeItemEntirely}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  )
}
