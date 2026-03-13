'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getTablesForRestaurant, saveTable, deleteTable, generateId } from '@/lib/data'
import type { Table } from '@/types/database'

const LOCATIONS = ['Interior', 'Terraza', 'Privado', 'Barra', 'Jardín', 'Primer piso']
const CAPACITIES = [1, 2, 3, 4, 5, 6, 8, 10, 12]

const RESTAURANT_ID = 'rest-1'

type FormState = { name: string; capacity: number; location: string; isActive: boolean }

const EMPTY_FORM: FormState = { name: '', capacity: 4, location: 'Interior', isActive: true }

export default function DashboardTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setTables(getTablesForRestaurant(RESTAURANT_ID))
  }, [])

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(t: Table) {
    setEditingId(t.id)
    setForm({ name: t.name, capacity: t.capacity, location: t.location, isActive: t.isActive })
    setShowForm(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    const table: Table = {
      id: editingId ?? generateId(),
      restaurantId: RESTAURANT_ID,
      name: form.name.trim(),
      capacity: form.capacity,
      location: form.location,
      isActive: form.isActive,
    }
    saveTable(table)
    setTables(getTablesForRestaurant(RESTAURANT_ID))
    setShowForm(false)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteTable(id)
    setTables(getTablesForRestaurant(RESTAURANT_ID))
    setDeleteConfirm(null)
  }

  function toggleActive(t: Table) {
    saveTable({ ...t, isActive: !t.isActive })
    setTables(getTablesForRestaurant(RESTAURANT_ID))
  }

  const active = tables.filter((t) => t.isActive)
  const inactive = tables.filter((t) => !t.isActive)
  const totalCapacity = active.reduce((s, t) => s + t.capacity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mesas</h1>
          <p className="mt-1 text-sm">
            {active.length} activas · {totalCapacity} pax totales
          </p>
        </div>
        <button onClick={openNew} className="btn-primary shrink-0">
          + Nueva mesa
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total mesas', value: tables.length },
          { label: 'Mesas activas', value: active.length },
          { label: 'Capacidad total', value: totalCapacity + ' pax' },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-xs text-foreground-subtle">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-accent">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card border-accent/30">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {editingId ? 'Editar mesa' : 'Nueva mesa'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mesa 1, Terraza A…"
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Capacidad (personas)
              </label>
              <select
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {CAPACITIES.map((c) => (
                  <option key={c} value={c}>{c} persona{c !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Ubicación
              </label>
              <select
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="sr-only"
                />
                <div className={clsx('h-5 w-10 rounded-full transition-colors', form.isActive ? 'bg-accent' : 'bg-border-strong')} />
                <div className={clsx('absolute h-4 w-4 rounded-full bg-white shadow transition-transform', form.isActive ? 'translate-x-5' : 'translate-x-1')} />
              </label>
              <span className="text-sm text-foreground-subtle">Mesa activa</span>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleSave} className="btn-primary">
              {editingId ? 'Guardar cambios' : 'Añadir mesa'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tables grid */}
      {tables.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl mb-3">⊞</p>
          <p className="text-foreground font-medium">No hay mesas configuradas</p>
          <p className="text-sm text-foreground-subtle mt-1">Añade la primera mesa para empezar.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className={clsx('card flex flex-col gap-3', !t.isActive && 'opacity-50')}
            >
              {/* Confirm delete overlay */}
              {deleteConfirm === t.id && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 p-4 text-center">
                  <p className="mb-3 text-sm font-medium text-foreground">¿Eliminar esta mesa?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(t.id)} className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                      Eliminar
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary py-1.5 text-xs">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-foreground-subtle mt-0.5">{t.location}</p>
                  </div>
                  <span className={clsx('rounded-full border px-2 py-0.5 text-xs', t.isActive ? 'text-success bg-success/10 border-success/20' : 'text-foreground-subtle border-border-subtle')}>
                    {t.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
                    {t.capacity}
                  </div>
                  <span className="text-xs text-foreground-subtle">persona{t.capacity !== 1 ? 's' : ''}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="flex-1 rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:border-accent hover:text-accent transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(t)}
                    className="flex-1 rounded-md border border-border-subtle py-1.5 text-xs text-foreground-subtle hover:text-foreground transition"
                  >
                    {t.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(t.id)}
                    className="rounded-md border border-border-subtle px-2 py-1.5 text-xs text-red-400/50 hover:border-red-400/30 hover:text-red-400 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
