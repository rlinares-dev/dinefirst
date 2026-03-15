'use client'

import { useState, useCallback } from 'react'
import clsx from 'clsx'
import {
  getOrdersForRestaurant,
  getTablesForRestaurant,
  updateOrderStatus,
} from '@/lib/data'
import type { Order, OrderStatus } from '@/types/database'
import { usePolling } from '@/lib/hooks/use-polling'
import { useBroadcast } from '@/lib/hooks/use-broadcast'
import { playOrderSound } from '@/lib/sounds'
import ComandaCard from '@/components/comandas/comanda-card'

const RESTAURANT_ID = 'rest-1'

type FilterType = 'active' | 'pending' | 'preparing' | 'all'

export default function ComandasPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tableNames, setTableNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<FilterType>('active')
  const [prevPendingCount, setPrevPendingCount] = useState(0)

  const { broadcast } = useBroadcast<string>(() => refreshData())

  const refreshData = useCallback(() => {
    const allOrders = getOrdersForRestaurant(RESTAURANT_ID)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    setOrders(allOrders)

    const tables = getTablesForRestaurant(RESTAURANT_ID)
    const names: Record<string, string> = {}
    tables.forEach((t) => { names[t.id] = t.name })
    setTableNames(names)

    const pendingCount = allOrders.filter((o) => o.status === 'pending').length
    setPrevPendingCount((prev) => {
      if (pendingCount > prev && prev > 0) playOrderSound()
      return pendingCount
    })
  }, [])

  usePolling(refreshData, 3000)

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    updateOrderStatus(orderId, newStatus)
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
    <div className="space-y-6">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => (
            <ComandaCard
              key={order.id}
              order={order}
              tableName={tableNames[order.tableId] ?? 'Mesa ?'}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
