import { useMemo } from 'react'
import { format, parseISO, differenceInDays, startOfWeek, addDays } from 'date-fns'
import { Flame, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar'
import { formatDate } from '../../utils/helpers'

const GOAL = 26 // working days per month

function calcStreak(attendance) {
  if (!attendance.length) return { current: 0, best: 0 }
  const dates = [...new Set(attendance.map((a) => a.date))].sort((a, b) => b > a ? 1 : -1)
  const today = format(new Date(), 'yyyy-MM-dd')

  let current = 0
  let run = 0
  let prev = today
  for (const d of dates) {
    const diff = differenceInDays(parseISO(prev), parseISO(d))
    if (diff <= 1) { run++; prev = d }
    else break
  }
  current = dates[0] === today || (dates[0] && differenceInDays(new Date(), parseISO(dates[0])) <= 1) ? run : 0

  let best = 0
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    if (differenceInDays(parseISO(dates[i]), parseISO(dates[i + 1])) === 1) {
      streak++
      best = Math.max(best, streak)
    } else {
      streak = 1
    }
  }
  best = Math.max(best, current, dates.length > 0 ? 1 : 0)
  return { current, best }
}

function buildWeeklyData(attendance) {
  const weeks = []
  for (let w = 7; w >= 0; w--) {
    const weekStart = startOfWeek(new Date())
    weekStart.setDate(weekStart.getDate() - w * 7)
    let count = 0
    for (let d = 0; d < 7; d++) {
      const day = format(addDays(weekStart, d), 'yyyy-MM-dd')
      if (attendance.some((a) => a.date === day)) count++
    }
    weeks.push({
      label: format(addDays(weekStart, 3), 'd MMM'),
      count,
    })
  }
  return weeks
}

export default function MemberAttendance() {
  const { member, attendance, loading } = useMemberPortal()

  const thisMonthKey   = format(new Date(), 'yyyy-MM')
  const thisMonthCount = attendance.filter((a) => a.date?.startsWith(thisMonthKey)).length
  const goalPct        = Math.min(100, Math.round((thisMonthCount / GOAL) * 100))

  const { current: currentStreak, best: bestStreak } = useMemo(() => calcStreak(attendance), [attendance])
  const weeklyData = useMemo(() => buildWeeklyData(attendance), [attendance])

  const recentCheckins = attendance.slice(0, 10)

  if (loading) {
    return (
      <MemberPortalLayout title="Attendance">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl h-40" />)}
        </div>
      </MemberPortalLayout>
    )
  }

  return (
    <MemberPortalLayout title="Attendance">
      {/* This month summary */}
      <div
        className="bg-white rounded-xl p-4 mb-4 border border-gray-100"
        style={{ borderLeft: '3px solid #1D9E75' }}
      >
        <p className="text-xs text-gray-400 mb-1">This month</p>
        <div className="flex items-end gap-2 mb-3">
          <p className="text-4xl font-bold text-gray-900" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {thisMonthCount}
          </p>
          <p className="text-sm text-gray-400 mb-1">/ {GOAL} days goal</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${goalPct}%`, background: '#1D9E75' }}
          />
        </div>
        <p className="text-xs text-gray-400">{goalPct}% of monthly goal · {GOAL - thisMonthCount > 0 ? `${GOAL - thisMonthCount} more to hit goal` : 'Goal achieved! 🎉'}</p>
      </div>

      {/* Streak tracker */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="flex justify-center mb-1">
            <Flame size={18} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {currentStreak}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Current streak</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="flex justify-center mb-1">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {bestStreak}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Best streak</p>
        </div>
      </div>

      {/* Weekly bar chart — last 8 weeks */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly attendance — last 8 weeks</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyData} barCategoryGap="25%">
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 7]} />
            <Tooltip
              formatter={(v) => [`${v} days`, 'Attended']}
              contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {weeklyData.map((d, i) => (
                <Cell key={i} fill={i === weeklyData.length - 1 ? '#1D9E75' : '#A7F3D0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calendar */}
      {member && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <AttendanceCalendar memberId={member.id} gymId={member.gym_id} />
        </div>
      )}

      {/* Recent check-ins */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent check-ins</p>
        {recentCheckins.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No check-ins yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentCheckins.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-gray-800">{formatDate(a.date)}</p>
                  {a.checked_in_at && (
                    <p className="text-xs text-gray-400">
                      {format(parseISO(a.checked_in_at), 'h:mm a')}
                    </p>
                  )}
                </div>
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">
                  {a.source || 'manual'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberPortalLayout>
  )
}
