import { SkeletonRow } from '@/components/ui/skeleton'

export default function ReservasLoading() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="h-8 w-40 bg-white/[0.06] rounded-lg mb-6 animate-pulse" />
      <div className="card p-5 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
