'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getMenuForRestaurant, saveMenuItem, deleteMenuItem, generateId, compressImage } from '@/lib/data'
import type { MenuItem, MenuCategory } from '@/types/database'

const RESTAURANT_ID = 'rest-1'

const CATEGORIES: { id: MenuCategory; label: string; icon: string }[] = [
  { id: 'entrantes', label: 'Entrantes', icon: '🥗' },
  { id: 'principales', label: 'Principales', icon: '🍖' },
  { id: 'postres', label: 'Postres', icon: '🍮' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥂' },
]

type FormState = { name: string; description: string; price: string; category: MenuCategory; isAvailable: boolean; imageUrl: string }
const EMPTY_FORM: FormState = { name: '', description: '', price: '', category: 'entrantes', isAvailable: true, imageUrl: '' }

export default function DashboardMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    setItems(getMenuForRestaurant(RESTAURANT_ID))
  }, [])

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id)
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, isAvailable: item.isAvailable, imageUrl: item.imageUrl ?? '' })
    setShowForm(true)
  }

  function handleSave() {
    const price = parseFloat(form.price)
    if (!form.name.trim() || isNaN(price) || price <= 0) return
    const item: MenuItem = {
      id: editingId ?? generateId(),
      restaurantId: RESTAURANT_ID,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category,
      isAvailable: form.isAvailable,
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
    }
    saveMenuItem(item)
    setItems(getMenuForRestaurant(RESTAURANT_ID))
    setShowForm(false)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteMenuItem(id)
    setItems(getMenuForRestaurant(RESTAURANT_ID))
    setDeleteConfirm(null)
  }

  function toggleAvailable(item: MenuItem) {
    saveMenuItem({ ...item, isAvailable: !item.isAvailable })
    setItems(getMenuForRestaurant(RESTAURANT_ID))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const base64 = await compressImage(file)
      setForm((f) => ({ ...f, imageUrl: base64 }))
    } catch {
      console.error('Error compressing image')
    }
    setImageUploading(false)
  }

  const countByCategory = (cat: MenuCategory) => items.filter((i) => i.category === cat).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Menú</h1>
          <p className="mt-1 text-sm">{items.length} platos · {items.filter((i) => i.isAvailable).length} disponibles</p>
        </div>
        <button onClick={openNew} className="btn-primary shrink-0">
          + Añadir plato
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={clsx('rounded-full border px-3 py-1.5 text-xs font-medium transition', activeCategory === 'all' ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle text-foreground-subtle hover:border-accent/50 hover:text-foreground')}
        >
          Todos ({items.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={clsx('rounded-full border px-3 py-1.5 text-xs font-medium transition', activeCategory === cat.id ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle text-foreground-subtle hover:border-accent/50 hover:text-foreground')}
          >
            {cat.icon} {cat.label} ({countByCategory(cat.id)})
          </button>
        ))}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar plato…"
          className="w-full max-w-xs rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground placeholder-foreground-subtle/40 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-accent/30">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {editingId ? 'Editar plato' : 'Nuevo plato'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">Nombre del plato</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Croquetas de jamón ibérico"
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción del plato, ingredientes destacados…"
                rows={2}
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">Imagen del plato</label>
              <div className="flex items-center gap-4">
                {form.imageUrl ? (
                  <div className="relative">
                    <img src={form.imageUrl} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-20 w-20 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#141414', border: '1px dashed rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-2xl text-foreground-subtle/30">📷</span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="btn-secondary cursor-pointer text-xs py-1.5 px-4 text-center inline-block">
                    {imageUploading ? 'Subiendo…' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="sr-only"
                      disabled={imageUploading}
                    />
                  </label>
                  <p className="text-[10px] text-foreground-subtle/50">Cámara o galería · Max 800px</p>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">Precio (€)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="12.50"
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-foreground-subtle">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MenuCategory }))}
                className="w-full rounded-md border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                  className="sr-only"
                />
                <div className={clsx('h-5 w-10 rounded-full transition-colors', form.isAvailable ? 'bg-accent' : 'bg-border-strong')} />
                <div className={clsx('absolute h-4 w-4 rounded-full bg-white shadow transition-transform', form.isAvailable ? 'translate-x-5' : 'translate-x-1')} />
              </label>
              <span className="text-sm text-foreground-subtle">Disponible</span>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleSave} className="btn-primary">{editingId ? 'Guardar cambios' : 'Añadir plato'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-3xl mb-3">🍽️</p>
          <p className="text-foreground font-medium">No hay platos en esta categoría</p>
          <p className="text-sm text-foreground-subtle mt-1">Añade el primero con el botón superior.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {CATEGORIES.filter((cat) => activeCategory === 'all' || activeCategory === cat.id).map((cat) => {
            const catItems = filtered.filter((i) => i.category === cat.id)
            if (catItems.length === 0) return null
            return (
              <div key={cat.id}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
                  {cat.icon} {cat.label}
                </h3>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={clsx('card flex items-center gap-4', !item.isAvailable && 'opacity-60')}
                    >
                      {deleteConfirm === item.id ? (
                        <div className="flex flex-1 items-center justify-between">
                          <p className="text-sm text-foreground">¿Eliminar &ldquo;{item.name}&rdquo;?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(item.id)} className="rounded px-3 py-1 text-xs bg-red-500 text-white hover:bg-red-600">Eliminar</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary py-1 text-xs">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{item.name}</p>
                              {!item.isAvailable && <span className="text-xs text-red-400 shrink-0">Sin stock</span>}
                            </div>
                            {item.description && (
                              <p className="mt-0.5 text-xs text-foreground-subtle truncate">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold text-accent">{item.price.toFixed(2)}€</span>
                            <button onClick={() => toggleAvailable(item)} className="text-xs border border-border-subtle rounded px-2 py-1 text-foreground-subtle hover:text-foreground transition">
                              {item.isAvailable ? 'Ocultar' : 'Activar'}
                            </button>
                            <button onClick={() => openEdit(item)} className="text-xs border border-border-subtle rounded px-2 py-1 text-foreground-subtle hover:border-accent hover:text-accent transition">
                              Editar
                            </button>
                            <button onClick={() => setDeleteConfirm(item.id)} className="text-xs text-red-400/40 hover:text-red-400 transition">✕</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
