import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonBox } from '../ui/Skeleton'

const BATCHES = [
  { label: '6–8 AM',  hours: [6, 7] },
  { label: '7–9 AM',  hours: [7, 8] },
  { label: '5–7 PM',  hours: [17, 18] },
  { label: '7–9 PM',  hours: [19, 20] },
]

export default function TodayStats({ todayAttendance, loading }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [totalMembers, setTotalMembers] = useState(0)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', activeGymId)
      .eq('status', 'active')
      .then(({ count }) => setTotalMembers(count || 0))
  }, [activeGymId])

  const checkedIn = todayAttendance.length
  const pct       = totalMembers > 0 ? Math.min(100, Math.round((checkedIn / totalMembers) * 100)) : 0

  // Peak hour
  const peakHour = useMemo(() => {
    const hourCounts = {}
    todayAttendance.forEach((a) => {
      if (!a.checked_in_at) return
      try {
        const h = parseISO(a.checked_in_at).getHours()
        hourCounts[h] = (hourCounts[h] || 0) + 1
      } catch { /* skip malformed */ }
    })
    const entries = Object.entries(hourCounts)
    if (!entries.length) return null
    const [hour] = entries.sort((a, b) => b[1] - a[1])[0]
    const h    = parseInt(hour, 10)
    const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h12} ${ampm}`
  }, [todayAttendance])

  // Batch breakdown
  const batchCounts = useMemo(() =>
    BATCHES.map((b) => ({
      ...b,
      count: todayAttendance.filter((a) => {
        if (!a.checked_in_at) return false
        try { return b.hours.includes(parseISO(a.checked_in_at).getHours()) }
        catch { return false }
      }).length,
    }))
  , [todayAttendance])

  const lastCheckIn = todayAttendance[0]

  if (loading) {
    return (
      <div className="card h-full">
        <SkeletonBox className="h-6 w-32 mb-4" />
        <SkeletonBox className="h-12 w-20 mb-3" />
        <SkeletonBox className="h-2 w-full mb-6" />
        <SkeletonBox className="h-4 w-full mb-2" />
        <SkeletonBox className="h-4 w-full mb-2" />
        <SkeletonBox className="h-4 w-3/4" />
      </div>
    )
  }

  return (
    <div className="card h-full">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Today's attendance</h3>

      {/* Big number */}
      <div className="flex items-end gap-2 mb-2">
        <span className="text-4xl font-bold text-gray-900 leading-none">{checkedIn}</span>
        <span className="text-sm text-gray-400 mb-0.5">of {totalMembers} active members</span>
      </div>

      {/* Percentage */}
      <p className="text-xs text-gray-400 mb-2">{pct}% attendance rate</p>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-success rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Peak hour */}
      {peakHour ? (
        <p className="text-xs text-gray-500 mb-4">
          Most arrivals at{' '}
          <span className="font-semibold text-gray-800">{peakHour}</span>
        </p>
      ) : (
        <p className="text-xs text-gray-400 mb-4">No arrivals yet today</p>
      )}

      {/* Batch breakdown */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-500">By batch</p>
        {batchCounts.map((b) => {
          const barPct = checkedIn > 0 ? Math.round((b.count / checkedIn) * 100) : 0
          return (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-16 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-4 text-right">{b.count}</span>
            </div>
          )
        })}
      </div>

      {/* Last check-in */}
      {lastCheckIn && (
        <div className="bg-gray-50 rounded-btn px-3 py-2 mt-auto">
          <p className="text-xs text-gray-400 mb-0.5">Last check-in</p>
          <p className="text-xs font-semibold text-gray-800">
            {lastCheckIn.members?.name || 'Unknown'}
            {lastCheckIn.checked_in_at && (
              <span className="font-normal text-gray-500">
                {' '}· {format(parseISO(lastCheckIn.checked_in_at), 'h:mm a')}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
