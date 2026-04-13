import { useState, useEffect } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonBox } from '../ui/Skeleton'

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

function hourLabel(h) {
  if (h === 12) return '12p'
  if (h < 12) return `${h}a`
  return `${h - 12}p`
}

function cellColor(count, max) {
  if (!count || max === 0) return 'bg-gray-100'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-primary-light'
  if (ratio < 0.6)  return 'bg-primary-mid'
  return 'bg-primary'
}

export default function AttendanceHeatmap({ gymId: propGymId }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gymId = propGymId !== undefined ? propGymId : activeGymId

  const [grid,    setGrid]    = useState({}) // key: "dayIdx-hour" → count
  const [maxVal,  setMaxVal]  = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    fetchData()
  }, [gymId])

  async function fetchData() {
    setLoading(true)
    const cutoff = format(subDays(new Date(), 30), 'yyyy-MM-dd')

    let q = supabase
      .from('attendance')
      .select('checked_in_at, date')
      .gte('date', cutoff)
    if (gymId) q = q.eq('gym_id', gymId)
    const { data } = await q

    const g = {}
    let mx = 0
    ;(data || []).forEach((row) => {
      const dt = row.checked_in_at ? parseISO(row.checked_in_at) : parseISO(row.date)
      // getDay(): 0=Sun,1=Mon...6=Sat  → map to Mon=0..Sun=6
      const rawDay = dt.getDay()
      const dayIdx = rawDay === 0 ? 6 : rawDay - 1
      const hour = dt.getHours()
      if (hour < 5 || hour > 20) return
      const key = `${dayIdx}-${hour}`
      g[key] = (g[key] || 0) + 1
      if (g[key] > mx) mx = g[key]
    })

    setGrid(g)
    setMaxVal(mx || 1)
    setLoading(false)
  }

  if (loading) return <SkeletonBox className="h-40 w-full" />

  const isEmpty = Object.keys(grid).length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <CalendarDays size={32} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-400">No attendance data (last 30 days)</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-[9px] text-gray-400 text-center">{hourLabel(h)}</div>
          ))}
        </div>
        {/* Grid */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-0 mb-0.5">
            <div className="w-10 text-[10px] text-gray-400 text-right pr-1.5 shrink-0">{day}</div>
            {HOURS.map((h) => {
              const count = grid[`${dayIdx}-${h}`] || 0
              return (
                <div
                  key={h}
                  title={`${day} ${hourLabel(h)}: ${count} check-ins`}
                  className={`flex-1 h-5 rounded-[2px] mx-px ${cellColor(count, maxVal)}`}
                />
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-[10px] text-gray-400">Less</span>
          <div className="w-4 h-4 rounded-[2px] bg-gray-100" />
          <div className="w-4 h-4 rounded-[2px] bg-primary-light" />
          <div className="w-4 h-4 rounded-[2px] bg-primary-mid" />
          <div className="w-4 h-4 rounded-[2px] bg-primary" />
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  )
}
