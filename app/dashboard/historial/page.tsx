'use client'

import { useState, useCallback } from 'react'
import clsx from 'clsx'
import {
  getSessionsForRestaurant,
  getOrdersForSession,
  getTablesForRestaurant,
  getCamarerosForRestaurant,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetSessionsForRestaurant,
  sbGetOrdersForSession,
  sbGetTablesForRestaurant,
  sbGetCamarerosForRestaurant,
} from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { TableSession, Order, Table, User } from '@/types/database'
import { PageTransition } from '@/components/ui/page-transition'
import { usePolling } from '@/lib/hooks/use-polling'

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startedAt: string, closedAt: string | null): string {
  const end = closedAt ? new Date(closedAt).getTime() : Date.now()
  const diff = end - new Date(startedAt).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + '€'
}

// ── Types ────────────────────────────────────────────────────────────

interface SessionWithOrders extends TableSession {
  orders: Order[]
  tableName: string
  waiterName: string
}

type DateFilter = 'today' | 'week' | 'month' | 'all'

// ── Component ────────────────────────────────────────────────────────

export default function HistorialPage() {
  const { restaurantId, loading: restaurantLoading } = useRestaurant()
  const [sessions, setSessions] = useState<SessionWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('week')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!restaurantId) return
    const sb = isSupabaseConfigured()

    try {
      // Try Supabase first, fall back to localStorage
      let allSessions: TableSession[]
      let tables: Table[]
      let camareros: User[]

      // Always load from localStorage (mock data always available)
      // Mock data uses 'rest-1'; Supabase may use a UUID — try both
      const localId = restaurantId
      const localSessions = getSessionsForRestaurant(localId).length > 0
        ? getSessionsForRestaurant(localId)
        : getSessionsForRestaurant('rest-1')
      const localTables = getTablesForRestaurant(localId).length > 0
        ? getTablesForRestaurant(localId)
        : getTablesForRestaurant('rest-1')
      const localCamareros = getCamarerosForRestaurant(localId).length > 0
        ? getCamarerosForRestaurant(localId)
        : getCamarerosForRestaurant('rest-1')

      if (sb) {
        const [sbSessions, sbTables, sbCamareros] = await Promise.all([
          sbGetSessionsForRestaurant(restaurantId).catch(() => []),
          sbGetTablesForRestaurant(restaurantId).catch(() => []),
          sbGetCamarerosForRestaurant(restaurantId).catch(() => []),
        ])
        // Merge: Supabase data first, then localStorage for any missing
        const sbSessionIds = new Set(sbSessions.map((s: TableSession) => s.id))
        allSessions = [...sbSessions, ...localSessions.filter((s: TableSession) => !sbSessionIds.has(s.id))]
        const sbTableIds = new Set(sbTables.map((t: Table) => t.id))
        tables = [...sbTables, ...localTables.filter((t: Table) => !sbTableIds.has(t.id))]
        const sbWaiterIds = new Set(sbCamareros.map((w: User) => w.id))
        camareros = [...sbCamareros, ...localCamareros.filter((w: User) => !sbWaiterIds.has(w.id))]
      } else {
        allSessions = localSessions
        tables = localTables
        camareros = localCamareros
      }

      const tableMap = new Map<string, Table>(tables.map((t: Table) => [t.id, t]))
      const waiterMap = new Map<string, User>(camareros.map((w: User) => [w.id, w]))

      // Only closed sessions for historial
      const closedSessions = allSessions.filter((s: TableSession) => s.closedAt !== null)

      // Load orders for each session
      const sessionsWithOrders: SessionWithOrders[] = await Promise.all(
        closedSessions.map(async (session: TableSession) => {
          let orders: Order[] = []
          try {
            if (sb) {
              orders = await sbGetOrdersForSession(session.id)
            }
            // Merge/fallback: also check localStorage for mock orders
            if (orders.length === 0) {
              orders = getOrdersForSession(session.id)
            }
          } catch {
            orders = getOrdersForSession(session.id)
          }
          const table = tableMap.get(session.tableId)
          const waiter = session.waiterId ? waiterMap.get(session.waiterId) : null
          return {
            ...session,
            orders,
            tableName: table?.name ?? 'Mesa eliminada',
            waiterName: waiter?.name ?? '—',
          }
        })
      )

      // Sort by closedAt descending (most recent first)
      sessionsWithOrders.sort((a, b) =>
        new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime()
      )

      setSessions(sessionsWithOrders)
    } catch (e) {
      console.error('Error loading historial:', e)
    }
    setLoading(false)
  }, [restaurantId])

  usePolling(loadData, 30000, !!restaurantId) // Only poll when restaurantId is resolved

  // ── Filtering ────────────────────────────────────────────────────

  const filteredSessions = sessions.filter((s) => {
    // Date filter
    const closedDate = new Date(s.closedAt!)
    const now = new Date()

    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (closedDate < today) return false
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (closedDate < weekAgo) return false
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      if (closedDate < monthAgo) return false
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesTable = s.tableName.toLowerCase().includes(q)
      const matchesWaiter = s.waiterName.toLowerCase().includes(q)
      const matchesItem = s.orders.some((o) =>
        o.items.some((item) => item.name.toLowerCase().includes(q))
      )
      if (!matchesTable && !matchesWaiter && !matchesItem) return false
    }

    return true
  })

  // ── Stats ────────────────────────────────────────────────────────

  const totalRevenue = filteredSessions.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalOrders = filteredSessions.reduce((sum, s) => sum + s.orders.length, 0)
  const avgTicket = filteredSessions.length > 0 ? totalRevenue / filteredSessions.length : 0

  // ── Render ───────────────────────────────────────────────────────

  if (loading || restaurantLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="ml-3 text-foreground-subtle">Cargando historial...</span>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Historial de sesiones</h1>
          <p className="text-sm text-foreground-subtle mt-1">
            Sesiones cerradas, pedidos y facturación
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-foreground-subtle">Sesiones</p>
            <p className="text-2xl font-bold text-accent">{filteredSessions.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-foreground-subtle">Ingresos</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-foreground-subtle">Pedidos</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-foreground-subtle">Ticket medio</p>
            <p className="text-2xl font-bold">{formatCurrency(avgTicket)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5">
            {([
              ['today', 'Hoy'],
              ['week', '7 días'],
              ['month', '30 días'],
              ['all', 'Todo'],
            ] as [DateFilter, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setDateFilter(value)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition',
                  dateFilter === value
                    ? 'bg-accent text-white'
                    : 'bg-background-elevated text-foreground-subtle hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar mesa, camarero o plato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Sessions list */}
        {filteredSessions.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-foreground-subtle">No hay sesiones cerradas en este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const isExpanded = expandedSession === session.id
              const itemCount = session.orders.reduce((sum, o) => sum + o.items.length, 0)

              return (
                <div key={session.id} className="card overflow-hidden">
                  {/* Session summary row */}
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="w-full p-4 text-left hover:bg-background-elevated/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
                          {session.tableName.replace('Mesa ', 'M')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.tableName}</p>
                          <p className="text-xs text-foreground-subtle">
                            {formatDate(session.closedAt!)} · {formatTime(session.startedAt)} → {formatTime(session.closedAt!)}
                            {' · '}{formatDuration(session.startedAt, session.closedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-accent">{formatCurrency(session.totalAmount)}</p>
                          <p className="text-[10px] text-foreground-subtle">
                            {session.orders.length} pedido{session.orders.length !== 1 ? 's' : ''} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={clsx(
                          'text-foreground-subtle transition-transform',
                          isExpanded && 'rotate-180'
                        )}>
                          ▾
                        </span>
                      </div>
                    </div>

                    {/* Waiter badge */}
                    {session.waiterName !== '—' && (
                      <p className="mt-1.5 text-[10px] text-foreground-subtle/70">
                        ◇ {session.waiterName}
                      </p>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border-subtle bg-background-elevated/30 p-4 space-y-3">
                      {session.orders.length === 0 ? (
                        <p className="text-xs text-foreground-subtle">Sin pedidos registrados</p>
                      ) : (
                        session.orders.map((order, orderIdx) => (
                          <div key={order.id} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-foreground-subtle">
                                Pedido #{orderIdx + 1}
                              </span>
                              <span className={clsx(
                                'rounded-full px-2 py-0.5 text-[9px] font-medium',
                                order.status === 'paid' && 'bg-green-500/10 text-green-400',
                                order.status === 'served' && 'bg-blue-500/10 text-blue-400',
                                order.status === 'cancelled' && 'bg-red-500/10 text-red-400',
                                (order.status === 'pending' || order.status === 'preparing') && 'bg-amber-500/10 text-amber-400',
                              )}>
                                {order.status === 'paid' ? 'Cobrado' :
                                 order.status === 'served' ? 'Servido' :
                                 order.status === 'cancelled' ? 'Cancelado' :
                                 order.status === 'preparing' ? 'Preparando' : 'Pendiente'}
                              </span>
                              <span className="text-[10px] text-foreground-subtle/50">
                                {formatTime(order.createdAt)}
                              </span>
                            </div>
                            <div className="ml-2 space-y-0.5">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                  <span className="text-foreground-subtle">
                                    {item.quantity > 1 && <span className="text-accent font-medium">{item.quantity}× </span>}
                                    {item.name}
                                    {item.notes && <span className="ml-1 text-foreground-subtle/50">({item.notes})</span>}
                                  </span>
                                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            {order.notes && (
                              <p className="ml-2 text-[10px] text-foreground-subtle/70 italic">
                                Nota: {order.notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}

                      {/* Session total */}
                      <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                        <span className="text-xs font-medium text-foreground-subtle">Total sesión</span>
                        <span className="text-sm font-bold text-accent">{formatCurrency(session.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
