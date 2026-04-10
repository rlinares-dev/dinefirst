'use client'

import { useState } from 'react'
import clsx from 'clsx'

// ─── PDF Invoice Generator (canvas → PDF binario, sin librerías) ─────────────

function generateInvoicePdf(invoice: { id: string; date: string; plan: string; amount: number }) {
  const W = 595 // A4 width in pts
  const H = 842 // A4 height in pts
  const scale = 2 // retina
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // Orange accent bar top
  ctx.fillStyle = '#F97316'
  ctx.fillRect(0, 0, W, 6)

  // Logo area
  ctx.fillStyle = '#F97316'
  roundRect(ctx, 48, 40, 48, 48, 10)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('DF', 72, 72)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#F9FAFB'
  ctx.font = 'bold 22px Inter, Arial, sans-serif'
  ctx.fillText('DineFirst', 110, 72)

  // FACTURA title
  ctx.fillStyle = '#F97316'
  ctx.font = 'bold 32px Inter, Arial, sans-serif'
  ctx.fillText('FACTURA', 48, 140)

  // Invoice number
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '13px Inter, Arial, sans-serif'
  ctx.fillText(invoice.id, 48, 162)

  // Divider
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(48, 180)
  ctx.lineTo(W - 48, 180)
  ctx.stroke()

  // Info grid
  const leftX = 48
  const rightX = 310
  let y = 215

  const drawField = (label: string, value: string, x: number, yPos: number) => {
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '11px Inter, Arial, sans-serif'
    ctx.fillText(label.toUpperCase(), x, yPos)
    ctx.fillStyle = '#F9FAFB'
    ctx.font = '15px Inter, Arial, sans-serif'
    ctx.fillText(value, x, yPos + 20)
  }

  drawField('Fecha de emisión', formatDate(invoice.date), leftX, y)
  drawField('Periodo', formatPeriod(invoice.date), rightX, y)

  y += 65
  drawField('Plan', invoice.plan, leftX, y)
  drawField('Estado', 'Pagada', rightX, y)

  // Amount box
  y += 90
  ctx.fillStyle = '#111827'
  roundRect(ctx, 48, y, W - 96, 100, 12)
  ctx.fill()
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 1
  roundRect(ctx, 48, y, W - 96, 100, 12)
  ctx.stroke()

  ctx.fillStyle = '#9CA3AF'
  ctx.font = '12px Inter, Arial, sans-serif'
  ctx.fillText('IMPORTE TOTAL (IVA incluido)', 72, y + 35)
  ctx.fillStyle = '#F97316'
  ctx.font = 'bold 36px Inter, Arial, sans-serif'
  ctx.fillText(`${invoice.amount},00 €`, 72, y + 75)

  // Details table
  y += 140
  ctx.fillStyle = '#9CA3AF'
  ctx.font = 'bold 11px Inter, Arial, sans-serif'
  ctx.fillText('CONCEPTO', leftX, y)
  ctx.textAlign = 'right'
  ctx.fillText('IMPORTE', W - 48, y)
  ctx.textAlign = 'left'

  ctx.strokeStyle = '#1F2937'
  ctx.beginPath()
  ctx.moveTo(48, y + 10)
  ctx.lineTo(W - 48, y + 10)
  ctx.stroke()

  y += 35
  ctx.fillStyle = '#F9FAFB'
  ctx.font = '14px Inter, Arial, sans-serif'
  ctx.fillText(`Suscripción DineFirst ${invoice.plan}`, leftX, y)
  ctx.textAlign = 'right'
  const base = (invoice.amount / 1.21).toFixed(2)
  ctx.fillText(`${base} €`, W - 48, y)
  ctx.textAlign = 'left'

  y += 28
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '13px Inter, Arial, sans-serif'
  ctx.fillText('IVA (21%)', leftX, y)
  ctx.textAlign = 'right'
  const iva = (invoice.amount - parseFloat(base)).toFixed(2)
  ctx.fillText(`${iva} €`, W - 48, y)
  ctx.textAlign = 'left'

  ctx.strokeStyle = '#374151'
  ctx.beginPath()
  ctx.moveTo(48, y + 15)
  ctx.lineTo(W - 48, y + 15)
  ctx.stroke()

  y += 38
  ctx.fillStyle = '#F9FAFB'
  ctx.font = 'bold 15px Inter, Arial, sans-serif'
  ctx.fillText('Total', leftX, y)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#F97316'
  ctx.font = 'bold 15px Inter, Arial, sans-serif'
  ctx.fillText(`${invoice.amount},00 €`, W - 48, y)
  ctx.textAlign = 'left'

  // Footer
  ctx.fillStyle = '#374151'
  ctx.beginPath()
  ctx.moveTo(48, H - 100)
  ctx.lineTo(W - 48, H - 100)
  ctx.stroke()

  ctx.fillStyle = '#6B7280'
  ctx.font = '10px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('DineFirst S.L. · CIF B-12345678 · Calle Ejemplo 42, 28001 Madrid', W / 2, H - 75)
  ctx.fillText('info@dinefirst.com · www.dinefirst.com', W / 2, H - 58)
  ctx.fillStyle = '#4B5563'
  ctx.fillText('Este documento es una factura simplificada generada automáticamente.', W / 2, H - 38)
  ctx.textAlign = 'left'

  // Convert canvas to JPEG then embed in raw PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const raw = atob(imgData.split(',')[1])
  const imgBytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) imgBytes[i] = raw.charCodeAt(i)

  const pdfBytes = buildPdf(imgBytes, W, H)
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.id}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatPeriod(d: string): string {
  const date = new Date(d)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return `${formatDate(d)} – ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getFullYear()}`
}

/** Genera un PDF válido con una imagen JPEG embebida (sin librerías). */
function buildPdf(jpegBytes: Uint8Array, pageW: number, pageH: number): Uint8Array {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let pos = 0

  function write(s: string) {
    const b = enc.encode(s)
    parts.push(b)
    pos += b.length
  }
  function writeBytes(b: Uint8Array) {
    parts.push(b)
    pos += b.length
  }
  function markObj() { offsets.push(pos) }

  // Header
  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')

  // Obj 1: Catalog
  markObj()
  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  // Obj 2: Pages
  markObj()
  write(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`)

  // Obj 3: Page
  markObj()
  write(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`)

  // Obj 4: Page contents (draw image full page)
  const stream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Img Do\nQ\n`
  markObj()
  write(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`)

  // Obj 5: Image XObject
  markObj()
  write(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageW * 2} /Height ${pageH * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`)
  writeBytes(jpegBytes)
  write('\nendstream\nendobj\n')

  // XRef
  const xrefPos = pos
  write(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`)
  offsets.forEach((o) => {
    write(`${o.toString().padStart(10, '0')} 00000 n \n`)
  })

  // Trailer
  write(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`)

  // Concat
  const total = parts.reduce((s, b) => s + b.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

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
  const [paymentModal, setPaymentModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setCurrentPlan(planId)
    setUpgrading(false)
    setUpgraded(true)
    setUpgradeModal(null)
    setTimeout(() => setUpgraded(false), 3000)
  }

  function handleDownloadInvoice(invoice: (typeof INVOICES)[number]) {
    generateInvoicePdf(invoice)
    showToast(`Factura ${invoice.id} descargada`)
  }

  function handleConfirmCancel() {
    setCancelModal(false)
    showToast('Tu plan se cancelará al final del periodo de facturación')
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
          <button onClick={() => setPaymentModal(true)} className="btn-secondary text-xs py-2">
            Gestionar método de pago
          </button>
          <button
            onClick={() => setCancelModal(true)}
            className="rounded-md border border-red-500/20 px-4 py-2 text-xs text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition"
          >
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
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="text-xs text-accent hover:text-accent-soft"
                    >
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

      {/* Payment method modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-background-soft p-6 shadow-soft">
            <h3 className="text-base font-semibold text-foreground">Método de pago</h3>
            <p className="mt-2 text-sm text-foreground-subtle">
              Tu método de pago actual.
            </p>
            <div className="mt-4 rounded-xl border border-border-subtle bg-background-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-12 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-strong text-[10px] font-bold text-white">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">•••• •••• •••• 4242</p>
                    <p className="text-xs text-foreground-subtle">Caduca 12/2028</p>
                  </div>
                </div>
                <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] text-success">
                  Principal
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-foreground-subtle">
              Para cambiar tu tarjeta, conectaremos pronto con Stripe Billing Portal.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setPaymentModal(false)
                  showToast('Funcionalidad disponible próximamente vía Stripe')
                }}
                className="btn-primary flex-1"
              >
                Actualizar tarjeta
              </button>
              <button onClick={() => setPaymentModal(false)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel plan modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-background-soft p-6 shadow-soft">
            <h3 className="text-base font-semibold text-foreground">¿Cancelar tu plan?</h3>
            <p className="mt-2 text-sm text-foreground-subtle">
              Tu plan <strong className="text-foreground">{current?.name}</strong> seguirá activo hasta el final del
              periodo de facturación. Después perderás el acceso a las funciones premium.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 rounded-md border border-red-500/30 bg-red-500/10 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition"
              >
                Sí, cancelar plan
              </button>
              <button onClick={() => setCancelModal(false)} className="btn-secondary">
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border-subtle bg-background-soft px-4 py-3 text-sm text-foreground shadow-soft">
          {toast}
        </div>
      )}
    </div>
  )
}
