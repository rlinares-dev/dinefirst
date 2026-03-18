'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import {
  getOrdersForRestaurant,
  getTablesForRestaurant,
  getSessionsForRestaurant,
  updateOrderStatus,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetOrdersForRestaurant,
  sbGetTablesForRestaurant,
  sbGetSessionsForRestaurant,
  sbUpdateOrderStatus,
} from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useAuth } from '@/components/providers/auth-provider'
import type { Order, OrderStatus } from '@/types/database'
import { usePolling } from '@/lib/hooks/use-polling'
import { useBroadcast } from '@/lib/hooks/use-broadcast'
import { playOrderSound } from '@/lib/sounds'
import ComandaCard from '@/components/comandas/comanda-card'
import { PageTransition } from '@/components/ui/page-transition'
import { StaggeredGrid } from '@/components/ui/staggered-list'
import { BillAlertOverlay, useBillAlerts } from '@/components/ui/bill-alert'

type FilterType = 'active' | 'pending' | 'preparing' | 'all'

export default function ComandasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { restaurantId } = useRestaurant()
  const [orders, setOrders] = useState<Order[]>([])
  const [tableNames, setTableNames] = useState<Record<string, string>>({})
  const [tableWaiterMap, setTableWaiterMap] = useState<Record<string, string | undefined>>({})
  const [filter, setFilter] = useState<FilterType>('active')
  const [prevPendingCount, setPrevPendingCount] = useState(0)
  const { alerts, showBillAlert, dismissAlert } = useBillAlerts()
  const isCamarero = user?.role === 'camarero'

  const { broadcast } = useBroadcast<string>(() => refreshData())

  const refreshData = useCallback(async () => {
    if (!restaurantId) return

    const sb = isSupabaseConfigured()
    const tables = sb
      ? await sbGetTablesForRestaurant(restaurantId)
      : getTablesForRestaurant(restaurantId)
    const names: Record<string, string> = {}
    const twMap: Record<string, string | undefined> = {}
    tables.forEach((t) => { names[t.id] = t.name; twMap[t.id] = t.assignedWaiterId })
    setTableNames(names)
    setTableWaiterMap(twMap)

    // Get my table IDs if camarero
    const myTableIds = isCamarero && user?.id
      ? new Set(tables.filter((t) => t.assignedWaiterId === user.id).map((t) => t.id))
      : null

    let allOrders = (sb
      ? await sbGetOrdersForRestaurant(restaurantId)
      : getOrdersForRestaurant(restaurantId)
    ).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    // Filter orders to only my tables if camarero
    if (myTableIds) {
      allOrders = allOrders.filter((o) => myTableIds.has(o.tableId))
    }
    setOrders(allOrders)

    const pendingCount = allOrders.filter((o) => o.status === 'pending').length
    setPrevPendingCount((prev) => {
      if (pendingCount > prev && prev > 0) playOrderSound()
      return pendingCount
    })

    // Detect bill requests from active sessions
    const sessions = sb
      ? await sbGetSessionsForRestaurant(restaurantId)
      : getSessionsForRestaurant(restaurantId)
    for (const s of sessions) {
      if (!s.closedAt && s.billRequested) {
        showBillAlert({
          tableName: names[s.tableId] ?? 'Mesa ?',
          tableId: s.tableId,
          total: s.totalAmount ?? 0,
          requestedAt: new Date().toISOString(),
        })
      }
    }
  }, [restaurantId])

  usePolling(refreshData, 3000)

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    if (isSupabaseConfigured()) {
      await sbUpdateOrderStatus(orderId, newStatus)
    } else {
      updateOrderStatus(orderId, newStatus)
    }
    broadcast('order-update')
    refreshData()
  }

  const filtered = orders.filter((o) => {
    if (filter === 'active') return o.status === 'pending' || o.status === 'preparing'
    if (filter === 'pending') return o.status === 'pending'
    if (filter === 'preparing') return o.status === 'preparing'
    return true
  })

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const activeCount = pendingCount + preparingCount

  const filters: { label: string; value: FilterType; count: number }[] = [
    { label: 'Activas', value: 'active', count: activeCount },
    { label: 'Pendientes', value: 'pending', count: pendingCount },
    { label: 'Preparando', value: 'preparing', count: preparingCount },
    { label: 'Todas', value: 'all', count: orders.length },
  ]

  return (
    <PageTransition className="space-y-6">
      {/* Bill request alerts overlay */}
      <BillAlertOverlay
        alerts={alerts}
        onDismiss={dismissAlert}
        onNavigate={(tableId) => router.push(`/dashboard/tpv/${tableId}`)}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comandas</h1>
          <p className="mt-1 text-sm text-foreground-subtle">
            {activeCount} comanda{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400">
                · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-subtle">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refresh cada 3s
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <div className="card">
          <p className="text-xs text-foreground-subtle">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{pendingCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-foreground-subtle">Preparando</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{preparingCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-foreground-subtle">Total hoy</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition',
              filter === f.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-subtle text-foreground-subtle hover:text-foreground',
            )}
          >
            {f.label}
            <span className="ml-1.5 text-foreground-subtle/60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Comandas grid */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl mb-3">👨‍🍳</p>
          <p className="text-foreground font-medium">No hay comandas</p>
          <p className="text-sm text-foreground-subtle mt-1">Las nuevas comandas aparecerán aquí</p>
        </div>
      ) : (
        <StaggeredGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => (
            <ComandaCard
              key={order.id}
              order={order}
              tableName={tableNames[order.tableId] ?? 'Mesa ?'}
              onStatusChange={handleStatusChange}
            />
          ))}
        </StaggeredGrid>
      )}
    </PageTransition>
  )
}
