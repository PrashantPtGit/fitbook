import { useState, useEffect } from 'react'
import { Users, UserCheck, AlertCircle, TrendingUp } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { formatCurrency, todayISO } from '../../utils/helpers'
import { SkeletonMetricCard } from '../ui/Skeleton'

function MetricCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor = 'text-gray-400', loading }) {
  if (loading) return <SkeletonMetricCard />
  return (
    <div className="card !p-3 sm:!p-4">
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
  const activeGymId = useGymStore((s) => s.activeGymId)

  const [loading,         setLoading]         = useState(true)
  const [memberCount,     setMemberCount]     = useState(0)
  const [newThisMonth,    setNewThisMonth]    = useState(0)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [totalMembers,    setTotalMembers]    = useState(0)
  const [feesTotal,       setFeesTotal]       = useState(0)
  const [feesCount,       setFeesCount]       = useState(0)
  const [revenue,         setRevenue]         = useState(0)
  const [revChangePct,    setRevChangePct]    = useState(null)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    async function fetchMetrics() {
      setLoading(true)
      const today          = todayISO()
      const now            = new Date()
      const monthStart     = format(startOfMonth(now), 'yyyy-MM-dd')
      const monthEnd       = format(endOfMonth(now),   'yyyy-MM-dd')
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      const lastMonthEnd   = format(endOfMonth(subMonths(now, 1)),   'yyyy-MM-dd')
      const in7            = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      const [
        activeResult,
        newResult,
        attendanceResult,
        totalResult,
        expiringResult,
        revenueResult,
        lastRevenueResult,
      ] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId).eq('status', 'active'),
        supabase.from('members').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId)
          .gte('created_at', monthStart).lte('created_at', monthEnd + 'T23:59:59'),
        supabase.from('attendance').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId).eq('date', today),
        supabase.from('members').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId),
        supabase.from('memberships').select('plans(price)')
          .eq('gym_id', activeGymId).eq('status', 'active')
          .gte('end_date', today).lte('end_date', in7),
        supabase.from('payments').select('amount')
          .eq('gym_id', activeGymId)
          .gte('payment_date', monthStart).lte('payment_date', monthEnd),
        supabase.from('payments').select('amount')
          .eq('gym_id', activeGymId)
          .gte('payment_date', lastMonthStart).lte('payment_date', lastMonthEnd),
      ])

      setMemberCount(activeResult.count || 0)
      setNewThisMonth(newResult.count || 0)
      setAttendanceCount(attendanceResult.count || 0)
      setTotalMembers(totalResult.count || 0)

      const expiring = expiringResult.data || []
      setFeesTotal(expiring.reduce((s, m) => s + (m.plans?.price || 0), 0))
      setFeesCount(expiring.length)

      const rev     = (revenueResult.data || []).reduce((s, p) => s + (p.amount || 0), 0)
      const lastRev = (lastRevenueResult.data || []).reduce((s, p) => s + (p.amount || 0), 0)
      setRevenue(rev)
      setRevChangePct(lastRev > 0 ? Math.round(((rev - lastRev) / lastRev) * 100) : null)

      setLoading(false)
    }

    fetchMetrics()
  }, [activeGymId])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        icon={Users}
        iconBg="bg-primary-light" iconColor="text-primary"
        label="Active members"
        value={memberCount}
        sub={newThisMonth > 0 ? `+${newThisMonth} this month` : 'No new this month'}
        subColor={newThisMonth > 0 ? 'text-success' : 'text-gray-400'}
        loading={loading}
      />
      <MetricCard
        icon={UserCheck}
        iconBg="bg-success-light" iconColor="text-success"
        label="Checked in today"
        value={attendanceCount}
        sub={`of ${totalMembers} members`}
        loading={loading}
      />
      <MetricCard
        icon={AlertCircle}
        iconBg={feesTotal > 0 ? 'bg-danger-light' : 'bg-gray-100'}
        iconColor={feesTotal > 0 ? 'text-danger' : 'text-gray-400'}
        label="Fees due this week"
        value={formatCurrency(feesTotal)}
        sub={feesCount > 0 ? `${feesCount} members pending` : 'All collected'}
        subColor={feesCount > 0 ? 'text-danger' : 'text-gray-400'}
        loading={loading}
      />
      <MetricCard
        icon={TrendingUp}
        iconBg="bg-warning-light" iconColor="text-warning"
        label="Revenue this month"
        value={formatCurrency(revenue)}
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
        loading={loading}
      />
    </div>
  )
}
