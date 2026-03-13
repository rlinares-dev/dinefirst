'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loading con efecto shimmer.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      className={clsx('rounded-lg bg-white/[0.06]', className)}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/**
 * Skeleton con forma de tarjeta de restaurante.
 */
export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-2.5 px-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para una fila de tabla/lista.
 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  )
}

/**
 * Skeleton para líneas de texto.
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-3',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton para stat cards del dashboard.
 */
export function SkeletonStatCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-2 w-3/4" />
    </div>
  )
}
