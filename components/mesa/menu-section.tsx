'use client'

import clsx from 'clsx'
import type { MenuItem } from '@/types/database'

const CATEGORY_LABELS: Record<string, string> = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
  bebidas: 'Bebidas',
}

interface MenuSectionProps {
  category: string
  items: MenuItem[]
  cart: Record<string, number>
  onAdd: (item: MenuItem) => void
  onRemove: (item: MenuItem) => void
}

export default function MenuSection({ category, items, cart, onAdd, onRemove }: MenuSectionProps) {
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        {CATEGORY_LABELS[category] ?? category}
      </h2>
      <div className="space-y-3">
        {items.map((item) => {
          const qty = cart[item.id] ?? 0
          return (
            <div
              key={item.id}
              className={clsx(
                'card overflow-hidden p-0',
                !item.isAvailable && 'opacity-40'
              )}
            >
              {/* Image */}
              {item.imageUrl && (
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-40 w-full object-cover"
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex items-end justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-foreground-subtle line-clamp-2">{item.description}</p>
                  )}
                  <p className="mt-1.5 text-base font-bold text-accent">{item.price.toFixed(2)} €</p>
                </div>

                {item.isAvailable && (
                  <div className="flex shrink-0 items-center gap-2">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => onRemove(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-sm text-foreground-subtle hover:text-foreground transition"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-foreground">{qty}</span>
                      </>
                    )}
                    <button
                      onClick={() => onAdd(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-background hover:bg-accent-strong transition"
                    >
                      +
                    </button>
                  </div>
                )}
                {!item.isAvailable && !item.imageUrl && (
                  <span className="shrink-0 text-xs text-foreground-subtle">Agotado</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
