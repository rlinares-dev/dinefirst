'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getReservationsForRestaurant, updateReservationStatus } from '@/lib/data'
import type { Reservation, ReservationStatus } from '@/types/database'

const RESTAURANT_ID = 'rest-1'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  no_show: 'No-show',
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  confirmed: 'text-success bg-success/10 border-success/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
  no_show: 'text-foreground-subtle bg-border-subtle border-border-strong',
}

export default function DashboardReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    setReservations(getReservationsForRestaurant(RESTAURANT_ID))
    setDateFilter(new Date().toISOString().slice(0, 10))
  }, [])

  function changeStatus(id: string, status: ReservationStatus) {
    updateReservationStatus(id, status)
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const filtered = reservations
    .filter((r) => (filter === 'all' || r.status === filter) && (!dateFilter || r.date === dateFilter))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reservas</h1>
          <p className="mt-1 text-sm">{reservations.length} total · {reservations.filter((r) => r.status === 'pending').length} pendientes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx('rounded-full border px-3 py-1.5 text-xs font-medium transition', filter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle text-foreground-subtle hover:border-accent/40')}
            >
              {s === 'all' ? 'Todas' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-foreground-subtle">No hay reservas con estos filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-background-elevated">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Cliente', 'Fecha y hora', 'Mesa', 'Pax', 'Estado', 'Acción'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((res, i) => (
                <tr key={res.id} className={clsx('border-b border-border-subtle/50 hover:bg-background-soft/30 transition', i === filtered.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{res.userName}</p>
                    {res.specialRequests && <p className="mt-0.5 text-xs text-foreground-subtle truncate max-w-[160px]">⚠ {res.specialRequests}</p>}
                  </td>
                  <td className="px-4 py-3 text-foreground-subtle">
                    <p>{res.date}</p>
                    <p className="text-xs">{res.time}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground-subtle">{res.tableName}</td>
                  <td className="px-4 py-3 text-foreground">{res.partySize}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('rounded-full border px-2 py-0.5 text-xs', STATUS_COLOR[res.status])}>
                      {STATUS_LABEL[res.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {res.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => changeStatus(res.id, 'confirmed')} className="rounded px-2 py-1 text-xs bg-success/10 text-success hover:bg-success/20 border border-success/20 transition">
                          Confirmar
                        </button>
                        <button onClick={() => changeStatus(res.id, 'cancelled')} className="rounded px-2 py-1 text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20 transition">
                          Cancelar
                        </button>
                      </div>
                    )}
                    {res.status === 'confirmed' && (
                      <button onClick={() => changeStatus(res.id, 'no_show')} className="rounded px-2 py-1 text-xs border border-border-subtle text-foreground-subtle hover:text-foreground transition">
                        No-show
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
