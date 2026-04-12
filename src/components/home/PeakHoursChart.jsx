import { useMemo } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { getHours, parseISO } from 'date-fns'
import { useAttendance } from '../../hooks/useAttendance'
import { SkeletonBox } from '../ui/Skeleton'

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

function fmtHour(h) {
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

export default function PeakHoursChart() {
  const { todayAttendance, loading } = useAttendance()

  const hourData = useMemo(() => {
    const counts = Object.fromEntries(HOURS.map((h) => [h, 0]))
    todayAttendance.forEach((a) => {
      try {
        const h = getHours(parseISO(a.checked_in_at))
        if (h in counts) counts[h]++
      } catch { /* skip */ }
    })
    return HOURS.map((h) => ({ hour: fmtHour(h), count: counts[h], raw: h }))
  }, [todayAttendance])

  const peak = useMemo(
    () => hourData.reduce((m, h) => (h.count > m.count ? h : m), hourData[0] || { hour: '', count: 0 }),
    [hourData]
  )

  const hasData = todayAttendance.length > 0

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Today by hour</h3>

      {loading ? (
        <SkeletonBox className="w-full h-24" />
      ) : !hasData ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-xs text-gray-400">No check-ins yet today</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={hourData} barCategoryGap="20%">
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#888780' }}
                interval={2}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {hourData.map((entry, i) => (
                  <Cell key={i} fill={entry.hour === peak.hour ? '#534AB7' : '#AFA9EC'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {peak.count > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Peak: {peak.hour} · {peak.count} member{peak.count !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}
