import { SkeletonStatCard, SkeletonRow } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-6 w-16 bg-white/[0.06] rounded-full animate-pulse" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card p-5">
        <div className="h-5 w-40 bg-white/[0.06] rounded mb-4 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
