'use client'

import clsx from 'clsx'
import type { Order, OrderStatus as OrderStatusType } from '@/types/database'

const STEPS: { status: OrderStatusType; label: string }[] = [
  { status: 'pending', label: 'Recibido' },
  { status: 'preparing', label: 'Preparando' },
  { status: 'served', label: 'Servido' },
]

function stepIndex(status: OrderStatusType): number {
  if (status === 'cancelled') return -1
  if (status === 'paid') return 3
  return STEPS.findIndex((s) => s.status === status)
}

interface OrderStatusProps {
  orders: Order[]
  onOrderMore: () => void
}

export default function OrderStatusView({ orders, onOrderMore }: OrderStatusProps) {
  if (orders.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Tus pedidos</h2>

      {orders.map((order) => {
        const currentStep = stepIndex(order.status)
        const isCancelled = order.status === 'cancelled'

        return (
          <div key={order.id} className="card">
            {/* Stepper */}
            <div className="mb-3 flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step.status} className="flex flex-1 items-center gap-1">
                  <div
                    className={clsx(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      isCancelled
                        ? 'bg-red-400/10 text-red-400'
                        : i <= currentStep
                          ? 'bg-accent text-background'
                          : 'bg-white/[0.06] text-foreground-subtle'
                    )}
                  >
                    {i <= currentStep && !isCancelled ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'h-0.5 flex-1 rounded',
                        i < currentStep ? 'bg-accent' : 'bg-white/[0.06]'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {STEPS.map((step, i) => (
                  i === currentStep && !isCancelled && (
                    <span key={step.status} className="text-sm font-medium text-accent">{step.label}</span>
                  )
                ))}
                {isCancelled && (
                  <span className="text-sm font-medium text-red-400">Cancelado</span>
                )}
                {order.status === 'paid' && (
                  <span className="text-sm font-medium text-emerald-400">Pagado</span>
                )}
              </div>
              <span className="text-[10px] text-foreground-subtle/50">
                {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground-subtle">
                    <span className="font-medium text-foreground">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="text-foreground-subtle">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="mt-2 text-[10px] text-foreground-subtle/50 italic">{order.notes}</p>
            )}
          </div>
        )
      })}

      <button onClick={onOrderMore} className="btn-primary w-full">
        Pedir más
      </button>
    </div>
  )
}
