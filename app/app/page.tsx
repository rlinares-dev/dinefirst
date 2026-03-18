'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getRestaurants } from '@/lib/data'
import type { Restaurant } from '@/types/database'

const CUISINE_TYPES = ['Todas', 'Española Contemporánea', 'Catalana Tradicional', 'Japonesa Fusión', 'Italiana', 'Mediterránea']
const CITIES = ['Todas', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla']

const CUISINE_CATEGORIES = [
  { label: 'Española', emoji: '🥘', filter: 'Española Contemporánea' },
  { label: 'Catalana', emoji: '🍳', filter: 'Catalana Tradicional' },
  { label: 'Japonesa', emoji: '🍱', filter: 'Japonesa Fusión' },
  { label: 'Italiana', emoji: '🍕', filter: 'Italiana' },
  { label: 'Mediterránea', emoji: '🌊', filter: 'Mediterránea' },
]

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className="text-sm tracking-wide text-accent">
      {'★'.repeat(full)}
      <span className="text-foreground-subtle/30">{'★'.repeat(empty)}</span>
    </span>
  )
}

function getCuisineEmoji(cuisineType: string): string {
  if (cuisineType.includes('Española')) return '🥘'
  if (cuisineType.includes('Catalana')) return '🍳'
  if (cuisineType.includes('Japonesa')) return '🍱'
  if (cuisineType.includes('Italiana')) return '🍕'
  if (cuisineType.includes('Mediterránea')) return '🌊'
  return '🍽️'
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

export default function AppHomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('Todas')
  const [cuisineFilter, setCuisineFilter] = useState('Todas')
  const [capacityFilter, setCapacityFilter] = useState('')

  useEffect(() => {
    setRestaurants(getRestaurants())
  }, [])

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(search.toLowerCase())
    const matchCity = cityFilter === 'Todas' || r.city === cityFilter.toLowerCase()
    const matchCuisine = cuisineFilter === 'Todas' || r.cuisineType === cuisineFilter
    const matchCap = !capacityFilter || r.capacity >= Number(capacityFilter)
    return matchSearch && matchCity && matchCuisine && matchCap && r.isActive
  })

  const clearFilters = () => {
    setSearch('')
    setCityFilter('Todas')
    setCuisineFilter('Todas')
    setCapacityFilter('')
  }

  const hasActiveFilters = search || cityFilter !== 'Todas' || cuisineFilter !== 'Todas' || capacityFilter

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">

      {/* ── Header bar ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="text-lg font-bold tracking-tight text-foreground">
            <span className="text-accent">Dine</span>First
          </span>
          <nav className="flex items-center gap-1">
            <a href="/app/reservas" className="btn-ghost text-xs link-underline">
              Mis reservas
            </a>
            <a href="/app/perfil" className="btn-ghost text-xs link-underline">
              Mi perfil
            </a>
          </nav>
        </div>
      </motion.header>

      {/* ── Hero search section ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border-b border-white/[0.06] bg-background-soft px-5 pb-8 pt-10"
      >
        <div className="mx-auto max-w-6xl">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Descubre restaurantes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-8 text-sm text-foreground-subtle"
          >
            Reserva en tiempo real, sin esperas, con confirmación inmediata.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground-subtle/40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cocina, dirección…"
                className="input w-full py-3.5 pl-11 pr-4 text-sm focus-ring-animated"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary shrink-0 px-8"
            >
              Buscar
            </motion.button>
          </motion.div>

          {/* Quick cuisine categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          >
            {CUISINE_CATEGORIES.map((cat) => (
              <motion.button
                key={cat.filter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCuisineFilter(cuisineFilter === cat.filter ? 'Todas' : cat.filter)}
                className={clsx(
                  'shrink-0 cursor-pointer whitespace-nowrap transition-all duration-200',
                  cuisineFilter === cat.filter ? 'pill-active' : 'pill hover:border-white/[0.2]'
                )}
              >
                <span className="text-sm">{cat.emoji}</span>
                {cat.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Filter dropdowns + city pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {CITIES.map((c) => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCityFilter(c)}
                  className={clsx(
                    'shrink-0 cursor-pointer whitespace-nowrap transition-all duration-200',
                    cityFilter === c ? 'pill-active' : 'pill hover:border-white/[0.2]'
                  )}
                >
                  {c === 'Todas' ? 'Todas las ciudades' : c}
                </motion.button>
              ))}
            </div>

            <div className="hidden h-5 w-px bg-white/[0.08] sm:block" />

            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="input cursor-pointer text-xs"
            >
              <option value="">Cualquier tamaño</option>
              <option value="2">Mínimo 2 pax</option>
              <option value="4">Mínimo 4 pax</option>
              <option value="6">Mínimo 6 pax</option>
            </select>

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearFilters}
                  className="pill cursor-pointer text-accent transition-colors hover:border-accent/30"
                >
                  ✕ Limpiar
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Results ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-foreground-subtle">
            <span className="font-bold text-foreground">{filtered.length}</span>{' '}
            restaurante{filtered.length !== 1 ? 's' : ''}{' '}
            {hasActiveFilters ? 'encontrados' : 'disponibles'}
          </p>
        </motion.div>

        {/* Empty state */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card mx-auto max-w-md py-20 text-center"
            >
              <motion.p
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-4 text-6xl"
              >
                🍽️
              </motion.p>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                No se encontraron restaurantes
              </h2>
              <p className="mb-6 text-sm text-foreground-subtle">
                Prueba con otros filtros o cambia tu búsqueda.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearFilters}
                className="btn-primary px-8 text-sm"
              >
                Limpiar filtros
              </motion.button>
            </motion.div>
          ) : (
            /* Restaurant grid */
            <motion.div
              key="grid"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((r, i) => (
                <motion.a
                  key={r.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  href={`/restaurantes/${r.city}/${r.slug}`}
                  className="card card-shine group flex flex-col overflow-hidden p-0"
                >
                  {/* Image / emoji placeholder */}
                  <div className="relative h-40 w-full overflow-hidden bg-background-soft">
                    {r.images && r.images.length > 0 ? (
                      <img
                        src={r.images[0]}
                        alt={r.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <motion.span
                          className="text-6xl"
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                        >
                          {getCuisineEmoji(r.cuisineType)}
                        </motion.span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-tight text-foreground">
                        {r.name}
                      </h3>
                      <span className="pill shrink-0 text-[10px]">
                        {r.cuisineType.split(' ')[0]}
                      </span>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-xs font-semibold text-foreground">{r.rating}</span>
                      <span className="text-xs text-foreground-subtle">({r.reviewCount})</span>
                    </div>

                    <div className="mb-4 flex flex-col gap-1.5 text-xs text-foreground-subtle">
                      <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-foreground-subtle/50">
                          <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.291 5.597a15.591 15.591 0 0 0 2.236 2.235l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
                        </svg>
                        {r.address}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-foreground-subtle/50">
                          <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                        </svg>
                        {r.openingHours}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-foreground-subtle/50">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                        </svg>
                        {r.capacity} personas
                      </span>
                    </div>

                    <div className="mt-auto">
                      <span className="btn-primary inline-flex w-full justify-center py-2 text-xs group-hover:shadow-glow-sm transition-shadow duration-300">
                        Reservar mesa →
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
