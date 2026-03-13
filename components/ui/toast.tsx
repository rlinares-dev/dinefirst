'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  const value: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container — arriba a la derecha */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
              className={clsx(
                'pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-deep border backdrop-blur-sm max-w-sm',
                {
                  'bg-green-500/15 border-green-500/25 text-green-400': toast.type === 'success',
                  'bg-red-500/15 border-red-500/25 text-red-400': toast.type === 'error',
                  'bg-accent/15 border-accent/25 text-accent-soft': toast.type === 'info',
                }
              )}
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">
                  {toast.type === 'success' && '✓'}
                  {toast.type === 'error' && '✕'}
                  {toast.type === 'info' && 'ℹ'}
                </span>
                <span>{toast.message}</span>
              </div>

              {/* Progress bar */}
              <motion.div
                className={clsx('h-0.5 rounded-full mt-2', {
                  'bg-green-500/40': toast.type === 'success',
                  'bg-red-500/40': toast.type === 'error',
                  'bg-accent/40': toast.type === 'info',
                })}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast debe usarse dentro de un ToastProvider')
  }
  return context
}
