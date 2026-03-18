'use client'

import { useState } from 'react'
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
  onRequestBill?: () => void
  billRequested?: boolean
  sessionClosed?: boolean
}

export default function OrderStatusView({
  orders,
  onOrderMore,
  onRequestBill,
  billRequested = false,
  sessionClosed = false,
}: OrderStatusProps) {
  const [confirmingBill, setConfirmingBill] = useState(false)

  if (orders.length === 0) return null

  // Calculate total from non-cancelled orders
  const total = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0)

  const allPaid = orders.every((o) => o.status === 'paid' || o.status === 'cancelled')

  // Session closed — thank you view
  if (sessionClosed || allPaid) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bill-confirmed mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">¡Gracias por tu visita!</h2>
        <p className="mt-2 text-sm text-foreground-subtle">
          Esperamos verte pronto de nuevo
        </p>
        <div className="mt-4 rounded-xl bg-white/[0.04] px-6 py-3 border border-border-subtle">
          <p className="text-xs text-foreground-subtle">Total</p>
          <p className="text-2xl font-bold text-accent">{total.toFixed(2)} €</p>
        </div>
      </div>
    )
  }

  // Bill requested — waiting view
  if (billRequested) {
    return (
      <div className="space-y-4">
        {/* Bill requested banner */}
        <div className="bill-confirmed rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 animate-pulse">
              <span className="text-3xl">🧾</span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-foreground">Tu cuenta está en camino</h2>
          <p className="mt-1.5 text-sm text-foreground-subtle">
            El camarero vendrá con el datáfono
          </p>
          <div className="mt-4 inline-block rounded-xl bg-background px-6 py-3 border border-border-subtle">
            <p className="text-xs text-foreground-subtle">Total a pagar</p>
            <p className="text-3xl font-bold text-accent">{total.toFixed(2)} €</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Resumen del pedido</h3>
          <div className="space-y-1.5">
            {orders
              .filter((o) => o.status !== 'cancelled')
              .flatMap((o) => o.items)
              .map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-foreground-subtle">
                    <span className="font-medium text-foreground">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="text-foreground-subtle">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
          </div>
          <div className="mt-3 border-t border-border-subtle pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold text-accent">{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Total summary card */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground-subtle">Total actual</p>
          <p className="text-2xl font-bold text-accent">{total.toFixed(2)} €</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-subtle">Pedidos</p>
          <p className="text-lg font-bold text-foreground">{orders.length}</p>
        </div>
      </div>

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

      {/* Action buttons */}
      <div className="space-y-3">
        <button onClick={onOrderMore} className="btn-secondary w-full">
          Pedir más
        </button>

        {onRequestBill && !confirmingBill && (
          <button
            onClick={() => setConfirmingBill(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <span>🧾</span>
            <span>Pedir la cuenta · {total.toFixed(2)} €</span>
          </button>
        )}

        {confirmingBill && (
          <div className="card border-accent/30 bg-accent/5 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">¿Confirmas que quieres pedir la cuenta?</p>
            <p className="text-xs text-foreground-subtle">El camarero vendrá a cobrarte</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingBill(false)}
                className="btn-secondary flex-1 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRequestBill?.()
                  setConfirmingBill(false)
                }}
                className="btn-primary flex-1 text-xs"
              >
                Sí, pedir cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
