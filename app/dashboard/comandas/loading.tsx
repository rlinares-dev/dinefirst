export default function ComandasLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
      <div className="grid gap-3 grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="mt-2 h-7 w-10 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-white/[0.06] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
