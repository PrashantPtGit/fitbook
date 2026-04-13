import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isBefore, isToday, addMonths, subMonths, isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, supabaseReady } from '../../lib/supabase'
import { SkeletonBox } from '../ui/Skeleton'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AttendanceCalendar({ memberId, gymId }) {
  const [viewDate,      setViewDate]      = useState(new Date())
  const [attendedDates, setAttendedDates] = useState(new Set())
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!supabaseReady || !memberId || !gymId) { setLoading(false); return }

    async function fetchMonth() {
      setLoading(true)
      const start = format(startOfMonth(viewDate), 'yyyy-MM-dd')
      const end   = format(endOfMonth(viewDate),   'yyyy-MM-dd')

      const { data } = await supabase
        .from('attendance')
        .select('date')
        .eq('member_id', memberId)
        .eq('gym_id',    gymId)
        .gte('date', start)
        .lte('date', end)

      setAttendedDates(new Set((data || []).map((r) => r.date)))
      setLoading(false)
    }

    fetchMonth()
  }, [memberId, gymId, viewDate])

  const days           = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const startPadding   = getDay(startOfMonth(viewDate))
  const today          = new Date()
  const attendedCount  = attendedDates.size
  const daysInMonth    = days.length
  const pct            = daysInMonth > 0 ? Math.round((attendedCount / daysInMonth) * 100) : 0
  const isCurrentMonth = isSameMonth(viewDate, today)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {format(viewDate, 'MMMM yyyy')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading
              ? 'Loading…'
              : `${attendedCount} day${attendedCount !== 1 ? 's' : ''} attended · ${pct}% attendance`}
          </p>
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="p-1.5 rounded-btn hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={15} className="text-gray-500" />
          </button>
          <button
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-btn hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={15} className="text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonBox className="h-40 w-full" />
      ) : (
        <>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Padding for first-day offset */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {days.map((day) => {
              const dateStr  = format(day, 'yyyy-MM-dd')
              const attended = attendedDates.has(dateStr)
              const future   = isBefore(today, day) && !isToday(day)
              const todayDay = isToday(day)

              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  {future ? (
                    // Future: plain number
                    <span className="w-7 h-7 flex items-center justify-center text-xs text-gray-200">
                      {format(day, 'd')}
                    </span>
                  ) : todayDay && !attended ? (
                    // Today, not yet attended: blue outline
                    <div className="w-7 h-7 rounded-full border-2 border-primary flex items-center justify-center">
                      <span className="text-xs text-primary font-semibold">{format(day, 'd')}</span>
                    </div>
                  ) : attended ? (
                    // Attended: green fill
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${todayDay ? 'bg-primary' : 'bg-success'}`}>
                      <span className="text-xs text-white font-semibold">{format(day, 'd')}</span>
                    </div>
                  ) : (
                    // Past, not attended: gray outline
                    <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400">{format(day, 'd')}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-gray-400">Attended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-gray-300" />
          <span className="text-xs text-gray-400">Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-primary" />
          <span className="text-xs text-gray-400">Today</span>
        </div>
      </div>
    </div>
  )
}
