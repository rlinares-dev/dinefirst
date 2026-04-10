'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getRestaurants, getReservations, getUser, logout } from '@/lib/data'
import type { Restaurant, Reservation } from '@/types/database'

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tab, setTab] = useState<'overview' | 'restaurants' | 'reservations'>('overview')

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      window.location.href = '/login'
      return
    }
    setRestaurants(getRestaurants())
    setReservations(getReservations())
  }, [])

  const active = restaurants.filter((r) => r.isActive).length
  const total = restaurants.length
  const planCounts = { basic: 0, pro: 0, premium: 0 }
  restaurants.forEach((r) => planCounts[r.plan]++)

  const resTotal = reservations.length
  const resConfirmed = reservations.filter((r) => r.status === 'confirmed').length
  const resPending = reservations.filter((r) => r.status === 'pending').length
  const resCancelled = reservations.filter((r) => r.status === 'cancelled').length

  const revEstimate = planCounts.basic * 49 + planCounts.pro * 99 + planCounts.premium * 199

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-xs text-red-400">
                Admin
              </span>
              <span className="text-xs text-foreground-subtle">Solo para el equipo DineFirst</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Panel de administración</h1>
            <p className="mt-1 text-sm">Gestión global de la plataforma</p>
          </div>
          <button
            onClick={() => { logout(); window.location.href = '/' }}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-xs text-foreground-subtle hover:text-red-400 hover:border-red-400/30 transition"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle gap-4">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'restaurants', label: `Restaurantes (${total})` },
            { id: 'reservations', label: `Reservas (${resTotal})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={clsx(
                'pb-2.5 pt-1 text-sm font-medium border-b-2 -mb-px transition',
                tab === t.id ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Restaurantes activos', value: active, sub: `${total} registrados`, color: 'text-accent' },
                { label: 'MRR estimado', value: `${revEstimate}€`, sub: 'Ingresos recurrentes', color: 'text-success' },
                { label: 'Total reservas', value: resTotal, sub: `${resConfirmed} confirmadas`, color: 'text-accent-soft' },
                { label: 'Tasa cancelación', value: resTotal === 0 ? '0%' : `${Math.round((resCancelled / resTotal) * 100)}%`, sub: `${resCancelled} canceladas`, color: 'text-yellow-400' },
              ].map((k) => (
                <div key={k.label} className="card">
                  <p className="text-xs text-foreground-subtle">{k.label}</p>
                  <p className={clsx('mt-1 text-3xl font-bold', k.color)}>{k.value}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Distribución de planes</h2>
                <div className="space-y-3">
                  {(['basic', 'pro', 'premium'] as const).map((plan) => {
                    const count = planCounts[plan]
                    const pct = total === 0 ? 0 : Math.round((count / total) * 100)
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-foreground-subtle">{plan}</span>
                          <span className="text-foreground">{count} · {pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-border-subtle">
                          <div
                            className={clsx('h-2 rounded-full', plan === 'premium' ? 'bg-accent-soft' : plan === 'pro' ? 'bg-accent' : 'bg-foreground-subtle')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Estado de reservas</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Confirmadas', value: resConfirmed, color: 'bg-success' },
                    { label: 'Pendientes', value: resPending, color: 'bg-yellow-400' },
                    { label: 'Canceladas', value: resCancelled, color: 'bg-red-400' },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground-subtle">{s.label}</span>
                        <span className="text-foreground">{s.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border-subtle">
                        <div className={clsx('h-2 rounded-full', s.color)} style={{ width: `${resTotal === 0 ? 0 : (s.value / resTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'restaurants' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-background-soft">
                  {['Nombre', 'Ciudad', 'Tipo', 'Plan', 'Rating', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r, i) => (
                  <tr key={r.id} className={clsx('border-b border-border-subtle/50 hover:bg-background-soft/30 transition', i === restaurants.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-foreground-subtle">{r.cuisineType}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-subtle">{r.city}</td>
                    <td className="px-4 py-3 text-foreground-subtle">{r.cuisineType}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('rounded-full border px-2 py-0.5 text-xs capitalize', r.plan === 'premium' ? 'border-accent-soft/30 text-accent-soft' : r.plan === 'pro' ? 'border-accent/30 text-accent' : 'border-border-subtle text-foreground-subtle')}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.rating} ⭐</td>
                    <td className="px-4 py-3">
                      <span className={clsx('rounded-full border px-2 py-0.5 text-xs', r.isActive ? 'border-success/20 bg-success/10 text-success' : 'border-border-subtle text-foreground-subtle')}>
                        {r.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reservations' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-background-soft">
                  {['Cliente', 'Restaurante', 'Fecha', 'Pax', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.sort((a, b) => b.date.localeCompare(a.date)).map((r, i) => (
                  <tr key={r.id} className={clsx('border-b border-border-subtle/50 hover:bg-background-soft/30 transition', i === reservations.length - 1 && 'border-b-0')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.userName}</p>
                      <p className="text-xs text-foreground-subtle">{r.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.restaurantName}</td>
                    <td className="px-4 py-3 text-foreground-subtle">{r.date} · {r.time}</td>
                    <td className="px-4 py-3 text-foreground">{r.partySize}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('rounded-full border px-2 py-0.5 text-xs',
                        r.status === 'confirmed' ? 'border-success/20 bg-success/10 text-success' :
                        r.status === 'pending' ? 'border-yellow-400/20 bg-yellow-400/10 text-yellow-400' :
                        'border-red-400/20 bg-red-400/10 text-red-400'
                      )}>
                        {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
