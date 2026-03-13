'use client'

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en /app:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="text-4xl mb-4 block">😕</span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Error al cargar
        </h2>
        <p className="text-sm text-foreground-subtle mb-6">
          No se pudo cargar la página. Por favor, inténtalo de nuevo.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="btn-primary px-6 py-2.5">
            Reintentar
          </button>
          <a href="/app" className="btn-secondary px-6 py-2.5">
            Volver a inicio
          </a>
        </div>
      </div>
    </div>
  )
}
