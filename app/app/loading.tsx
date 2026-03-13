import { SkeletonCard } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Search bar skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-12 bg-white/[0.06] rounded-full animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-white/[0.06] rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
