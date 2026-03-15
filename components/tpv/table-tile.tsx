'use client'

import clsx from 'clsx'
import type { Table, TableStatus } from '@/types/database'

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  en_route: 'En camino',
  reserved: 'Reservada',
  inactive: 'Inactiva',
}

const STATUS_COLORS: Record<TableStatus, string> = {
  free: 'text-foreground-subtle border-border-subtle',
  occupied: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  en_route: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  reserved: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  inactive: 'text-foreground-subtle/50 border-border-subtle',
}

interface TableTileProps {
  table: Table
  pendingOrders?: number
  sessionDuration?: string
  onOccupy?: () => void
  onFree?: () => void
  onClick?: () => void
}

export default function TableTile({ table, pendingOrders = 0, sessionDuration, onOccupy, onFree, onClick }: TableTileProps) {
  return (
    <div
      onClick={onClick}
      className={clsx('card relative flex flex-col gap-3 cursor-pointer', table.status === 'inactive' && 'opacity-50')}
    >
      {/* Pending orders badge */}
      {pendingOrders > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {pendingOrders}
        </span>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground">{table.name}</p>
          <p className="text-xs text-foreground-subtle mt-0.5">{table.location}</p>
        </div>
        <span className={clsx('rounded-full border px-2 py-0.5 text-xs', STATUS_COLORS[table.status])}>
          {STATUS_LABELS[table.status]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
          {table.capacity}
        </div>
        <span className="text-xs text-foreground-subtle">persona{table.capacity !== 1 ? 's' : ''}</span>
      </div>

      {sessionDuration && (
        <p className="text-[10px] font-mono text-foreground-subtle/50">{sessionDuration}</p>
      )}

      <div className="flex gap-2">
        {table.status === 'free' && onOccupy && (
          <button
            onClick={(e) => { e.stopPropagation(); onOccupy() }}
            className="flex-1 rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:border-emerald-400/30 hover:text-emerald-400 transition"
          >
            Ocupar
          </button>
        )}
        {(table.status === 'occupied' || table.status === 'en_route') && onFree && (
          <button
            onClick={(e) => { e.stopPropagation(); onFree() }}
            className="flex-1 rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:text-foreground transition"
          >
            Liberar
          </button>
        )}
      </div>
    </div>
  )
}
