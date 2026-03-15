'use client'

import { useState, useCallback } from 'react'
import clsx from 'clsx'
import {
  getTablesForRestaurant,
  updateTableStatus,
  createSession,
  closeSession,
  getActiveSessionForTable,
  getPendingOrdersForRestaurant,
  getSessionsForRestaurant,
} from '@/lib/data'
import type { Table, TableStatus } from '@/types/database'
import { usePolling } from '@/lib/hooks/use-polling'
import { useBroadcast } from '@/lib/hooks/use-broadcast'
import { playOrderSound } from '@/lib/sounds'
import TableTile from '@/components/tpv/table-tile'

const RESTAURANT_ID = 'rest-1'
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
  const [tables, setTables] = useState<Table[]>([])
  const [filter, setFilter] = useState<TableStatus | 'all'>('all')
  const [prevPendingCount, setPrevPendingCount] = useState(0)
  const [sessionMap, setSessionMap] = useState<Record<string, string>>({})
  const [pendingMap, setPendingMap] = useState<Record<string, number>>({})

  const { broadcast } = useBroadcast<string>(() => {
    // On cross-tab message, refresh data
    refreshData()
  })

  const refreshData = useCallback(() => {
    const allTables = getTablesForRestaurant(RESTAURANT_ID)
    setTables(allTables)

    // Build session duration map
    const sMap: Record<string, string> = {}
    allTables.forEach((t) => {
      if (t.status === 'occupied' || t.status === 'en_route') {
        const session = getActiveSessionForTable(t.id)
        if (session) sMap[t.id] = getSessionDuration(session.startedAt)
      }
    })
    setSessionMap(sMap)

    // Build pending orders map per table
    const pendingOrders = getPendingOrdersForRestaurant(RESTAURANT_ID)
    const pMap: Record<string, number> = {}
    pendingOrders.forEach((o) => {
      pMap[o.tableId] = (pMap[o.tableId] ?? 0) + 1
    })
    setPendingMap(pMap)

    // Play sound if new pending orders appeared
    const totalPending = pendingOrders.length
    setPrevPendingCount((prev) => {
      if (totalPending > prev && prev > 0) {
        playOrderSound()
      }
      return totalPending
    })
  }, [])

  usePolling(refreshData, POLL_INTERVAL)

  function handleOccupy(table: Table) {
    createSession(table.id, RESTAURANT_ID)
    broadcast('table-update')
    refreshData()
  }

  function handleFree(table: Table) {
    const session = getActiveSessionForTable(table.id)
    if (session) {
      closeSession(session.id)
    } else {
      updateTableStatus(table.id, 'free')
    }
    broadcast('table-update')
    refreshData()
  }

  function handleClick(table: Table) {
    if (table.status === 'occupied' || table.status === 'en_route') {
      window.location.href = `/dashboard/tpv/${table.id}`
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
  const activeSessions = getSessionsForRestaurant(RESTAURANT_ID).filter((s) => !s.closedAt).length

  return (
    <div className="space-y-6">
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
            <p className={clsx('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((t) => (
            <TableTile
              key={t.id}
              table={t}
              pendingOrders={pendingMap[t.id] ?? 0}
              sessionDuration={sessionMap[t.id]}
              onOccupy={() => handleOccupy(t)}
              onFree={() => handleFree(t)}
              onClick={() => handleClick(t)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
