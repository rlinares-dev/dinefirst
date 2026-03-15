'use client'

import clsx from 'clsx'
import type { Order, OrderStatus } from '@/types/database'

const STATUS_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; color: string }>> = {
  pending: { label: 'Preparar', next: 'preparing', color: 'btn-primary' },
  preparing: { label: 'Listo', next: 'served', color: 'rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition' },
}

interface ComandaCardProps {
  order: Order
  tableName: string
  onStatusChange: (orderId: string, status: OrderStatus) => void
}

export default function ComandaCard({ order, tableName, onStatusChange }: ComandaCardProps) {
  const action = STATUS_ACTIONS[order.status]
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  const isUrgent = order.status === 'pending' && elapsed > 10

  return (
    <div className={clsx(
      'card flex flex-col gap-3',
      isUrgent && 'border-red-400/30',
      order.status === 'preparing' && 'border-blue-400/30',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">{tableName}</span>
          {isUrgent && (
            <span className="rounded-full bg-red-400/10 border border-red-400/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              URGENTE
            </span>
          )}
        </div>
        <span className={clsx(
          'text-xs font-mono',
          isUrgent ? 'text-red-400' : 'text-foreground-subtle/50'
        )}>
          {elapsed}m
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between text-sm">
            <div>
              <span className="font-bold text-accent">{item.quantity}x</span>
              <span className="ml-1.5 text-foreground">{item.name}</span>
              {item.notes && (
                <p className="text-[10px] text-amber-400 mt-0.5">⚠ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order notes */}
      {order.notes && (
        <p className="text-xs text-foreground-subtle italic border-t border-border-subtle pt-2">
          {order.notes}
        </p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={() => onStatusChange(order.id, action.next)}
          className={clsx('w-full text-sm py-2', action.color)}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
