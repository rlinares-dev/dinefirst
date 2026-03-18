'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import {
  getTablesForRestaurant,
  updateTableStatus,
  createSession,
  closeSession,
  getActiveSessionForTable,
  getPendingOrdersForRestaurant,
  getSessionsForRestaurant,
  rotateWaiterAssignments,
  getCamarerosForRestaurant,
} from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import {
  sbGetTablesForRestaurant,
  sbUpdateTableStatus,
  sbCreateSession,
  sbCloseSession,
  sbGetActiveSessionForTable,
  sbGetPendingOrdersForRestaurant,
  sbGetSessionsForRestaurant,
  sbRotateWaiterAssignments,
  sbGetCamarerosForRestaurant,
} from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { useAuth } from '@/components/providers/auth-provider'
import type { Table, TableStatus, User } from '@/types/database'
import { usePolling } from '@/lib/hooks/use-polling'
import { useBroadcast } from '@/lib/hooks/use-broadcast'
import { playOrderSound } from '@/lib/sounds'
import TableTile from '@/components/tpv/table-tile'
import { useTableTimeout } from '@/lib/hooks/use-table-timeout'
import { PageTransition } from '@/components/ui/page-transition'
import { StaggeredGrid } from '@/components/ui/staggered-list'
import { AnimatedCounter } from '@/components/ui/counter'
import { useToast } from '@/components/ui/toast'
import { BillAlertOverlay, useBillAlerts } from '@/components/ui/bill-alert'
const POLL_INTERVAL = 5000

const STATUS_FILTERS: { label: string; value: TableStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Libres', value: 'free' },
  { label: 'Ocupadas', value: 'occupied' },
  { label: 'En camino', value: 'en_route' },
  { label: 'Reservadas', value: 'reserved' },
]

function getSessionDuration(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

export default function TPVPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { restaurantId } = useRestaurant()
  const [tables, setTables] = useState<Table[]>([])
  const [filter, setFilter] = useState<TableStatus | 'all'>('all')
  const [prevPendingCount, setPrevPendingCount] = useState(0)
  const [sessionMap, setSessionMap] = useState<Record<string, string>>({})
  const [pendingMap, setPendingMap] = useState<Record<string, number>>({})
  const [billRequestedMap, setBillRequestedMap] = useState<Record<string, boolean>>({})
  const [activeSessions, setActiveSessions] = useState(0)
  const [waiterNameMap, setWaiterNameMap] = useState<Record<string, string>>({})
  const rotationDoneRef = useRef(false)
  const { info } = useToast()
  const { alerts, showBillAlert, dismissAlert } = useBillAlerts()
  const isCamarero = user?.role === 'camarero'

  const { broadcast } = useBroadcast<string>(() => {
    refreshData()
  })

  const refreshData = useCallback(async () => {
    if (!restaurantId) return

    const sb = isSupabaseConfigured()

    // Trigger rotation once per day (only owner triggers, camareros just read)
    if (!rotationDoneRef.current && !isCamarero) {
      rotationDoneRef.current = true // Mark done BEFORE calling to prevent retries on error
      try {
        if (sb) { await sbRotateWaiterAssignments(restaurantId) } else { rotateWaiterAssignments(restaurantId) }
      } catch (e) {
        console.warn('Rotation skipped:', e)
      }
    }

    // Load waiter names for display
    const waiters: User[] = sb
      ? await sbGetCamarerosForRestaurant(restaurantId)
      : getCamarerosForRestaurant(restaurantId)
    const wMap: Record<string, string> = {}
    waiters.forEach((w) => { wMap[w.id] = w.name })
    setWaiterNameMap(wMap)

    let allTables = sb
      ? await sbGetTablesForRestaurant(restaurantId)
      : getTablesForRestaurant(restaurantId)

    // If camarero, filter to only their tables
    if (isCamarero && user?.id) {
      allTables = allTables.filter((t) => t.assignedWaiterId === user.id)
    }
    setTables(allTables)

    // Build session duration map + bill requested map
    const sMap: Record<string, string> = {}
    const bMap: Record<string, boolean> = {}
    for (const t of allTables) {
      if (t.status === 'occupied' || t.status === 'en_route') {
        const session = sb
          ? await sbGetActiveSessionForTable(t.id)
          : getActiveSessionForTable(t.id)
        if (session) {
          sMap[t.id] = getSessionDuration(session.startedAt)
          if (session.billRequested) bMap[t.id] = true
        }
      }
    }
    setSessionMap(sMap)
    setBillRequestedMap(bMap)

    // Build pending orders map per table
    const pendingOrders = sb
      ? await sbGetPendingOrdersForRestaurant(restaurantId)
      : getPendingOrdersForRestaurant(restaurantId)
    const pMap: Record<string, number> = {}
    pendingOrders.forEach((o) => {
      pMap[o.tableId] = (pMap[o.tableId] ?? 0) + 1
    })
    setPendingMap(pMap)

    // Active sessions count
    const sessions = sb
      ? await sbGetSessionsForRestaurant(restaurantId)
      : getSessionsForRestaurant(restaurantId)
    setActiveSessions(sessions.filter((s) => !s.closedAt).length)

    // Play sound + toast if new pending orders appeared
    const totalPending = pendingOrders.length
    setPrevPendingCount((prev) => {
      if (totalPending > prev && prev > 0) {
        playOrderSound()
        info(`Nuevo pedido recibido (${totalPending} pendientes)`)
      }
      return totalPending
    })

    // Show bill alert for newly detected bill requests (only for this user's tables)
    for (const t of allTables) {
      if (bMap[t.id]) {
        const session = sb
          ? await sbGetActiveSessionForTable(t.id)
          : getActiveSessionForTable(t.id)
        showBillAlert({
          tableName: t.name,
          tableId: t.id,
          total: session?.totalAmount ?? 0,
          requestedAt: new Date().toISOString(),
        })
      }
    }
  }, [restaurantId])

  usePolling(refreshData, POLL_INTERVAL)
  useTableTimeout(restaurantId)

  async function handleOccupy(table: Table) {
    if (isSupabaseConfigured()) {
      await sbCreateSession(table.id, restaurantId)
    } else {
      createSession(table.id, restaurantId)
    }
    broadcast('table-update')
    refreshData()
  }

  async function handleFree(table: Table) {
    const sb = isSupabaseConfigured()
    const session = sb
      ? await sbGetActiveSessionForTable(table.id)
      : getActiveSessionForTable(table.id)
    if (session) {
      if (sb) { await sbCloseSession(session.id) } else { closeSession(session.id) }
    } else {
      if (sb) { await sbUpdateTableStatus(table.id, 'free') } else { updateTableStatus(table.id, 'free') }
    }
    broadcast('table-update')
    refreshData()
  }

  function handleClick(table: Table) {
    if (table.status === 'occupied' || table.status === 'en_route') {
      router.push(`/dashboard/tpv/${table.id}`)
    }
  }

  const filtered = filter === 'all'
    ? tables.filter((t) => t.status !== 'inactive')
    : tables.filter((t) => t.status === filter)

  const counts: Record<string, number> = {
    all: tables.filter((t) => t.status !== 'inactive').length,
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    en_route: tables.filter((t) => t.status === 'en_route').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  }

  const totalPending = Object.values(pendingMap).reduce((s, n) => s + n, 0)

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
          <h1 className="text-2xl font-bold text-foreground">TPV — Mesas en vivo</h1>
          <p className="mt-1 text-sm text-foreground-subtle">
            {activeSessions} sesión{activeSessions !== 1 ? 'es' : ''} activa{activeSessions !== 1 ? 's' : ''}
            {totalPending > 0 && (
              <span className="ml-2 text-amber-400">
                · {totalPending} pedido{totalPending !== 1 ? 's' : ''} pendiente{totalPending !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-subtle">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refresh cada 5s
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Libres', value: counts.free, color: 'text-foreground-subtle' },
          { label: 'Ocupadas', value: counts.occupied, color: 'text-emerald-400' },
          { label: 'En camino', value: counts.en_route, color: 'text-amber-400' },
          { label: 'Pedidos pend.', value: totalPending, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-xs text-foreground-subtle">{s.label}</p>
            <AnimatedCounter value={s.value} className={clsx('mt-1 text-2xl font-bold', s.color)} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition',
              filter === f.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-subtle text-foreground-subtle hover:text-foreground hover:border-foreground-subtle',
            )}
          >
            {f.label}
            <span className="ml-1.5 text-foreground-subtle/60">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl mb-3">⊞</p>
          <p className="text-foreground font-medium">No hay mesas con este estado</p>
          <p className="text-sm text-foreground-subtle mt-1">Cambia el filtro o añade mesas en la sección Mesas</p>
        </div>
      ) : (
        <StaggeredGrid className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((t) => (
            <TableTile
              key={t.id}
              table={t}
              pendingOrders={pendingMap[t.id] ?? 0}
              sessionDuration={sessionMap[t.id]}
              billRequested={billRequestedMap[t.id] ?? false}
              waiterName={t.assignedWaiterId ? waiterNameMap[t.assignedWaiterId] : undefined}
              onOccupy={() => handleOccupy(t)}
              onFree={() => handleFree(t)}
              onClick={() => handleClick(t)}
            />
          ))}
        </StaggeredGrid>
      )}
    </PageTransition>
  )
}
