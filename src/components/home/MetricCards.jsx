import { useState, useEffect } from 'react'
import { Users, UserCheck, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { formatCurrency, todayISO } from '../../utils/helpers'
import { SkeletonMetricCard } from '../ui/Skeleton'

// Top border colors encode metric type — design spec requirement
const CARD_THEMES = {
  members:    { borderColor: '#534AB7', iconBg: 'bg-primary-light',  iconColor: 'text-primary'  },
  attendance: { borderColor: '#4ECDC4', iconBg: 'bg-[#E8FAF9]',      iconColor: 'text-[#1D9E75]'},
  fees:       { borderColor: '#FF6B35', iconBg: 'bg-[#FFF0EA]',      iconColor: 'text-[#FF6B35]'},
  revenue:    { borderColor: '#1D9E75', iconBg: 'bg-success-light',  iconColor: 'text-success'  },
}

function TrendBadge({ pct }) {
  if (pct === null) return <span className="text-xs text-ink-muted">First month</span>
  const positive = pct > 0
  const neutral  = pct === 0
  const Icon     = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      neutral ? 'text-ink-muted' : positive ? 'text-success' : 'text-danger'
    }`}>
      <Icon size={12} strokeWidth={2.5} />
      {positive ? '+' : ''}{pct}% vs last month
    </span>
  )
}

function MetricCard({ icon: Icon, theme, label, value, sub, subColor = 'text-ink-muted', loading, trend = undefined }) {
  if (loading) return <SkeletonMetricCard />
  const { borderColor, iconBg, iconColor } = CARD_THEMES[theme] || CARD_THEMES.members

  return (
    <div
      className="card hover:shadow-float hover:scale-[1.015] transition-all duration-200 cursor-default"
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-ink-muted font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={17} className={iconColor} />
        </div>
      </div>

      {/* Value — JetBrains Mono for precision */}
      <p
        className="text-2xl font-medium text-ink mb-1.5 leading-none"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        {value}
      </p>

      {/* Sub — trend or label */}
      {trend !== undefined
        ? <TrendBadge pct={trend} />
        : <p className={`text-xs ${subColor}`}>{sub}</p>
      }
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
      const monthStart     = format(startOfMonth(now),             'yyyy-MM-dd')
      const monthEnd       = format(endOfMonth(now),               'yyyy-MM-dd')
      const lastMonthStart = format(startOfMonth(subMonths(now,1)),'yyyy-MM-dd')
      const lastMonthEnd   = format(endOfMonth(subMonths(now,1)),  'yyyy-MM-dd')
      const in7            = format(new Date(Date.now() + 7 * 864e5), 'yyyy-MM-dd')

      const [activeRes, newRes, attRes, totalRes, expiringRes, revRes, lastRevRes] =
        await Promise.all([
          supabase.from('members').select('*',{count:'exact',head:true}).eq('gym_id',activeGymId).eq('status','active'),
          supabase.from('members').select('*',{count:'exact',head:true}).eq('gym_id',activeGymId).gte('created_at',monthStart).lte('created_at',monthEnd+'T23:59:59'),
          supabase.from('attendance').select('*',{count:'exact',head:true}).eq('gym_id',activeGymId).eq('date',today),
          supabase.from('members').select('*',{count:'exact',head:true}).eq('gym_id',activeGymId),
          supabase.from('memberships').select('plans(price)').eq('gym_id',activeGymId).eq('status','active').gte('end_date',today).lte('end_date',in7),
          supabase.from('payments').select('amount').eq('gym_id',activeGymId).gte('payment_date',monthStart).lte('payment_date',monthEnd),
          supabase.from('payments').select('amount').eq('gym_id',activeGymId).gte('payment_date',lastMonthStart).lte('payment_date',lastMonthEnd),
        ])

      setMemberCount(activeRes.count || 0)
      setNewThisMonth(newRes.count || 0)
      setAttendanceCount(attRes.count || 0)
      setTotalMembers(totalRes.count || 0)

      const expiring = expiringRes.data || []
      setFeesTotal(expiring.reduce((s,m) => s + (m.plans?.price || 0), 0))
      setFeesCount(expiring.length)

      const rev     = (revRes.data     || []).reduce((s,p) => s+(p.amount||0), 0)
      const lastRev = (lastRevRes.data || []).reduce((s,p) => s+(p.amount||0), 0)
      setRevenue(rev)
      setRevChangePct(lastRev > 0 ? Math.round(((rev-lastRev)/lastRev)*100) : null)
      setLoading(false)
    }

    fetchMetrics()
  }, [activeGymId])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        icon={Users} theme="members"
        label="Active members" value={memberCount}
        sub={newThisMonth > 0 ? `+${newThisMonth} joined this month` : 'No new members'}
        subColor={newThisMonth > 0 ? 'text-success font-medium' : 'text-ink-muted'}
        loading={loading}
      />
      <MetricCard
        icon={UserCheck} theme="attendance"
        label="Checked in today" value={attendanceCount}
        sub={`of ${totalMembers} total members`}
        loading={loading}
      />
      <MetricCard
        icon={AlertCircle} theme="fees"
        label="Fees due this week" value={formatCurrency(feesTotal)}
        sub={feesCount > 0 ? `${feesCount} members pending renewal` : 'All collected ✓'}
        subColor={feesCount > 0 ? 'text-[#FF6B35] font-medium' : 'text-success'}
        loading={loading}
      />
      <MetricCard
        icon={TrendingUp} theme="revenue"
        label="Revenue this month" value={formatCurrency(revenue)}
        trend={revChangePct}
        loading={loading}
      />
    </div>
  )
}
