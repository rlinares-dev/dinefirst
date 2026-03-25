'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getUser, getReservationsForUser, updateReservationStatus } from '@/lib/data'
import { emailReservationCancellation } from '@/lib/email-client'
import type { Reservation, ReservationStatus } from '@/types/database'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  no_show: 'No-show',
}

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
  confirmed: 'text-success border-success/20 bg-success/10',
  cancelled: 'text-red-400 border-red-400/20 bg-red-400/10',
  no_show: 'text-foreground-subtle border-border-subtle bg-border-subtle/20',
}

const SLUG_MAP: Record<string, string> = {
  'rest-1': 'la-taberna-del-chef',
  'rest-2': 'el-rincon-de-la-abuela',
  'rest-3': 'sake-and-fusion',
}

export default function AppReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (user) setReservations(getReservationsForUser(user.id))
    else setReservations([])
    setLoaded(true)
  }, [])

  function confirmCancel(id: string) {
    const reservation = reservations.find((r) => r.id === id)
    updateReservationStatus(id, 'cancelled')
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
    setCancelId(null)

    // Enviar email de cancelación (non-blocking)
    if (reservation) {
      emailReservationCancellation({
        userName: reservation.userName,
        userEmail: reservation.userEmail,
        restaurantName: reservation.restaurantName,
        date: reservation.date,
        time: reservation.time,
        confirmationCode: reservation.confirmationCode,
      })
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)
  const upcomingCount = reservations.filter((r) => r.date >= today && r.status !== 'cancelled').length
  const pastCount = reservations.filter((r) => r.date < today).length

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mis reservas</h1>
            <p className="mt-1 text-sm">
              {upcomingCount} próxima{upcomingCount !== 1 ? 's' : ''} · {pastCount} pasada{pastCount !== 1 ? 's' : ''}
            </p>
          </div>
          <a href="/app" className="btn-primary text-xs px-4 py-2 shrink-0">
            + Nueva reserva
          </a>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Total', value: reservations.length, color: 'text-foreground' },
            { label: 'Confirmadas', value: reservations.filter((r) => r.status === 'confirmed').length, color: 'text-success' },
            { label: 'Canceladas', value: reservations.filter((r) => r.status === 'cancelled').length, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="card py-4">
              <p className="text-xs text-foreground-subtle">{s.label}</p>
              <p className={clsx('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'Todas'],
            ['confirmed', 'Confirmadas'],
            ['pending', 'Pendientes'],
            ['cancelled', 'Canceladas'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                filter === val
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-subtle text-foreground-subtle hover:border-accent/40 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {!loaded ? (
          <div className="py-10 text-center text-foreground-subtle">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium text-foreground">
              {filter === 'all' ? 'No tienes reservas aún' : 'No hay reservas con este estado'}
            </p>
            {filter === 'all' && (
              <a href="/app" className="btn-primary mt-4 inline-block text-sm">
                Explorar restaurantes
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((res) => {
                const isPast = res.date < today
                return (
                  <div key={res.id} className={clsx('card', isPast && 'opacity-70')}>
                    {cancelId === res.id ? (
                      <div className="py-2 text-center">
                        <p className="mb-3 text-sm font-medium text-foreground">
                          ¿Cancelar la reserva en {res.restaurantName}?
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => confirmCancel(res.id)}
                            className="rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition"
                          >
                            Sí, cancelar
                          </button>
                          <button onClick={() => setCancelId(null)} className="btn-secondary text-xs py-2">
                            Volver
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-semibold text-foreground">{res.restaurantName}</h2>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-subtle">
                              <span>📅 {res.date}</span>
                              <span>🕐 {res.time}</span>
                              <span>👥 {res.partySize} pax</span>
                              <span>🪑 {res.tableName}</span>
                            </div>
                            {res.specialRequests && (
                              <p className="mt-1.5 text-xs text-foreground-subtle">ℹ️ {res.specialRequests}</p>
                            )}
                          </div>
                          <span className={clsx('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium', STATUS_STYLE[res.status])}>
                            {STATUS_LABEL[res.status]}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border-subtle/50 pt-3">
                          <span className="font-mono text-xs text-foreground-subtle">
                            {res.confirmationCode}
                          </span>
                          <div className="flex gap-3">
                            <a
                              href={`/restaurantes/${res.restaurantCity}/${SLUG_MAP[res.restaurantId] ?? res.restaurantId}`}
                              className="text-xs text-accent hover:text-accent-soft transition"
                            >
                              Ver restaurante
                            </a>
                            {res.status !== 'cancelled' && res.status !== 'no_show' && !isPast && (
                              <button
                                onClick={() => setCancelId(res.id)}
                                className="text-xs text-red-400/50 hover:text-red-400 transition"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </main>
  )
}
