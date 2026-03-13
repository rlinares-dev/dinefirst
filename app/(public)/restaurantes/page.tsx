'use client'

import { useEffect, useState } from 'react'
import { getRestaurants } from '@/lib/data'
import type { Restaurant } from '@/types/database'

export default function RestaurantsListPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    setRestaurants(getRestaurants())
  }, [])

  const filtered = restaurants.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisineType.toLowerCase().includes(search.toLowerCase())
    const matchCity = !city || r.city.toLowerCase().includes(city.toLowerCase())
    return matchSearch && matchCity && r.isActive
  })

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row">
        <aside className="w-full md:w-64 space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Restaurantes</h1>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground-subtle">Ciudad</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-border-subtle bg-background-soft px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
                placeholder="madrid, barcelona…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground-subtle">Tipo de cocina</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-border-subtle bg-background-soft px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
                placeholder="mediterránea, japonesa…"
              />
            </div>
          </div>
        </aside>
        <section className="flex-1 space-y-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-foreground-subtle">No hemos encontrado restaurantes con esos filtros.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {filtered.map((r) => (
                <li key={r.id} className="card space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-foreground">{r.name}</h2>
                    <span className="pill">{r.cuisineType}</span>
                  </div>
                  <p className="text-xs text-foreground-subtle">{r.address} · {r.city.toUpperCase()}</p>
                  <a href={`/restaurantes/${r.city}/${r.slug}`} className="btn-secondary mt-2 block w-full text-center text-xs">
                    Ver perfil y reservar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
