import { useMemo } from 'react'
import { Users, UserCheck, AlertCircle, TrendingUp } from 'lucide-react'
import { isWithinInterval, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns'
import { useMembersHook } from '../../hooks/useMembers'
import { usePayments } from '../../hooks/usePayments'
import { useAttendance } from '../../hooks/useAttendance'
import { useReports } from '../../hooks/useReports'
import { formatCurrency } from '../../utils/helpers'
import { SkeletonMetricCard } from '../ui/Skeleton'

function MetricCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor = 'text-gray-400', loading }) {
  if (loading) return <SkeletonMetricCard />
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <p className="metric-label">{label}</p>
        <div className={`p-1.5 rounded-btn ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <p className="metric-value">{value}</p>
      <p className={`metric-sub ${subColor}`}>{sub}</p>
    </div>
  )
}

export default function MetricCards() {
  const { members, loading: mLoad }           = useMembersHook()
  const { payments, loading: pLoad }          = usePayments()
  const { todayAttendance, loading: aLoad }   = useAttendance()
  const { expiringThisWeek, monthlyRevenue, loading: rLoad } = useReports()

  const now        = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd   = endOfMonth(now)

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'active'), [members])

  const newThisMonth = useMemo(() =>
    members.filter((m) => {
      try {
        const d = parseISO(m.created_at)
        return isValid(d) && isWithinInterval(d, { start: monthStart, end: monthEnd })
      } catch { return false }
    }).length
  , [members])

  const monthlyTotal = useMemo(() =>
    payments
      .filter((p) => {
        try {
          const d = parseISO(p.payment_date)
          return isValid(d) && isWithinInterval(d, { start: monthStart, end: monthEnd })
        } catch { return false }
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  , [payments])

  const feesDueTotal = useMemo(
    () => expiringThisWeek.reduce((s, m) => s + (m.plans?.price || 0), 0),
    [expiringThisWeek]
  )

  const lastMonthAmt  = monthlyRevenue.length >= 2 ? (monthlyRevenue[monthlyRevenue.length - 2]?.amount || 0) : 0
  const revChangePct  = lastMonthAmt > 0 ? Math.round(((monthlyTotal - lastMonthAmt) / lastMonthAmt) * 100) : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        icon={Users}
        iconBg="bg-primary-light" iconColor="text-primary"
        label="Active members"
        value={activeMembers.length}
        sub={newThisMonth > 0 ? `+${newThisMonth} this month` : 'No new this month'}
        subColor={newThisMonth > 0 ? 'text-success' : 'text-gray-400'}
        loading={mLoad}
      />
      <MetricCard
        icon={UserCheck}
        iconBg="bg-success-light" iconColor="text-success"
        label="Checked in today"
        value={todayAttendance.length}
        sub={`of ${members.length} members`}
        loading={aLoad}
      />
      <MetricCard
        icon={AlertCircle}
        iconBg={feesDueTotal > 0 ? 'bg-danger-light' : 'bg-gray-100'}
        iconColor={feesDueTotal > 0 ? 'text-danger' : 'text-gray-400'}
        label="Fees due this week"
        value={formatCurrency(feesDueTotal)}
        sub={expiringThisWeek.length > 0 ? `${expiringThisWeek.length} members pending` : 'All collected'}
        subColor={expiringThisWeek.length > 0 ? 'text-danger' : 'text-gray-400'}
        loading={rLoad}
      />
      <MetricCard
        icon={TrendingUp}
        iconBg="bg-warning-light" iconColor="text-warning"
        label="Revenue this month"
        value={formatCurrency(monthlyTotal)}
        sub={
          revChangePct !== null
            ? `${revChangePct > 0 ? '+' : ''}${revChangePct}% vs last month`
            : 'First month'
        }
        subColor={
          revChangePct === null ? 'text-gray-400'
          : revChangePct > 0   ? 'text-success'
          : revChangePct < 0   ? 'text-danger'
          :                      'text-gray-400'
        }
        loading={pLoad}
      />
    </div>
  )
}
