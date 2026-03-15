'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getTablesForRestaurant, saveTable, deleteTable, generateId } from '@/lib/data'
import type { Table, TableStatus } from '@/types/database'

const LOCATIONS = ['Interior', 'Terraza', 'Privado', 'Barra', 'Jardín', 'Primer piso']
const CAPACITIES = [1, 2, 3, 4, 5, 6, 8, 10, 12]

const RESTAURANT_ID = 'rest-1'

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  en_route: 'En camino',
  reserved: 'Reservada',
  inactive: 'Inactiva',
}

const STATUS_COLORS: Record<TableStatus, string> = {
  free: 'text-foreground-subtle border-border-subtle',
  occupied: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  en_route: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  reserved: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  inactive: 'text-foreground-subtle/50 border-border-subtle',
}

type FormState = { name: string; capacity: number; location: string; status: TableStatus }

const EMPTY_FORM: FormState = { name: '', capacity: 4, location: 'Interior', status: 'free' }

export default function DashboardTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [qrModal, setQrModal] = useState<Table | null>(null)

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
    setForm({ name: t.name, capacity: t.capacity, location: t.location, status: t.status })
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
      status: form.status,
      qrCode: editingId
        ? (tables.find((t) => t.id === editingId)?.qrCode ?? `df-rest1-${generateId()}`)
        : `df-rest1-${generateId()}`,
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
    saveTable({ ...t, status: t.status === 'inactive' ? 'free' : 'inactive' })
    setTables(getTablesForRestaurant(RESTAURANT_ID))
  }

  const active = tables.filter((t) => t.status !== 'inactive')
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
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total mesas', value: tables.length },
          { label: 'Libres', value: tables.filter((t) => t.status === 'free').length },
          { label: 'Ocupadas', value: tables.filter((t) => t.status === 'occupied').length },
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
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TableStatus }))}
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {(Object.keys(STATUS_LABELS) as TableStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
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
              className={clsx('card flex flex-col gap-3', t.status === 'inactive' && 'opacity-50')}
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
                  <span className={clsx('rounded-full border px-2 py-0.5 text-xs', STATUS_COLORS[t.status])}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
                    {t.capacity}
                  </div>
                  <span className="text-xs text-foreground-subtle">persona{t.capacity !== 1 ? 's' : ''}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-foreground-subtle/50 font-mono">QR: {t.qrCode}</span>
                  <button
                    onClick={() => setQrModal(t)}
                    className="text-[10px] text-accent hover:text-accent-strong transition"
                  >
                    Ver QR
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
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
                    {t.status === 'inactive' ? 'Activar' : 'Desactivar'}
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

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setQrModal(null)}>
          <div className="w-full max-w-sm rounded-xl bg-background-elevated border border-border-subtle p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-1">{qrModal.name}</h3>
            <p className="text-xs text-foreground-subtle mb-4">{qrModal.location} · {qrModal.capacity} personas</p>

            <div className="rounded-lg bg-white p-6 mb-4">
              <div className="mx-auto flex h-32 w-32 items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Código QR</p>
                  <p className="text-sm font-mono font-bold text-gray-900">{qrModal.qrCode}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-foreground-subtle mb-1">URL del cliente:</p>
            <p className="text-xs font-mono text-accent break-all mb-4">
              {typeof window !== 'undefined' ? window.location.origin : ''}/mesa/{qrModal.qrCode}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/mesa/${qrModal.qrCode}`
                  navigator.clipboard.writeText(url)
                }}
                className="btn-primary flex-1 text-xs"
              >
                Copiar URL
              </button>
              <a
                href={`/dashboard/mesas/qr/${qrModal.id}`}
                className="btn-secondary flex-1 text-xs text-center"
              >
                Imprimir
              </a>
              <button onClick={() => setQrModal(null)} className="btn-secondary flex-1 text-xs">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
