'use client'

import { useState } from 'react'
import type { MenuItem } from '@/types/database'

interface CartItem {
  item: MenuItem
  quantity: number
  notes: string
}

interface CartDrawerProps {
  items: CartItem[]
  onUpdateNotes: (itemId: string, notes: string) => void
  onRemove: (itemId: string) => void
  onSubmit: (generalNotes: string) => void
  submitting?: boolean
}

export default function CartDrawer({ items, onUpdateNotes, onRemove, onSubmit, submitting }: CartDrawerProps) {
  const [expanded, setExpanded] = useState(false)
  const [generalNotes, setGeneralNotes] = useState('')

  const total = items.reduce((s, ci) => s + ci.item.price * ci.quantity, 0)
  const count = items.reduce((s, ci) => s + ci.quantity, 0)

  if (items.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      {/* Collapsed bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-center justify-between bg-accent px-4 py-3 text-background"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/20 text-xs font-bold">
            {count}
          </span>
          <span className="text-sm font-semibold">Ver pedido</span>
        </div>
        <span className="text-sm font-bold">{total.toFixed(2)} €</span>
      </div>

      {/* Expanded drawer */}
      {expanded && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-accent-strong bg-background-elevated p-4">
          <div className="space-y-3">
            {items.map((ci) => (
              <div key={ci.item.id} className="flex flex-col gap-1.5 border-b border-border-subtle pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent">{ci.quantity}x</span>
                    <span className="text-sm font-medium text-foreground">{ci.item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground-subtle">
                      {(ci.item.price * ci.quantity).toFixed(2)} €
                    </span>
                    <button
                      onClick={() => onRemove(ci.item.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={ci.notes}
                  onChange={(e) => onUpdateNotes(ci.item.id, e.target.value)}
                  placeholder="Notas (sin cebolla, poco hecho…)"
                  className="w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-foreground-subtle/40 focus:border-accent"
                />
              </div>
            ))}
          </div>

          {/* General notes */}
          <div className="mt-3">
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Notas generales del pedido…"
              className="w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-foreground-subtle/40 focus:border-accent"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => onSubmit(generalNotes)}
            disabled={submitting}
            className="btn-primary mt-4 w-full disabled:opacity-50"
          >
            {submitting ? 'Enviando…' : `Enviar pedido · ${total.toFixed(2)} €`}
          </button>
        </div>
      )}
    </div>
  )
}
