import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isBefore, isToday, addMonths, subMonths, isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, supabaseReady } from '../../lib/supabase'

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

  const days          = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const startPadding  = getDay(startOfMonth(viewDate))
  const today         = new Date()
  const attendedCount = attendedDates.size
  const pct           = days.length > 0 ? Math.round((attendedCount / days.length) * 100) : 0
  const isCurrentMonth = isSameMonth(viewDate, today)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-800">{format(viewDate, 'MMMM yyyy')}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${attendedCount} days attended · ${pct}% attendance`}
          </p>
        </div>
        <div className="flex gap-1">
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

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Leading empty cells */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr  = format(day, 'yyyy-MM-dd')
          const attended = attendedDates.has(dateStr)
          const future   = isBefore(today, day) && !isToday(day)

          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              {future ? (
                <span className="w-7 h-7 flex items-center justify-center text-xs text-gray-200">
                  {format(day, 'd')}
                </span>
              ) : attended ? (
                <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">{format(day, 'd')}</span>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400">{format(day, 'd')}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-gray-400">Attended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-gray-300" />
          <span className="text-xs text-gray-400">Missed</span>
        </div>
      </div>
    </div>
  )
}
