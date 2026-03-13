'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en admin:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="text-4xl mb-4 block">⚙️</span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Error de administración
        </h2>
        <p className="text-sm text-foreground-subtle mb-6">
          No se pudo cargar el panel de administración.
        </p>
        <button onClick={() => reset()} className="btn-primary px-6 py-2.5">
          Reintentar
        </button>
      </div>
    </div>
  )
}
