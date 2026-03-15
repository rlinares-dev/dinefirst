export default function SessionDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
      <div className="card">
        <div className="h-10 w-24 rounded bg-white/[0.06] animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-white/[0.06] animate-pulse" />
      ))}
    </div>
  )
}
