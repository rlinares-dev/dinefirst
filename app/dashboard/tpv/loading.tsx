export default function TPVLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-lg bg-white/[0.06] animate-pulse" />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="mt-2 h-7 w-10 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-white/[0.06] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
