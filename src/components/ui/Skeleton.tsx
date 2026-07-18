import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted/70', className)} />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-5 space-y-3', className)}>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/20">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-border/40">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn('h-3.5 flex-1', j === 0 && 'w-6 flex-none rounded-full')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={cn('grid gap-4', count === 4 && 'grid-cols-4', count === 3 && 'grid-cols-3', count === 2 && 'grid-cols-2')}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
