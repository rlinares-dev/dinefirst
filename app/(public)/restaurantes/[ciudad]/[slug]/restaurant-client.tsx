'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  getRestaurantBySlug,
  getTablesForRestaurant,
  getMenuForRestaurant,
  getReviewsForRestaurant,
  getUser,
  saveReservation,
  saveReview,
  recalculateRestaurantRating,
  generateId,
  generateConfirmationCode,
  getRestaurantById,
  getVerifiableReservation,
} from '@/lib/data'
import { notifyReservationCreated } from '@/lib/notifications'
import { emailReservationConfirmation } from '@/lib/email-client'
import type { Restaurant, Table, MenuItem, MenuCategory, Review, ReviewRating } from '@/types/database'

const CATEGORY_LABELS: Record<MenuCategory, string> = {
  entrantes: '🥗 Entrantes',
  principales: '🍖 Principales',
  postres: '🍮 Postres',
  bebidas: '🥂 Bebidas',
}

const TIME_SLOTS = ['13:00', '13:30', '14:00', '14:30', '15:00', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']

const CUISINE_EMOJI: Record<string, string> = {
  'Española': '🥘',
  'Catalana': '🍳',
  'Japonesa': '🍱',
}

function getCuisineEmoji(cuisineType: string): string {
  for (const [key, emoji] of Object.entries(CUISINE_EMOJI)) {
    if (cuisineType.includes(key)) return emoji
  }
  return '🍽️'
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className="text-lg leading-none tracking-wide">
      <span className="text-accent">{'\u2605'.repeat(full)}</span>
      <span className="text-white/20">{'\u2605'.repeat(empty)}</span>
    </span>
  )
}

function StarSelector({ value, onChange }: { value: ReviewRating; onChange: (v: ReviewRating) => void }) {
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as ReviewRating[]).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={clsx(
            'text-2xl transition-colors',
            star <= value ? 'text-accent' : 'text-white/20 hover:text-accent/50'
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

interface Props {
  ciudad: string
  slug: string
}

export default function RestaurantClient({ ciudad, slug }: Props) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuTab, setMenuTab] = useState<MenuCategory>('entrantes')
  const [notFound, setNotFound] = useState(false)

  // Booking form state
  const [date, setDate] = useState('')
  const [time, setTime] = useState('21:00')
  const [partySize, setPartySize] = useState(2)
  const [selectedTable, setSelectedTable] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [whatsappConsent, setWhatsappConsent] = useState(true)
  const [notificationSent, setNotificationSent] = useState(false)

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState<ReviewRating>(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    if (!ciudad || !slug) return
    const rest = getRestaurantBySlug(ciudad, slug)
    if (!rest) {
      setNotFound(true)
      return
    }
    setRestaurant(rest)
    const t = getTablesForRestaurant(rest.id).filter((t) => t.status !== 'inactive')
    setTables(t)
    if (t.length > 0) setSelectedTable(t[0].id)
    setMenuItems(getMenuForRestaurant(rest.id).filter((m) => m.isAvailable))
    setReviews(getReviewsForRestaurant(rest.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(tomorrow.toISOString().slice(0, 10))
  }, [ciudad, slug])

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant) return
    setBookingStatus('loading')

    await new Promise((r) => setTimeout(r, 800))

    const user = getUser()
    const table = tables.find((t) => t.id === selectedTable)
    const code = generateConfirmationCode()

    const reservation = {
      id: generateId(),
      userId: user?.id ?? 'guest',
      userName: user?.name ?? 'Invitado',
      userEmail: user?.email ?? 'guest@dinefirst.com',
      userPhone: user?.phone ?? '',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantCity: restaurant.city,
      tableId: selectedTable,
      tableName: table?.name ?? 'Mesa',
      date,
      time,
      partySize,
      status: 'pending' as const,
      specialRequests,
      confirmationCode: code,
      createdAt: new Date().toISOString(),
    }

    saveReservation(reservation)

    // Enviar notificaciones WhatsApp (test o producción según config)
    if (whatsappConsent) {
      try {
        const result = await notifyReservationCreated(reservation, restaurant)
        setNotificationSent(result.success)
      } catch {
        console.warn('Error enviando notificación WhatsApp')
      }
    }

    // Enviar email de confirmación (non-blocking)
    emailReservationConfirmation({
      userName: reservation.userName,
      userEmail: reservation.userEmail,
      restaurantName: restaurant.name,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize,
      confirmationCode: code,
      specialRequests: reservation.specialRequests || undefined,
    })

    setConfirmationCode(code)
    setBookingStatus('success')
  }

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    const user = getUser()
    if (!user || user.role !== 'comensal' || !restaurant) return

    // Check if this can be a verified review
    const verifiableReservationId = getVerifiableReservation(user.id, restaurant.id)

    const review: Review = {
      id: generateId(),
      restaurantId: restaurant.id,
      userId: user.id,
      userName: user.name,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
      verified: !!verifiableReservationId,
      reservationId: verifiableReservationId ?? undefined,
    }
    saveReview(review)
    recalculateRestaurantRating(restaurant.id)

    setReviews(getReviewsForRestaurant(restaurant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    const updated = getRestaurantBySlug(ciudad, slug)
    if (updated) setRestaurant(updated)

    setReviewComment('')
    setReviewRating(5)
    setShowReviewForm(false)
    setReviewSubmitted(true)
    setTimeout(() => setReviewSubmitted(false), 3000)
  }

  const currentUser = typeof window !== 'undefined' ? getUser() : null
  const canReview = currentUser?.role === 'comensal'
  const hasReviewed = reviews.some((r) => r.userId === currentUser?.id)
  const canVerify = currentUser && restaurant ? !!getVerifiableReservation(currentUser.id, restaurant.id) : false

  const availableCategories = [...new Set(menuItems.map((m) => m.category))] as MenuCategory[]
  const menuInCategory = menuItems.filter((m) => m.category === menuTab)

  /* ── 404 State ──────────────────────────────────────────────────── */
  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="text-center animate-fade-in">
          <p className="text-8xl mb-6 leading-none">🍽️</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Restaurante no encontrado</h1>
          <p className="text-sm text-foreground-subtle mb-8 max-w-xs mx-auto">
            La página que buscas no existe o fue eliminada.
          </p>
          <a href="/app" className="btn-primary">Explorar restaurantes</a>
        </div>
      </main>
    )
  }

  /* ── Loading State ──────────────────────────────────────────────── */
  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/[0.06] border-t-accent" />
          <p className="text-sm text-foreground-subtle">Cargando restaurante…</p>
        </div>
      </div>
    )
  }

  /* ── Main Layout ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background animate-fade-in">

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <section className="relative h-72 md:h-80 overflow-hidden" style={{ background: '#0a0a0a' }}>
        {/* Large cuisine emoji background */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
          <span className="text-[12rem] md:text-[16rem] opacity-[0.07] leading-none">
            {getCuisineEmoji(restaurant.cuisineType)}
          </span>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Subtle accent glow */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[28rem] h-28 rounded-full bg-accent/[0.08] blur-[80px]" />

        {/* Hero content */}
        <div className="relative h-full flex items-end">
          <div className="mx-auto w-full max-w-5xl px-6 pb-8">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                {/* City + Cuisine pills */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="pill capitalize">{restaurant.city}</span>
                  <span className="pill">{restaurant.cuisineType}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {restaurant.name}
                </h1>
                <p className="mt-2 text-sm text-foreground-subtle">{restaurant.address}</p>
              </div>

              {/* Rating */}
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Stars rating={restaurant.rating} />
                  <span className="text-lg font-bold text-foreground">{restaurant.rating}</span>
                </div>
                <p className="text-xs text-foreground-subtle mt-1">{restaurant.reviewCount} reseñas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Grid ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* ── Left Column ─────────────────────────────────────────── */}
          <div className="space-y-10">

            {/* ── About Card ────────────────────────────────────────── */}
            <section className="card">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Sobre el restaurante
              </h2>
              <p className="text-sm leading-relaxed text-foreground-subtle">
                {restaurant.description}
              </p>

              {/* Info grid */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: '📞', label: 'Teléfono', value: restaurant.phone },
                  { icon: '🕐', label: 'Horario', value: restaurant.openingHours },
                  { icon: '👥', label: 'Capacidad', value: `${restaurant.capacity} personas` },
                  { icon: '📋', label: 'Plan', value: restaurant.plan.toUpperCase(), accent: true },
                ].map(({ icon, label, value, accent }) => (
                  <div
                    key={label}
                    className="rounded-xl px-3.5 py-3"
                    style={{
                      background: '#141414',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <p className="text-xs text-foreground-subtle font-medium">
                      {icon} {label}
                    </p>
                    <p className={clsx(
                      'mt-1 text-sm font-semibold',
                      accent ? 'text-accent' : 'text-foreground'
                    )}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Menu Section ──────────────────────────────────────── */}
            {menuItems.length > 0 && (
              <section>
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Carta
                </h2>

                {/* Category pill tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMenuTab(cat)}
                      className={clsx(
                        'transition-all duration-200',
                        menuTab === cat ? 'pill-active' : 'pill hover:border-white/[0.12] hover:text-foreground'
                      )}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>

                {/* Menu items list */}
                <div className="space-y-2">
                  {menuInCategory.map((item) => (
                    <div
                      key={item.id}
                      className="card flex items-center gap-4"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-foreground-subtle leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="price shrink-0 text-sm">
                        {item.price.toFixed(2)}&euro;
                      </span>
                    </div>
                  ))}

                  {menuInCategory.length === 0 && (
                    <p className="text-sm text-foreground-subtle py-8 text-center">
                      No hay platos en esta categor&iacute;a.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* ── Gallery Section ──────────────────────────────────────── */}
            {restaurant.images && restaurant.images.length > 0 && (
              <section>
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Galería
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {restaurant.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${restaurant.name} foto ${i + 1}`}
                      className="h-40 w-56 rounded-xl object-cover shrink-0"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Reviews Section ──────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Reseñas ({reviews.length})
                </h2>
                {canReview && !hasReviewed && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn-primary text-xs py-1.5 px-4"
                  >
                    Escribir reseña
                  </button>
                )}
              </div>

              {/* Review submitted toast */}
              {reviewSubmitted && (
                <div
                  className="mb-4 rounded-xl px-4 py-3 text-sm font-medium text-success animate-fade-in"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  ✓ Tu reseña se ha publicado correctamente
                </div>
              )}

              {/* Review form */}
              {showReviewForm && canReview && (
                <form onSubmit={handleReviewSubmit} className="card mb-4 border-accent/20 animate-fade-in">
                  <p className="text-sm font-semibold text-foreground mb-3">Tu valoración</p>
                  {canVerify ? (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2">
                      <span className="text-success text-sm">✓</span>
                      <span className="text-xs text-success">Reseña verificada — tienes una reserva confirmada</span>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-foreground-subtle/10 border border-border-subtle px-3 py-2">
                      <span className="text-foreground-subtle text-sm">ℹ</span>
                      <span className="text-[11px] text-foreground-subtle">Sin reserva verificada. Tu reseña se publicará sin distintivo.</span>
                    </div>
                  )}
                  <StarSelector value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Cuéntanos tu experiencia…"
                    rows={3}
                    required
                    minLength={10}
                    className="input w-full mt-3 resize-none"
                  />
                  <div className="mt-3 flex gap-2">
                    <button type="submit" className="btn-primary text-xs py-2 px-5">
                      Publicar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="btn-secondary text-xs py-2 px-5"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="card py-12 text-center">
                  <p className="text-3xl mb-2">⭐</p>
                  <p className="text-sm text-foreground-subtle">Aún no hay reseñas. ¡Sé el primero!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="card animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: '#F97316' }}
                          >
                            {rev.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground">{rev.userName}</p>
                              {rev.verified && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 border border-success/20 px-1.5 py-0.5 text-[9px] font-semibold text-success">
                                  ✓ Verificada
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-foreground-subtle">
                              {new Date(rev.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm">
                          <span className="text-accent">{'★'.repeat(rev.rating)}</span>
                          <span className="text-white/20">{'★'.repeat(5 - rev.rating)}</span>
                        </span>
                      </div>
                      <p className="text-xs text-foreground-subtle leading-relaxed">{rev.comment}</p>
                      {rev.response && (
                        <div className="mt-3 rounded-lg bg-background-soft p-3 border-l-2 border-accent">
                          <p className="text-[10px] font-semibold text-accent mb-1">Respuesta del restaurante</p>
                          <p className="text-xs text-foreground-subtle leading-relaxed">{rev.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right Column — Booking Sidebar ──────────────────────── */}
          <div>
            <div className="sticky top-6">
              <div
                className="card"
                style={{
                  borderColor: 'rgba(249, 115, 22, 0.2)',
                  boxShadow: '0 0 40px rgba(249, 115, 22, 0.06)',
                }}
              >
                <h2 className="mb-6 text-base font-bold text-foreground">Reservar mesa</h2>

                {bookingStatus === 'success' ? (
                  /* ── Success State ──────────────────────────────────── */
                  <div className="py-4 text-center space-y-5 animate-fade-in">
                    <div className="text-5xl leading-none">🎉</div>
                    <div>
                      <p className="font-bold text-foreground text-lg">¡Reserva solicitada!</p>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        El restaurante confirmar&aacute; en breve.
                      </p>
                    </div>

                    {/* Confirmation code box */}
                    <div
                      className="rounded-xl px-4 py-4"
                      style={{
                        background: 'rgba(34, 197, 94, 0.05)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                      }}
                    >
                      <p className="text-xs text-foreground-subtle mb-1.5">C&oacute;digo de confirmaci&oacute;n</p>
                      <p className="font-mono text-2xl font-bold text-success tracking-[0.15em]">
                        {confirmationCode}
                      </p>
                    </div>

                    {notificationSent && (
                      <p className="text-xs text-success text-center">
                        📱 Notificación WhatsApp enviada
                      </p>
                    )}

                    <div className="flex flex-col gap-2.5 pt-1">
                      <a href="/app/reservas" className="btn-primary w-full text-center text-sm py-3">
                        Ver mis reservas
                      </a>
                      <button
                        onClick={() => setBookingStatus('idle')}
                        className="btn-secondary w-full text-sm"
                      >
                        Nueva reserva
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Booking Form ───────────────────────────────────── */
                  <form onSubmit={handleReserve} className="space-y-4">
                    <div>
                      <label className="field-label">Fecha</label>
                      <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="field-label">Hora</label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="input w-full"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Personas</label>
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="input w-full"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                          <option key={n} value={n}>
                            {n} persona{n !== 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {tables.length > 0 && (
                      <div>
                        <label className="field-label">Mesa</label>
                        <select
                          value={selectedTable}
                          onChange={(e) => setSelectedTable(e.target.value)}
                          className="input w-full"
                        >
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} · {t.capacity} pax · {t.location}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="field-label">Peticiones especiales</label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={2}
                        placeholder="Alergias, celebración, silla alta…"
                        className="input w-full resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={bookingStatus === 'loading'}
                      className="btn-primary w-full py-3 disabled:opacity-50"
                    >
                      {bookingStatus === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Confirmando…
                        </span>
                      ) : (
                        'Confirmar reserva'
                      )}
                    </button>

                    {/* WhatsApp consent checkbox */}
                    <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappConsent}
                        onChange={(e) => setWhatsappConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong bg-background-elevated accent-accent shrink-0"
                      />
                      <span className="text-[11px] text-foreground-subtle/70 leading-tight">
                        Acepto recibir confirmación por WhatsApp
                      </span>
                    </label>

                    <p className="text-center text-[11px] text-foreground-subtle/70 pt-1">
                      Sin pago previo · Confirmación inmediata
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
