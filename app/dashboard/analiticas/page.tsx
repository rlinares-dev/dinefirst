'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getReservationsForRestaurant } from '@/lib/data'
import type { Reservation } from '@/types/database'

const RESTAURANT_ID = 'rest-1'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

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

function HourBar({ hour, count, max }: { hour: string; count: number; max: number }) {
  const pct = max === 0 ? 0 : (count / max) * 100
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-foreground">{count > 0 ? count : ''}</span>
      <div className="relative w-8 rounded bg-border-subtle" style={{ height: '80px' }}>
        <div
          className="absolute bottom-0 w-full rounded bg-accent/70 transition-all duration-700"
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-foreground-subtle">{hour}</span>
    </div>
  )
}

export default function DashboardAnalyticsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    setReservations(getReservationsForRestaurant(RESTAURANT_ID))
  }, [])

  // Summary metrics
  const total = reservations.length
  const confirmed = reservations.filter((r) => r.status === 'confirmed').length
  const cancelled = reservations.filter((r) => r.status === 'cancelled').length
  const noShow = reservations.filter((r) => r.status === 'no_show').length
  const pending = reservations.filter((r) => r.status === 'pending').length
  const avgPartySize = total === 0 ? 0 : (reservations.reduce((s, r) => s + r.partySize, 0) / total).toFixed(1)
  const confirmedRate = total === 0 ? 0 : Math.round((confirmed / total) * 100)
  const cancelRate = total === 0 ? 0 : Math.round((cancelled / total) * 100)

  // Mock weekly data
  const weeklyData = DAYS.map((day, i) => ({
    day,
    reservations: [3, 2, 4, 5, 8, 12, 9][i],
    capacity: 15,
  }))
  const maxWeekly = Math.max(...weeklyData.map((d) => d.reservations))

  // Mock hourly data
  const hourlyData = [
    { hour: '13h', count: 8 },
    { hour: '14h', count: 12 },
    { hour: '15h', count: 6 },
    { hour: '20h', count: 4 },
    { hour: '21h', count: 14 },
    { hour: '22h', count: 10 },
    { hour: '23h', count: 5 },
  ]
  const maxHourly = Math.max(...hourlyData.map((h) => h.count))

  // Customer origin (mock)
  const origins = [
    { label: 'Web directa', value: 45, color: 'bg-accent' },
    { label: 'Google', value: 28, color: 'bg-accent-soft' },
    { label: 'WhatsApp', value: 17, color: 'bg-success' },
    { label: 'Otros', value: 10, color: 'bg-foreground-subtle' },
  ]

  const kpis = [
    { label: 'Total reservas', value: total, sub: period, color: 'text-accent' },
    { label: 'Confirmadas', value: `${confirmedRate}%`, sub: `${confirmed} reservas`, color: 'text-success' },
    { label: 'Canceladas', value: `${cancelRate}%`, sub: `${cancelled} reservas`, color: 'text-red-400' },
    { label: 'Pax promedio', value: avgPartySize, sub: 'por reserva', color: 'text-accent-soft' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analíticas</h1>
          <p className="mt-1 text-sm">Métricas de ocupación, comportamiento y rendimiento</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx('rounded px-3 py-1 text-xs font-medium transition', period === p ? 'bg-accent text-background' : 'text-foreground-subtle hover:text-foreground')}
            >
              {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-xs text-foreground-subtle">{k.label}</p>
            <p className={clsx('mt-1 text-3xl font-bold', k.color)}>{k.value}</p>
            <p className="mt-1 text-xs text-foreground-subtle">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly occupancy chart */}
      <div className="card">
        <h2 className="mb-5 text-base font-semibold text-foreground">Reservas por día de la semana</h2>
        <div className="flex items-end justify-between gap-2">
          {weeklyData.map((d) => {
            const pct = maxWeekly === 0 ? 0 : (d.reservations / maxWeekly) * 100
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground">{d.reservations}</span>
                <div className="relative w-full rounded bg-border-subtle" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 w-full rounded bg-accent/80 transition-all duration-700"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-foreground-subtle">{d.day}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-foreground-subtle">Sábado y domingo tienen mayor ocupación.</p>
      </div>

      {/* 2-col grid: hourly + status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly distribution */}
        <div className="card">
          <h2 className="mb-5 text-base font-semibold text-foreground">Franja horaria más demandada</h2>
          <div className="flex items-end gap-2">
            {hourlyData.map((h) => (
              <HourBar key={h.hour} hour={h.hour} count={h.count} max={maxHourly} />
            ))}
          </div>
          <p className="mt-4 text-xs text-foreground-subtle">Las 21h es la hora más solicitada.</p>
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h2 className="mb-5 text-base font-semibold text-foreground">Desglose por estado</h2>
          <div className="space-y-4">
            <StatBar label="Confirmadas" value={confirmed} max={total} color="bg-success" />
            <StatBar label="Pendientes" value={pending} max={total} color="bg-yellow-400" />
            <StatBar label="Canceladas" value={cancelled} max={total} color="bg-red-400" />
            <StatBar label="No-show" value={noShow} max={total} color="bg-foreground-subtle" />
          </div>
        </div>
      </div>

      {/* Customer origin + top table */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Origin */}
        <div className="card">
          <h2 className="mb-5 text-base font-semibold text-foreground">Origen de las reservas</h2>
          <div className="space-y-3">
            {origins.map((o) => (
              <div key={o.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground-subtle">{o.label}</span>
                  <span className="font-medium text-foreground">{o.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-border-subtle">
                  <div className={clsx('h-2 rounded-full transition-all duration-700', o.color)} style={{ width: `${o.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="mb-5 text-base font-semibold text-foreground">Actividad reciente</h2>
          <div className="space-y-3">
            {reservations.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.userName}</p>
                  <p className="text-xs text-foreground-subtle">{r.date} · {r.time} · {r.partySize} pax</p>
                </div>
                <span
                  className={clsx(
                    'rounded-full border px-2 py-0.5 text-xs',
                    r.status === 'confirmed' ? 'text-success bg-success/10 border-success/20' :
                    r.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                    'text-red-400 bg-red-400/10 border-red-400/20',
                  )}
                >
                  {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
