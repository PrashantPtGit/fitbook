import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { useShallow } from 'zustand/react/shallow'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { formatCurrency, todayISO, dateISO } from '../../utils/helpers'
import GymComparisonCard from './GymComparisonCard'
import { SkeletonCard } from '../ui/Skeleton'

const GYM_COLORS = ['#534AB7', '#1D9E75', '#BA7517']

function useAllGymsStats(gyms) {
  const [stats,       setStats]       = useState({})
  const [revenueData, setRevenueData] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!supabaseReady || !gyms.length) { setLoading(false); return }

    async function fetchAll() {
      setLoading(true)
      const today          = todayISO()
      const monthStart     = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const monthEnd       = format(endOfMonth(new Date()),   'yyyy-MM-dd')
      const in7            = dateISO(addDays(new Date(), 7))
      const gymStats       = {}

      for (const gym of gyms) {
        const gid = gym.id

        const [
          { count: memberCount },
          { count: todayCheckins },
          { data: payData },
          { data: expData },
        ] = await Promise.all([
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gid).eq('status', 'active'),
          supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('gym_id', gid).eq('date', today),
          supabase.from('payments').select('amount').eq('gym_id', gid).gte('payment_date', monthStart).lte('payment_date', monthEnd),
          supabase.from('memberships').select('plans(price)').eq('gym_id', gid).eq('status', 'active').gte('end_date', today).lte('end_date', in7),
        ])

        const monthlyRevenue = (payData || []).reduce((s, p) => s + (p.amount || 0), 0)
        const pendingFees    = (expData || []).reduce((s, m) => s + (m.plans?.price || 0), 0)

        // Sparkline
        const sparklineData = []
        for (let i = 5; i >= 0; i--) {
          const mo = subMonths(new Date(), i)
          const { data: sp } = await supabase
            .from('payments').select('amount').eq('gym_id', gid)
            .gte('payment_date', format(startOfMonth(mo), 'yyyy-MM-dd'))
            .lte('payment_date', format(endOfMonth(mo),   'yyyy-MM-dd'))
          sparklineData.push({ month: format(mo, 'MMM'), amount: (sp || []).reduce((s, p) => s + (p.amount || 0), 0) })
        }

        gymStats[gid] = { memberCount: memberCount || 0, todayCheckins: todayCheckins || 0, monthlyRevenue, pendingFees, sparklineData }
      }

      setStats(gymStats)

      // Line chart: one row per month, one key per gym
      const months = []
      for (let i = 5; i >= 0; i--) {
        const mo    = subMonths(new Date(), i)
        const entry = { month: format(mo, 'MMM') }
        gyms.forEach((gym) => {
          entry[gym.name] = gymStats[gym.id]?.sparklineData?.[5 - i]?.amount || 0
        })
        months.push(entry)
      }
      setRevenueData(months)
      setLoading(false)
    }

    fetchAll()
  }, [gyms])

  return { stats, revenueData, loading }
}

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-card p-3 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function AllGymsDashboard() {
  const { gyms, setActiveGym } = useGymStore(
    useShallow((s) => ({ gyms: s.gyms, setActiveGym: s.setActiveGym }))
  )

  const { stats, revenueData, loading } = useAllGymsStats(gyms)

  const totals = useMemo(() => {
    const all = Object.values(stats)
    return {
      members: all.reduce((s, g) => s + g.memberCount, 0),
      revenue: all.reduce((s, g) => s + g.monthlyRevenue, 0),
      pending: all.reduce((s, g) => s + g.pendingFees, 0),
    }
  }, [stats])

  return (
    <div className="space-y-4">
      {/* Combined totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total members',      value: totals.members,                color: 'text-gray-900' },
          { label: 'Combined revenue',   value: formatCurrency(totals.revenue), color: 'text-gray-900' },
          { label: 'Total fees pending', value: formatCurrency(totals.pending), color: totals.pending > 0 ? 'text-danger' : 'text-gray-900' },
        ].map((m) => (
          <div key={m.label} className="card text-center">
            <p className="metric-label">{m.label}</p>
            <p className={`text-2xl font-medium mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Per-gym cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {gyms.map((gym, i) => (
            <GymComparisonCard
              key={gym.id}
              gym={gym}
              stats={stats[gym.id]}
              gymIndex={i}
              onSelect={setActiveGym}
            />
          ))}
        </div>
      )}

      {/* Revenue comparison chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue comparison — all locations</h3>
        {loading ? (
          <div className="h-48 bg-gray-50 animate-pulse rounded-btn" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888780' }} />
              <YAxis hide />
              <Tooltip content={<LineTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {gyms.map((gym, i) => (
                <Line
                  key={gym.id}
                  type="monotone"
                  dataKey={gym.name}
                  stroke={GYM_COLORS[i % 3]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
