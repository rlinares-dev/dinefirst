'use client'

import { useCallback, useState } from 'react'
import clsx from 'clsx'
import {
  getReservationsForRestaurant,
  getOrdersForRestaurant,
  getSessionsForRestaurant,
  getTablesForRestaurant,
  getCamarerosForRestaurant,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetReservationsForRestaurant,
  sbGetOrdersForRestaurant,
  sbGetSessionsForRestaurant,
  sbGetTablesForRestaurant,
  sbGetCamarerosForRestaurant,
} from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { usePolling } from '@/lib/hooks/use-polling'
import { PageTransition } from '@/components/ui/page-transition'
import type { Reservation, Order, TableSession, Table, User } from '@/types/database'

// ── Helpers ──────────────────────────────────────────────────────────

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + '€'
}

function periodDays(period: '7d' | '30d' | '90d'): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function isWithinPeriod(dateStr: string, days: number): boolean {
  const d = new Date(dateStr)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return d >= cutoff
}

// ── Sub-components ───────────────────────────────────────────────────

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground-subtle">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-border-subtle">
        <div className={clsx('h-2 rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function BarChart({ data, color = 'bg-accent/80' }: { data: { label: string; value: number; sub?: string }[]; color?: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end justify-between gap-2">
      {data.map((d) => {
        const pct = (d.value / maxVal) * 100
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium text-foreground">{d.value > 0 ? d.sub ?? d.value : ''}</span>
            <div className="relative w-full rounded bg-border-subtle" style={{ height: '100px' }}>
              <div
                className={clsx('absolute bottom-0 w-full rounded transition-all duration-700', color)}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-foreground-subtle">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Fallback helper ──────────────────────────────────────────────────

function localWithFallback<T>(fn: (id: string) => T[], restaurantId: string): T[] {
  const result = fn(restaurantId)
  if (Array.isArray(result) && result.length > 0) return result
  return fn('rest-1')
}

// ── Component ────────────────────────────────────────────────────────

export default function DashboardAnalyticsPage() {
  const { restaurantId, loading: restaurantLoading } = useRestaurant()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sessions, setSessions] = useState<TableSession[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [waiters, setWaiters] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const loadData = useCallback(async () => {
    if (!restaurantId) return
    const sb = isSupabaseConfigured()
    try {
      if (sb) {
        const [sbRes, sbOrd, sbSess, sbTbl, sbWait] = await Promise.all([
          sbGetReservationsForRestaurant(restaurantId).catch(() => []),
          sbGetOrdersForRestaurant(restaurantId).catch(() => []),
          sbGetSessionsForRestaurant(restaurantId).catch(() => []),
          sbGetTablesForRestaurant(restaurantId).catch(() => []),
          sbGetCamarerosForRestaurant(restaurantId).catch(() => []),
        ])
        const localRes = localWithFallback(getReservationsForRestaurant, restaurantId)
        const localOrd = localWithFallback(getOrdersForRestaurant, restaurantId)
        const localSess = localWithFallback(getSessionsForRestaurant, restaurantId)
        const localTbl = localWithFallback(getTablesForRestaurant, restaurantId)
        const localWait = localWithFallback(getCamarerosForRestaurant, restaurantId)

        // Merge: Supabase first, then localStorage
        const merge = <T extends { id: string }>(sb: T[], local: T[]) => {
          const ids = new Set(sb.map((x) => x.id))
          return [...sb, ...local.filter((x) => !ids.has(x.id))]
        }
        setReservations(merge(sbRes, localRes))
        setOrders(merge(sbOrd, localOrd))
        setSessions(merge(sbSess, localSess))
        setTables(merge(sbTbl, localTbl))
        setWaiters(merge(sbWait, localWait))
      } else {
        setReservations(localWithFallback(getReservationsForRestaurant, restaurantId))
        setOrders(localWithFallback(getOrdersForRestaurant, restaurantId))
        setSessions(localWithFallback(getSessionsForRestaurant, restaurantId))
        setTables(localWithFallback(getTablesForRestaurant, restaurantId))
        setWaiters(localWithFallback(getCamarerosForRestaurant, restaurantId))
      }
    } catch (e) {
      console.error('Error loading analytics:', e)
    }
    setLoading(false)
  }, [restaurantId])

  usePolling(loadData, 60000, !!restaurantId)

  // ── Period filtering ───────────────────────────────────────────────

  const days = periodDays(period)
  const filteredOrders = orders.filter((o) => isWithinPeriod(o.createdAt, days))
  const filteredSessions = sessions.filter((s) => s.closedAt && isWithinPeriod(s.closedAt, days))
  const filteredReservations = reservations.filter((r) => isWithinPeriod(r.date, days))

  // ── KPI calculations ──────────────────────────────────────────────

  const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const completedOrders = filteredOrders.filter((o) => o.status === 'served' || o.status === 'paid')
  const totalRevenue = completedOrders.reduce((s, o) => s + orderTotal(o), 0)
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
  const closedSessionCount = filteredSessions.length
  const avgSessionRevenue = closedSessionCount > 0
    ? filteredSessions.reduce((s, sess) => s + sess.totalAmount, 0) / closedSessionCount
    : 0

  // Reservation metrics
  const totalRes = filteredReservations.length
  const confirmed = filteredReservations.filter((r) => r.status === 'confirmed').length
  const cancelled = filteredReservations.filter((r) => r.status === 'cancelled').length
  const noShow = filteredReservations.filter((r) => r.status === 'no_show').length
  const pendingRes = filteredReservations.filter((r) => r.status === 'pending').length
  const confirmedRate = totalRes > 0 ? Math.round((confirmed / totalRes) * 100) : 0
  const cancelRate = totalRes > 0 ? Math.round((cancelled / totalRes) * 100) : 0

  // ── Pedidos por día de la semana (real data) ──────────────────────

  const ordersByDow = new Array(7).fill(0)
  filteredOrders.forEach((o) => {
    const dow = new Date(o.createdAt).getDay()
    // JS: 0=Sun, convert to Mon=0
    ordersByDow[(dow + 6) % 7]++
  })
  const weeklyData = DAYS.map((day, i) => ({ label: day, value: ordersByDow[i] }))

  // ── Pedidos por hora (real data) ──────────────────────────────────

  const ordersByHour = new Map<number, number>()
  filteredOrders.forEach((o) => {
    const h = new Date(o.createdAt).getHours()
    ordersByHour.set(h, (ordersByHour.get(h) ?? 0) + 1)
  })
  const hourlySlots = [12, 13, 14, 15, 16, 19, 20, 21, 22, 23]
  const hourlyData = hourlySlots
    .map((h) => ({ label: `${h}h`, value: ordersByHour.get(h) ?? 0 }))
    .filter((h) => h.value > 0 || hourlySlots.indexOf(parseInt(h.label)) >= 0)

  // ── Platos más vendidos (real data) ───────────────────────────────

  const dishMap = new Map<string, { name: string; qty: number; revenue: number }>()
  filteredOrders.forEach((o) =>
    o.items.forEach((item) => {
      const existing = dishMap.get(item.menuItemId)
      if (existing) {
        existing.qty += item.quantity
        existing.revenue += item.quantity * item.price
      } else {
        dishMap.set(item.menuItemId, { name: item.name, qty: item.quantity, revenue: item.quantity * item.price })
      }
    }),
  )
  const topDishes = [...dishMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 6)
  const maxDishQty = Math.max(...topDishes.map((d) => d.qty), 1)

  // ── Ingresos por día (real data) ──────────────────────────────────

  const revenueByDay = new Map<string, number>()
  completedOrders.forEach((o) => {
    const day = o.createdAt.slice(0, 10)
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + orderTotal(o))
  })
  const revenueDays = [...revenueByDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)

  // ── Rendimiento por mesa ──────────────────────────────────────────

  const tableRevMap = new Map<string, { name: string; sessions: number; revenue: number }>()
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  filteredSessions.forEach((s) => {
    const table = tableMap.get(s.tableId)
    const name = table?.name ?? s.tableId
    const existing = tableRevMap.get(s.tableId)
    if (existing) {
      existing.sessions++
      existing.revenue += s.totalAmount
    } else {
      tableRevMap.set(s.tableId, { name, sessions: 1, revenue: s.totalAmount })
    }
  })
  const topTables = [...tableRevMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const maxTableRev = Math.max(...topTables.map((t) => t.revenue), 1)

  // ── Rendimiento por camarero ──────────────────────────────────────

  const waiterMap = new Map(waiters.map((w) => [w.id, w]))
  const waiterRevMap = new Map<string, { name: string; sessions: number; revenue: number }>()
  filteredSessions.forEach((s) => {
    if (!s.waiterId) return
    const waiter = waiterMap.get(s.waiterId)
    const name = waiter?.name ?? 'Desconocido'
    const existing = waiterRevMap.get(s.waiterId)
    if (existing) {
      existing.sessions++
      existing.revenue += s.totalAmount
    } else {
      waiterRevMap.set(s.waiterId, { name, sessions: 1, revenue: s.totalAmount })
    }
  })
  const topWaiters = [...waiterRevMap.values()].sort((a, b) => b.revenue - a.revenue)

  // ── KPIs array ────────────────────────────────────────────────────

  const periodLabel = period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'
  const kpis = [
    { label: 'Ingresos', value: formatCurrency(totalRevenue), sub: `${completedOrders.length} pedidos`, color: 'text-green-400' },
    { label: 'Sesiones', value: closedSessionCount, sub: periodLabel, color: 'text-accent' },
    { label: 'Ticket medio', value: formatCurrency(avgTicket), sub: 'por pedido', color: 'text-accent-soft' },
    { label: 'Media/sesión', value: formatCurrency(avgSessionRevenue), sub: 'ingreso medio', color: 'text-accent' },
    { label: 'Reservas', value: totalRes, sub: `${confirmedRate}% confirmadas`, color: 'text-blue-400' },
    { label: 'Cancelación', value: `${cancelRate}%`, sub: `${cancelled} canceladas`, color: 'text-red-400' },
  ]

  // ── Render ────────────────────────────────────────────────────────

  if (loading || restaurantLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="ml-3 text-foreground-subtle">Cargando analíticas...</span>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analíticas</h1>
            <p className="mt-1 text-sm text-foreground-subtle">Métricas de rendimiento, ventas y ocupación</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'rounded px-3 py-1.5 text-xs font-medium transition',
                  period === p ? 'bg-accent text-white' : 'text-foreground-subtle hover:text-foreground',
                )}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="card p-4">
              <p className="text-xs text-foreground-subtle">{k.label}</p>
              <p className={clsx('mt-1 text-2xl font-bold', k.color)}>{k.value}</p>
              <p className="mt-0.5 text-[10px] text-foreground-subtle/70">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue per day chart */}
        <div className="card">
          <h2 className="mb-5 text-base font-semibold">Ingresos por día</h2>
          {revenueDays.length === 0 ? (
            <p className="text-sm text-foreground-subtle">No hay datos de ingresos en este período.</p>
          ) : (
            <BarChart
              data={revenueDays.map(([day, revenue]) => ({
                label: new Date(day + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                value: revenue,
                sub: `${revenue.toFixed(0)}€`,
              }))}
              color="bg-green-500/70"
            />
          )}
        </div>

        {/* 2-col: Orders by weekday + Orders by hour */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Pedidos por día de la semana</h2>
            <BarChart data={weeklyData} color="bg-accent/80" />
          </div>
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Pedidos por hora</h2>
            {hourlyData.every((h) => h.value === 0) ? (
              <p className="text-sm text-foreground-subtle">No hay datos en este período.</p>
            ) : (
              <BarChart data={hourlyData} color="bg-accent/70" />
            )}
          </div>
        </div>

        {/* 2-col: Top dishes + Top tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Popular dishes */}
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Platos más vendidos</h2>
            {topDishes.length === 0 ? (
              <p className="text-sm text-foreground-subtle">No hay datos de pedidos aún.</p>
            ) : (
              <div className="space-y-3">
                {topDishes.map((dish, i) => (
                  <div key={dish.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">
                        <span className="text-foreground-subtle mr-1">{i + 1}.</span>
                        {dish.name}
                      </span>
                      <span className="font-medium text-foreground">{dish.qty} uds · {dish.revenue.toFixed(0)}€</span>
                    </div>
                    <div className="h-2 rounded-full bg-border-subtle">
                      <div
                        className="h-2 rounded-full bg-accent transition-all duration-700"
                        style={{ width: `${(dish.qty / maxDishQty) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top tables */}
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Rendimiento por mesa</h2>
            {topTables.length === 0 ? (
              <p className="text-sm text-foreground-subtle">No hay datos de sesiones aún.</p>
            ) : (
              <div className="space-y-3">
                {topTables.map((table, i) => (
                  <div key={table.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">
                        <span className="text-foreground-subtle mr-1">{i + 1}.</span>
                        {table.name}
                      </span>
                      <span className="font-medium text-foreground">{table.sessions} sesiones · {formatCurrency(table.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border-subtle">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${(table.revenue / maxTableRev) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-col: Waiter performance + Reservation status */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Waiter performance */}
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Rendimiento por camarero</h2>
            {topWaiters.length === 0 ? (
              <p className="text-sm text-foreground-subtle">No hay datos de camareros asignados.</p>
            ) : (
              <div className="space-y-3">
                {topWaiters.map((w, i) => {
                  const maxWaiterRev = Math.max(...topWaiters.map((x) => x.revenue), 1)
                  return (
                    <div key={w.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">
                          <span className="text-foreground-subtle mr-1">{i + 1}.</span>
                          {w.name}
                        </span>
                        <span className="font-medium text-foreground">{w.sessions} sesiones · {formatCurrency(w.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border-subtle">
                        <div
                          className="h-2 rounded-full bg-purple-500 transition-all duration-700"
                          style={{ width: `${(w.revenue / maxWaiterRev) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Reservation status breakdown */}
          <div className="card">
            <h2 className="mb-5 text-base font-semibold">Estado de reservas</h2>
            {totalRes === 0 ? (
              <p className="text-sm text-foreground-subtle">No hay reservas en este período.</p>
            ) : (
              <div className="space-y-4">
                <StatBar label="Confirmadas" value={confirmed} max={totalRes} color="bg-success" />
                <StatBar label="Pendientes" value={pendingRes} max={totalRes} color="bg-yellow-400" />
                <StatBar label="Canceladas" value={cancelled} max={totalRes} color="bg-red-400" />
                <StatBar label="No-show" value={noShow} max={totalRes} color="bg-foreground-subtle" />
                <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                  <span className="text-xs text-foreground-subtle">Total</span>
                  <span className="text-sm font-bold text-accent">{totalRes} reservas</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
