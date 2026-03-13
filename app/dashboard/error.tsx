'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en dashboard:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="text-4xl mb-4 block">🔧</span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Error en el dashboard
        </h2>
        <p className="text-sm text-foreground-subtle mb-6">
          Ha ocurrido un error al cargar el panel de control.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="btn-primary px-6 py-2.5">
            Reintentar
          </button>
          <a href="/dashboard" className="btn-secondary px-6 py-2.5">
            Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
