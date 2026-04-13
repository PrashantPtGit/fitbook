import { format, parseISO, isToday } from 'date-fns'
import { SkeletonBox } from '../ui/Skeleton'

export default function WeeklyGrid({ weeklyData, loading }) {
  if (loading) {
    return (
      <div className="card">
        <SkeletonBox className="h-6 w-32 mb-4" />
        <SkeletonBox className="h-28 w-full" />
      </div>
    )
  }

  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1)
  const today    = new Date().toISOString().split('T')[0]

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">This week</h3>

      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto -mx-1">
        <div className="grid grid-cols-7 gap-1 min-w-[360px] px-1">
          {weeklyData.map((d) => {
            const isCurrentDay  = d.date === today
            const isFuture      = d.date > today
            const heightPct     = isFuture ? 0 : maxCount > 0 ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 10 : 0) : 0

            let barColor = 'bg-gray-100'
            if (!isFuture && d.count > 0) {
              barColor = d.count >= maxCount * 0.6 ? 'bg-primary' : 'bg-primary-mid'
            }

            return (
              <div
                key={d.date}
                className={[
                  'flex flex-col items-center gap-1 p-1.5 rounded-btn transition-colors',
                  isCurrentDay ? 'bg-primary-light border border-primary' : 'hover:bg-gray-50',
                ].join(' ')}
              >
                {/* Day label */}
                <span className={`text-[10px] font-medium uppercase tracking-wide ${isCurrentDay ? 'text-primary' : 'text-gray-400'}`}>
                  {d.day.slice(0, 3)}
                </span>

                {/* Date number */}
                <span className={`text-[10px] ${isCurrentDay ? 'text-primary-dark' : 'text-gray-400'}`}>
                  {format(parseISO(d.date), 'd')}
                </span>

                {/* Count */}
                <span className={`text-base font-bold leading-none ${isCurrentDay ? 'text-primary' : isFuture ? 'text-gray-200' : 'text-gray-800'}`}>
                  {isFuture ? '·' : d.count}
                </span>

                {/* Proportional bar */}
                <div className="w-full h-10 flex items-end">
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${barColor}`}
                    style={{ height: isFuture ? '4px' : `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-primary" />
          <span className="text-xs text-gray-400">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-primary-mid" />
          <span className="text-xs text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-gray-100" />
          <span className="text-xs text-gray-400">Future / None</span>
        </div>
      </div>
    </div>
  )
}
