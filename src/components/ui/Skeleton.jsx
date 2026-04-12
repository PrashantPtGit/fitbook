import clsx from 'clsx'

export function SkeletonBox({ className = '' }) {
  return <div className={clsx('bg-gray-100 animate-pulse rounded', className)} />
}

export function SkeletonText({ lines = 2, className = '' }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx('bg-gray-100 animate-pulse rounded h-3', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-3">
        <SkeletonBox className="w-32 h-4" />
        <SkeletonBox className="w-16 h-4" />
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonMetricCard() {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <SkeletonBox className="w-24 h-3" />
        <SkeletonBox className="w-8 h-8 rounded-btn" />
      </div>
      <SkeletonBox className="w-20 h-7 mb-2" />
      <SkeletonBox className="w-32 h-3" />
    </div>
  )
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={clsx('flex items-center gap-3 py-2.5', className)}>
      <SkeletonBox className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBox className="w-32 h-3" />
        <SkeletonBox className="w-24 h-2.5" />
      </div>
      <SkeletonBox className="w-16 h-5 rounded-full" />
    </div>
  )
}
