'use client'

import { useState } from 'react'
import clsx from 'clsx'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    description: 'Para restaurantes que empiezan',
    features: ['Hasta 20 mesas', 'Reservas ilimitadas', 'Perfil público SEO', 'Email confirmación', 'Soporte email'],
    color: 'border-border-strong',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'El más popular para negocios activos',
    features: ['Mesas ilimitadas', 'Reservas ilimitadas', 'Perfil público SEO', 'WhatsApp + Email', 'Analíticas básicas', 'Soporte prioritario'],
    color: 'border-accent/40',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    description: 'Para cadenas y grupos',
    features: ['Multi-restaurante', 'Mesas ilimitadas', 'Analíticas avanzadas + IA', 'WhatsApp + Email + SMS', 'API completa', 'Account manager'],
    color: 'border-accent-soft/30',
  },
]

const INVOICES = [
  { id: 'INV-2026-003', date: '2026-03-01', amount: 99, status: 'paid', plan: 'Pro' },
  { id: 'INV-2026-002', date: '2026-02-01', amount: 99, status: 'paid', plan: 'Pro' },
  { id: 'INV-2026-001', date: '2026-01-01', amount: 49, status: 'paid', plan: 'Basic' },
]

export default function DashboardBillingPage() {
  const [currentPlan, setCurrentPlan] = useState('pro')
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  async function handleUpgrade(planId: string) {
    setUpgrading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setCurrentPlan(planId)
    setUpgrading(false)
    setUpgraded(true)
    setUpgradeModal(null)
    setTimeout(() => setUpgraded(false), 3000)
  }

  const current = PLANS.find((p) => p.id === currentPlan)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Facturación</h1>
        <p className="mt-1 text-sm">Gestiona tu plan, método de pago y facturas</p>
      </div>

      {upgraded && (
        <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          ✅ Plan actualizado correctamente. Los cambios son efectivos de inmediato.
        </div>
      )}

      {/* Current plan */}
      <div className="card border-accent/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-foreground-subtle">Plan actual</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-bold text-accent">{current?.name}</span>
              <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Activo
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground-subtle">{current?.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{current?.price}€</p>
            <p className="text-xs text-foreground-subtle">/mes · IVA incl.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {current?.features.map((f) => (
            <span key={f} className="rounded-full border border-border-subtle px-2.5 py-1 text-xs text-foreground-subtle">
              ✓ {f}
            </span>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button className="btn-secondary text-xs py-2">Gestionar método de pago</button>
          <button className="rounded-md border border-red-500/20 px-4 py-2 text-xs text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition">
            Cancelar plan
          </button>
        </div>
      </div>

      {/* Plan selector */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Cambiar de plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            return (
              <div
                key={plan.id}
                className={clsx('card relative flex flex-col', plan.color, isCurrent && 'ring-1 ring-accent/30')}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-background">
                    Más popular
                  </span>
                )}
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">{plan.name}</p>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}€</span>
                    <span className="mb-0.5 text-xs text-foreground-subtle">/mes</span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-subtle">{plan.description}</p>
                </div>
                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-foreground">
                      <span className="text-success text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrent && setUpgradeModal(plan.id)}
                  disabled={isCurrent}
                  className={clsx(
                    'w-full rounded-md py-2 text-xs font-medium transition',
                    isCurrent
                      ? 'bg-accent/20 text-accent cursor-default'
                      : 'border border-border-subtle text-foreground-subtle hover:border-accent hover:text-accent',
                  )}
                >
                  {isCurrent ? '✓ Plan actual' : `Cambiar a ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Historial de facturas</h2>
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-background-soft">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">Factura</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">Importe</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-foreground-subtle">PDF</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <tr key={inv.id} className={clsx('border-b border-border-subtle/50 hover:bg-background-soft/50 transition', i === INVOICES.length - 1 && 'border-b-0')}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-subtle">{inv.id}</td>
                  <td className="px-4 py-3 text-foreground-subtle">{inv.date}</td>
                  <td className="px-4 py-3 text-foreground">{inv.plan}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{inv.amount}€</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs text-success">
                      Pagada
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-accent hover:text-accent-soft">
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-background-soft p-6 shadow-soft">
            <h3 className="text-base font-semibold text-foreground">
              Cambiar a {PLANS.find((p) => p.id === upgradeModal)?.name}
            </h3>
            <p className="mt-2 text-sm text-foreground-subtle">
              Tu nuevo plan entrará en vigor de inmediato. Se prorrateará el coste del mes actual.
            </p>
            <p className="mt-3 text-2xl font-bold text-accent">
              {PLANS.find((p) => p.id === upgradeModal)?.price}€
              <span className="text-sm font-normal text-foreground-subtle">/mes</span>
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleUpgrade(upgradeModal)}
                disabled={upgrading}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {upgrading ? 'Procesando…' : 'Confirmar cambio'}
              </button>
              <button
                onClick={() => setUpgradeModal(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
