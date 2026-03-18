'use client'

import { useEffect, useState } from 'react'
import { getUser, getRestaurantsForOwner, saveRestaurant } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import { sbGetRestaurantsForOwner, sbSaveRestaurant } from '@/lib/supabase-data'
import { useAuth } from '@/components/providers/auth-provider'
import type { Restaurant } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface FormState {
  name: string
  description: string
  cuisineType: string
  address: string
  city: string
  phone: string
  openingHours: string
  capacity: number
}

const EMPTY_FORM: FormState = {
  name: '', description: '', cuisineType: '', address: '', city: '', phone: '', openingHours: '', capacity: 0,
}

export default function PerfilPage() {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [initial, setInitial] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { success } = useToast()

  useEffect(() => {
    if (!user) return
    async function load() {
      let rest: Restaurant | null = null
      if (isSupabaseConfigured()) {
        const restaurants = await sbGetRestaurantsForOwner(user!.id)
        rest = restaurants[0] ?? null
      } else {
        const restaurants = getRestaurantsForOwner(user!.id)
        rest = restaurants[0] ?? null
      }
      if (rest) {
        setRestaurant(rest)
        const state: FormState = {
          name: rest.name,
          description: rest.description,
          cuisineType: rest.cuisineType,
          address: rest.address,
          city: rest.city,
          phone: rest.phone,
          openingHours: rest.openingHours,
          capacity: rest.capacity,
        }
        setForm(state)
        setInitial(state)
      }
    }
    load()
  }, [user])

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  function handleChange(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!restaurant || !dirty) return
    setSaving(true)
    const updated: Restaurant = {
      ...restaurant,
      name: form.name.trim(),
      description: form.description.trim(),
      cuisineType: form.cuisineType.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      openingHours: form.openingHours.trim(),
      capacity: form.capacity,
    }
    if (isSupabaseConfigured()) {
      await sbSaveRestaurant(updated)
    } else {
      saveRestaurant(updated)
    }
    setRestaurant(updated)
    setInitial({ ...form })
    setSaving(false)
    success('Perfil actualizado correctamente')
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-foreground-subtle">Cargando perfil...</p>
      </div>
    )
  }

  const fields: { key: keyof FormState; label: string; type: string; full?: boolean; rows?: number }[] = [
    { key: 'name', label: 'Nombre del restaurante', type: 'text' },
    { key: 'cuisineType', label: 'Tipo de cocina', type: 'text' },
    { key: 'city', label: 'Ciudad', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'tel' },
    { key: 'capacity', label: 'Capacidad (personas)', type: 'number' },
    { key: 'openingHours', label: 'Horario', type: 'text' },
    { key: 'address', label: 'Dirección completa', type: 'text', full: true },
    { key: 'description', label: 'Descripción', type: 'textarea', full: true, rows: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Perfil del restaurante</h1>
          <p className="mt-1 text-sm text-foreground-subtle">Edita la información de tu establecimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs ${restaurant.plan === 'premium' ? 'text-accent bg-accent/10 border-accent/20' : restaurant.plan === 'pro' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-foreground-subtle bg-foreground-subtle/10 border-border-subtle'}`}>
            Plan {restaurant.plan}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h2 className="mb-6 text-base font-semibold text-foreground">Información del restaurante</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
              <label className="mb-1.5 block text-xs font-medium text-foreground-subtle">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key] as string}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  rows={f.rows ?? 3}
                  className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              ) : (
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
          <p className="text-xs text-foreground-subtle">
            La galería de fotos se gestiona desde el{' '}
            <a href="/dashboard" className="text-accent hover:underline">Resumen</a>
          </p>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-foreground">Información adicional</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-foreground-subtle">Rating</p>
            <p className="text-lg font-bold text-accent">{restaurant.rating} <span className="text-xs text-foreground-subtle">/ 5</span></p>
          </div>
          <div>
            <p className="text-xs text-foreground-subtle">Reseñas</p>
            <p className="text-lg font-bold text-foreground">{restaurant.reviewCount}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-subtle">Slug URL</p>
            <p className="text-sm font-mono text-foreground-subtle">/restaurantes/{restaurant.city}/{restaurant.slug}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
