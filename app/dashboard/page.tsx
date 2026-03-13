'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getUser, getRestaurantsForOwner, getReservationsForRestaurant, updateReservationStatus, getReviewsForRestaurant, saveRestaurant, getRestaurantById, compressImage } from '@/lib/data'
import type { Restaurant, Reservation, ReservationStatus, Review } from '@/types/database'

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

export default function DashboardHomePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [galleryUploading, setGalleryUploading] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (!user) return

    const rests = getRestaurantsForOwner(user.id)
    // Use first restaurant or demo restaurant
    const rest = rests[0] ?? {
      id: 'rest-1',
      name: 'La Taberna del Chef',
      city: 'madrid',
      plan: 'pro',
      capacity: 60,
      isActive: true,
      rating: 4.7,
      reviewCount: 234,
    } as Restaurant
    setRestaurant(rest)

    const res = getReservationsForRestaurant('rest-1')
    setReservations(res)

    const revs = getReviewsForRestaurant('rest-1')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
    setRecentReviews(revs)

    setLoading(false)
  }, [])

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !restaurant) return
    setGalleryUploading(true)
    try {
      const base64 = await compressImage(file)
      const updated = { ...restaurant, images: [...(restaurant.images ?? []), base64] }
      saveRestaurant(updated)
      setRestaurant(updated)
    } catch {
      console.error('Error uploading gallery image')
    }
    setGalleryUploading(false)
    // Reset file input
    e.target.value = ''
  }

  function removeGalleryImage(idx: number) {
    if (!restaurant) return
    const images = [...(restaurant.images ?? [])]
    images.splice(idx, 1)
    const updated = { ...restaurant, images }
    saveRestaurant(updated)
    setRestaurant(updated)
  }

  function changeStatus(id: string, status: ReservationStatus) {
    updateReservationStatus(id, status)
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-accent" />
          <p className="text-sm text-foreground-subtle">Cargando datos...</p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayRes = reservations.filter((r) => r.date === today)
  const upcomingRes = reservations
    .filter((r) => r.date >= today && r.status !== 'cancelled')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8)

  const totalToday = todayRes.length
  const confirmedToday = todayRes.filter((r) => r.status === 'confirmed').length
  const pendingCount = reservations.filter((r) => r.status === 'pending').length
  const occupancyPct = restaurant ? Math.round((confirmedToday / (restaurant.capacity / 4)) * 100) : 0

  const stats = [
    { label: 'Reservas hoy', value: totalToday, sub: `${confirmedToday} confirmadas`, color: 'text-accent' },
    { label: 'Pendientes', value: pendingCount, sub: 'Requieren atencion', color: 'text-yellow-400' },
    { label: 'Ocupacion est.', value: `${Math.min(occupancyPct, 100)}%`, sub: `Capacidad: ${restaurant?.capacity ?? 0}`, color: 'text-success' },
    { label: 'Rating', value: restaurant?.rating ?? 0, sub: `${restaurant?.reviewCount ?? 0} resenas`, color: 'text-accent-soft' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {restaurant?.name ?? 'Mi Restaurante'}
            </h1>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="pill-accent text-xs">
                {restaurant?.plan?.toUpperCase() ?? 'FREE'}
              </span>
              <span
                className={clsx(
                  'pill text-xs',
                  restaurant?.isActive
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-red-400/10 text-red-400 border border-red-400/20'
                )}
              >
                {restaurant?.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-foreground-subtle">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className={clsx('stat-value', s.color)}>{s.value}</p>
            <p className="mt-1 text-xs text-foreground-subtle">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Upcoming reservations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Proximas reservas</h2>
          <span className="text-xs text-foreground-subtle">
            {upcomingRes.length} reserva{upcomingRes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {upcomingRes.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <svg className="h-6 w-6 text-foreground-subtle" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-subtle">No hay reservas proximas</p>
            <p className="mt-1 text-xs text-foreground-subtle/60">Las nuevas reservas apareceran aqui</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-background-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Cliente
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Fecha / Hora
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Mesa
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Pax
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Estado
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRes.map((res, i) => (
                    <tr
                      key={res.id}
                      className={clsx(
                        'transition-colors hover:bg-white/[0.02]',
                        i !== upcomingRes.length - 1 && 'border-b border-white/[0.06]'
                      )}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{res.userName}</p>
                        {res.specialRequests && (
                          <p className="mt-0.5 max-w-[200px] truncate text-xs text-foreground-subtle">
                            {res.specialRequests}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-foreground">{res.date}</p>
                        <p className="text-xs text-foreground-subtle">{res.time}</p>
                      </td>
                      <td className="px-5 py-4 text-foreground-subtle">{res.tableName}</td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground">{res.partySize}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={clsx(
                            'badge-' + res.status
                          )}
                        >
                          {STATUS_LABEL[res.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {res.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => changeStatus(res.id, 'confirmed')}
                              className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => changeStatus(res.id, 'cancelled')}
                              className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/20"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {res.status === 'confirmed' && (
                          <button
                            onClick={() => changeStatus(res.id, 'no_show')}
                            className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs font-medium text-foreground-subtle transition-colors hover:bg-white/[0.08] hover:text-foreground"
                          >
                            No-show
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Gallery management */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Galería del restaurante</h2>
          <label className="btn-primary cursor-pointer text-xs py-1.5 px-4">
            {galleryUploading ? 'Subiendo…' : '+ Añadir foto'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleGalleryUpload}
              className="sr-only"
              disabled={galleryUploading}
            />
          </label>
        </div>
        {(!restaurant?.images || restaurant.images.length === 0) ? (
          <div className="card py-12 text-center">
            <p className="text-3xl mb-2">📸</p>
            <p className="text-sm text-foreground-subtle">No hay fotos. Sube fotos de tu local para atraer comensales.</p>
            <p className="text-xs text-foreground-subtle/50 mt-1">Usa la cámara del móvil o sube desde galería</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {restaurant.images.map((img, i) => (
              <div key={i} className="group relative">
                <img src={img} alt={`Foto ${i + 1}`} className="h-32 w-full rounded-xl object-cover" />
                <button
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent reviews */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Reseñas recientes</h2>
          <span className="text-xs text-foreground-subtle">{recentReviews.length} última(s)</span>
        </div>
        {recentReviews.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-sm text-foreground-subtle">Aún no hay reseñas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((rev) => (
              <div key={rev.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{rev.userName}</p>
                  <span className="text-sm">
                    <span className="text-accent">{'★'.repeat(rev.rating)}</span>
                    <span className="text-white/20">{'★'.repeat(5 - rev.rating)}</span>
                  </span>
                </div>
                <p className="text-xs text-foreground-subtle line-clamp-2">{rev.comment}</p>
                <p className="mt-2 text-[10px] text-foreground-subtle/50">
                  {new Date(rev.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
