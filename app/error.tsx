'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error (en producción enviar a Sentry u otro servicio)
    console.error('Error no controlado:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 mb-6">
          <span className="text-4xl">⚠️</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Algo salió mal
        </h1>

        <p className="text-sm text-foreground-subtle mb-8 leading-relaxed">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado
          y estamos trabajando para solucionarlo.
        </p>

        {error.digest && (
          <p className="text-xs text-foreground-muted mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => reset()} className="btn-primary px-8 py-3">
            Intentar de nuevo
          </button>
          <a href="/" className="btn-secondary px-8 py-3">
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  )
}
