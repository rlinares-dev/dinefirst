'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playBillSound } from '@/lib/sounds'

interface BillAlert {
  id: string
  tableName: string
  tableId: string
  total: number
  requestedAt: string
}

interface BillAlertProviderProps {
  alerts: BillAlert[]
  onDismiss: (id: string) => void
  onNavigate?: (tableId: string) => void
}

/**
 * Full-screen overlay notification for bill requests.
 * Shows a prominent slide-down banner that the waiter can't miss.
 * Each alert auto-dismisses after 15 seconds but can be tapped to navigate.
 */
export function BillAlertOverlay({ alerts, onDismiss, onNavigate }: BillAlertProviderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 pt-3 px-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <BillAlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => onDismiss(alert.id)}
            onNavigate={onNavigate ? () => onNavigate(alert.tableId) : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function BillAlertCard({
  alert,
  onDismiss,
  onNavigate,
}: {
  alert: BillAlert
  onDismiss: () => void
  onNavigate?: () => void
}) {
  // Auto-dismiss after 15 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 15000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -80, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      className="pointer-events-auto w-full max-w-md"
    >
      <div className="relative overflow-hidden rounded-2xl border border-accent/50 bg-background-elevated shadow-deep">
        {/* Animated accent stripe at top */}
        <div className="h-1 bg-gradient-to-r from-accent via-accent-soft to-accent animate-pulse" />

        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Pulsing icon */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15">
              <span className="text-2xl">🧾</span>
              <span className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Cuenta solicitada
                </span>
                <span className="text-[10px] text-foreground-subtle">
                  {new Date(alert.requestedAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="mt-0.5 text-base font-bold text-foreground">{alert.tableName}</p>
            </div>

            {/* Total */}
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold text-accent">{alert.total.toFixed(2)} €</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-border-subtle py-2 text-xs font-medium text-foreground-subtle hover:text-foreground transition"
            >
              Entendido
            </button>
            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate()
                  onDismiss()
                }}
                className="flex-1 rounded-xl bg-accent py-2 text-xs font-bold text-white hover:bg-accent-strong transition"
              >
                Ir a la mesa →
              </button>
            )}
          </div>
        </div>

        {/* Countdown bar */}
        <motion.div
          className="h-0.5 bg-accent/60"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

/**
 * Hook to manage bill alert state.
 * Tracks which bills have already been shown to avoid duplicate alerts.
 */
export function useBillAlerts() {
  const [alerts, setAlerts] = useState<BillAlert[]>([])
  const [shownBills, setShownBills] = useState<Set<string>>(new Set())

  const showBillAlert = useCallback(
    (alert: Omit<BillAlert, 'id'>) => {
      // Use tableId as dedup key — only alert once per table per session
      const key = alert.tableId
      if (shownBills.has(key)) return

      setShownBills((prev) => new Set(prev).add(key))
      setAlerts((prev) => [
        ...prev,
        { ...alert, id: Date.now().toString(36) + Math.random().toString(36).slice(2) },
      ])
      playBillSound()
    },
    [shownBills]
  )

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const resetShownBills = useCallback(() => {
    setShownBills(new Set())
  }, [])

  return { alerts, showBillAlert, dismissAlert, resetShownBills }
}

export type { BillAlert }
