'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getReviewsForRestaurant, getRestaurantById, respondToReview } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import { sbGetReviewsForRestaurant } from '@/lib/supabase-data'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import type { Review, Restaurant } from '@/types/database'
import { useToast } from '@/components/ui/toast'

type Filter = 'all' | 'responded' | 'not_responded'
type Sort = 'date' | 'rating'

export default function ResenasPage() {
  const { restaurant, restaurantId } = useRestaurant()
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sortBy, setSortBy] = useState<Sort>('date')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const { success } = useToast()

  useEffect(() => {
    if (!restaurantId) return
    async function loadReviews() {
      if (isSupabaseConfigured()) {
        setReviews(await sbGetReviewsForRestaurant(restaurantId))
      } else {
        setReviews(getReviewsForRestaurant(restaurantId))
      }
    }
    loadReviews()
  }, [restaurantId])

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    respondToReview(reviewId, replyText.trim())
    if (isSupabaseConfigured()) {
      setReviews(await sbGetReviewsForRestaurant(restaurantId))
    } else {
      setReviews(getReviewsForRestaurant(restaurantId))
    }
    setReplyingTo(null)
    setReplyText('')
    success('Respuesta guardada correctamente')
  }

  // Stats
  const avgRating = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const respondedCount = reviews.filter((r) => r.response).length
  const responseRate = reviews.length === 0 ? 0 : Math.round((respondedCount / reviews.length) * 100)
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const maxDist = Math.max(...ratingDist.map((d) => d.count), 1)

  // Filter & sort
  let filtered = [...reviews]
  if (filter === 'responded') filtered = filtered.filter((r) => r.response)
  if (filter === 'not_responded') filtered = filtered.filter((r) => !r.response)
  if (sortBy === 'date') filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating)

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: reviews.length },
    { key: 'responded', label: 'Respondidas', count: respondedCount },
    { key: 'not_responded', label: 'Sin responder', count: reviews.length - respondedCount },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reseñas</h1>
        <p className="mt-1 text-sm text-foreground-subtle">Gestiona y responde a las reseñas de tus clientes</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-foreground-subtle">Rating medio</p>
          <p className="mt-1 text-3xl font-bold text-accent">{avgRating.toFixed(1)}</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-foreground-subtle">Total reseñas</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{reviews.length}</p>
          <p className="mt-1 text-xs text-foreground-subtle">{restaurant?.name ?? ''}</p>
        </div>
        <div className="card">
          <p className="text-xs text-foreground-subtle">Tasa de respuesta</p>
          <p className="mt-1 text-3xl font-bold text-success">{responseRate}%</p>
          <p className="mt-1 text-xs text-foreground-subtle">{respondedCount} de {reviews.length} respondidas</p>
        </div>
        <div className="card">
          <p className="text-xs text-foreground-subtle">Distribución</p>
          <div className="mt-2 space-y-1">
            {ratingDist.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="w-4 text-xs text-foreground-subtle">{d.star}★</span>
                <div className="flex-1 h-1.5 rounded-full bg-border-subtle">
                  <div
                    className="h-1.5 rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(d.count / maxDist) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-xs text-foreground-subtle text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'rounded px-3 py-1 text-xs font-medium transition',
                filter === f.key ? 'bg-accent text-background' : 'text-foreground-subtle hover:text-foreground',
              )}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
          <button
            onClick={() => setSortBy('date')}
            className={clsx('rounded px-3 py-1 text-xs font-medium transition', sortBy === 'date' ? 'bg-accent text-background' : 'text-foreground-subtle hover:text-foreground')}
          >
            Recientes
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={clsx('rounded px-3 py-1 text-xs font-medium transition', sortBy === 'rating' ? 'bg-accent text-background' : 'text-foreground-subtle hover:text-foreground')}
          >
            Mejor valoradas
          </button>
        </div>
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-lg text-foreground-subtle">No hay reseñas con este filtro</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="card">
              {/* Review header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                    {review.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                    <p className="text-xs text-foreground-subtle">
                      {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-accent">{'★'.repeat(review.rating)}</span>
                  <span className="text-foreground-subtle/30">{'★'.repeat(5 - review.rating)}</span>
                </div>
              </div>

              {/* Comment */}
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{review.comment}</p>

              {/* Response */}
              {review.response && (
                <div className="mt-4 rounded-lg border-l-2 border-accent bg-accent/5 p-3">
                  <p className="text-xs font-semibold text-accent mb-1">Respuesta del restaurante</p>
                  <p className="text-sm text-foreground/80">{review.response}</p>
                  {review.respondedAt && (
                    <p className="mt-1 text-xs text-foreground-subtle">
                      {new Date(review.respondedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {/* Reply form */}
              {!review.response && replyingTo === review.id && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    rows={3}
                    className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle/50 focus:border-accent focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(review.id)} className="btn-primary text-sm">
                      Guardar respuesta
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText('') }}
                      className="btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Reply button */}
              {!review.response && replyingTo !== review.id && (
                <button
                  onClick={() => { setReplyingTo(review.id); setReplyText('') }}
                  className="mt-3 text-xs font-medium text-accent hover:underline"
                >
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
