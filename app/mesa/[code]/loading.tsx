export default function MesaLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-accent" />
        <p className="text-sm text-foreground-subtle">Cargando carta...</p>
      </div>
    </div>
  )
}
