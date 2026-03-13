export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mb-6">
          <span className="text-4xl">🔍</span>
        </div>

        <h1 className="text-6xl font-extrabold text-accent mb-4">404</h1>

        <h2 className="text-xl font-semibold text-foreground mb-3">
          Página no encontrada
        </h2>

        <p className="text-sm text-foreground-subtle mb-8 leading-relaxed">
          La página que buscas no existe o ha sido movida.
          Puede que el enlace esté roto o la dirección sea incorrecta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="btn-primary px-8 py-3">
            Ir al inicio
          </a>
          <a href="/app" className="btn-secondary px-8 py-3">
            Explorar restaurantes
          </a>
        </div>
      </div>
    </main>
  )
}
