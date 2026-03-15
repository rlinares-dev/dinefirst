'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import clsx from 'clsx'
import {
  getTablesForRestaurant,
  getActiveSessionForTable,
  getOrdersForSession,
  updateOrderStatus,
  closeSession,
  updateTableStatus,
} from '@/lib/data'
import type { Table, Order, OrderStatus } from '@/types/database'
import { usePolling } from '@/lib/hooks/use-polling'
import { playOrderSound } from '@/lib/sounds'
import { PageTransition } from '@/components/ui/page-transition'
import { StaggeredList } from '@/components/ui/staggered-list'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  served: 'Servido',
  paid: 'Pagado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  preparing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  served: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  paid: 'text-foreground-subtle bg-white/[0.06] border-border-subtle',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'served',
  served: 'paid',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Preparar',
  preparing: 'Marcar servido',
  served: 'Cobrar',
}

function formatDuration(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

export default function SessionDetailPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId

  const [table, setTable] = useState<Table | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStart, setSessionStart] = useState<string | null>(null)
  const [prevOrderCount, setPrevOrderCount] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const refreshData = useCallback(() => {
    const tables = getTablesForRestaurant('rest-1')
    const t = tables.find((tb) => tb.id === tableId)
    if (t) setTable(t)

    const session = getActiveSessionForTable(tableId)
    if (session) {
      setSessionId(session.id)
      setSessionStart(session.startedAt)
      const sessionOrders = getOrdersForSession(session.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      setOrders(sessionOrders)

      setPrevOrderCount((prev) => {
        if (sessionOrders.length > prev && prev > 0) playOrderSound()
        return sessionOrders.length
      })
    }
  }, [tableId])

  usePolling(refreshData, 5000)

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    updateOrderStatus(orderId, newStatus)
    refreshData()
  }

  function handleCloseSession() {
    if (!sessionId) return
    closeSession(sessionId)
    window.location.href = '/dashboard/tpv'
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-accent" />
          <p className="text-sm text-foreground-subtle">Cargando...</p>
        </div>
      </div>
    )
  }

  const total = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0)

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <a href="/dashboard/tpv" className="text-foreground-subtle hover:text-foreground transition text-sm">
              ← TPV
            </a>
            <h1 className="text-2xl font-bold text-foreground">{table.name}</h1>
          </div>
          <p className="mt-1 text-sm text-foreground-subtle">
            {table.location} · {table.capacity} pax
            {sessionStart && (
              <span className="ml-2 font-mono text-accent">{formatDuration(sessionStart)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-medium text-amber-400">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
          {sessionId && (
            <button
              onClick={handleCloseSession}
              className="btn-secondary text-xs"
            >
              Cerrar sesión · {total.toFixed(2)} €
            </button>
          )}
        </div>
      </div>

      {/* Session total */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground-subtle">Total sesión</p>
            <p className="text-3xl font-bold text-accent">{total.toFixed(2)} €</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground-subtle">Pedidos</p>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-foreground font-medium">Sin pedidos aún</p>
          <p className="text-sm text-foreground-subtle mt-1">Los pedidos del cliente aparecerán aquí</p>
        </div>
      ) : (
        <StaggeredList className="space-y-3">
          {orders.map((order) => {
            const orderTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
            const isExpanded = expandedOrder === order.id
            const nextStatus = NEXT_STATUS[order.status]
            const nextLabel = NEXT_LABEL[order.status]

            return (
              <div key={order.id} className="card">
                {/* Order header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx('rounded-full border px-2 py-0.5 text-xs', STATUS_COLORS[order.status])}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{orderTotal.toFixed(2)} €</span>
                    <span className="text-xs text-foreground-subtle">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="mt-3 border-t border-border-subtle pt-3">
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-foreground">{item.quantity}x</span>
                            <span className="ml-2 text-foreground-subtle">{item.name}</span>
                            {item.notes && (
                              <p className="text-[10px] text-foreground-subtle/50 italic mt-0.5">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-foreground-subtle">{(item.price * item.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="mt-2 text-xs text-foreground-subtle/50 italic">Nota: {order.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      {nextStatus && nextLabel && (
                        <button
                          onClick={() => handleStatusChange(order.id, nextStatus)}
                          className="btn-primary text-xs py-1.5"
                        >
                          {nextLabel}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'paid' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="rounded-md border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </StaggeredList>
      )}
    </PageTransition>
  )
}
