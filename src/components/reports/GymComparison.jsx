import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { supabase, supabaseReady } from '../../lib/supabase'
import { formatCurrency } from '../../utils/helpers'
import { SkeletonBox } from '../ui/Skeleton'

const GYM_COLORS = ['#534AB7', '#1D9E75', '#BA7517']

export default function GymComparison({ gyms = [] }) {
  const [stats,    setStats]    = useState([])     // per-gym stats
  const [revData,  setRevData]  = useState([])     // [{month, gym0, gym1, gym2}]
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!supabaseReady || !gyms.length) { setLoading(false); return }
    fetchAll()
  }, [gyms.length])

  async function fetchAll() {
    setLoading(true)

    // Build 6-month labels
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      return {
        label: format(d, 'MMM'),
        start: format(startOfMonth(d), 'yyyy-MM-dd'),
        end:   format(endOfMonth(d),   'yyyy-MM-dd'),
      }
    })

    const today = format(new Date(), 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

    const gymStats = await Promise.all(
      gyms.map(async (gym) => {
        const gymId = gym.id
        const [memberRes, payRes, attRes, pendingRes] = await Promise.all([
          supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'active'),
          supabase.from('payments').select('amount').eq('gym_id', gymId).gte('payment_date', monthStart).lte('payment_date', today),
          supabase.from('attendance').select('date').eq('gym_id', gymId).gte('date', monthStart),
          supabase.from('memberships').select('plans(price)').eq('gym_id', gymId).eq('status', 'active').lt('end_date', today),
        ])
        const revenue   = (payRes.data || []).reduce((s, p) => s + (p.amount || 0), 0)
        const members   = memberRes.count || 0
        const attDays   = new Set((attRes.data || []).map((r) => r.date)).size
        const avgAtt    = attDays > 0 ? Math.round((attRes.data || []).length / attDays) : 0
        const pending   = (pendingRes.data || []).reduce((s, m) => s + (m.plans?.price || 0), 0)
        return { gym: gym.name, members, revenue, avgAtt, pending }
      })
    )

    // 6-month revenue per gym
    const revByMonth = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const entry = { month: label }
        await Promise.all(
          gyms.map(async (gym, i) => {
            const { data } = await supabase
              .from('payments')
              .select('amount')
              .eq('gym_id', gym.id)
              .gte('payment_date', start)
              .lte('payment_date', end)
            entry[`gym${i}`] = (data || []).reduce((s, p) => s + (p.amount || 0), 0)
          })
        )
        return entry
      })
    )

    setStats(gymStats)
    setRevData(revByMonth)
    setLoading(false)
  }

  if (!gyms.length) return null

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBox className="h-12 w-full" />
        <SkeletonBox className="h-12 w-full" />
        <SkeletonBox className="h-12 w-full" />
        <SkeletonBox className="h-44 w-full mt-4" />
      </div>
    )
  }

  const bestIdx = stats.reduce((best, s, i) => (s.revenue > (stats[best]?.revenue || 0) ? i : best), 0)

  return (
    <div className="space-y-5">
      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100">
              {['Gym', 'Members', 'Revenue (this month)', 'Avg daily attendance', 'Pending fees'].map((h) => (
                <th key={h} className="pb-2.5 px-2 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stats.map((row, i) => (
              <tr key={row.gym} className={i === bestIdx ? 'bg-primary-light/40' : 'hover:bg-gray-50'}>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: GYM_COLORS[i] }} />
                    <span className="font-medium text-gray-800 whitespace-nowrap">{row.gym}</span>
                    {i === bestIdx && <span className="badge-purple text-[9px] py-0 px-1.5">Top</span>}
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-700">{row.members}</td>
                <td className="py-3 px-2 font-medium text-gray-800">{formatCurrency(row.revenue)}</td>
                <td className="py-3 px-2 text-gray-600">{row.avgAtt}/day</td>
                <td className="py-3 px-2 text-danger-dark">{formatCurrency(row.pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multi-line revenue chart */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-3">Revenue trend — all gyms</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis hide />
            <Tooltip
              formatter={(v, key) => {
                const idx = parseInt(key.replace('gym', ''))
                return [formatCurrency(v), gyms[idx]?.name || key]
              }}
              contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Legend
              formatter={(value) => {
                const idx = parseInt(value.replace('gym', ''))
                return <span style={{ fontSize: 11, color: '#374151' }}>{gyms[idx]?.name || value}</span>
              }}
            />
            {gyms.map((_, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`gym${i}`}
                stroke={GYM_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
