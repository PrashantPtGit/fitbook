import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid,
} from 'recharts'
import { Users } from 'lucide-react'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonBox } from '../ui/Skeleton'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { month, total } = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-btn shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{total} members</p>
      <p className="text-gray-400">{month}</p>
    </div>
  )
}

export default function MemberGrowthChart({ gymId: propGymId }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gymId = propGymId !== undefined ? propGymId : activeGymId

  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    fetchData()
  }, [gymId])

  async function fetchData() {
    setLoading(true)
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      months.push({ date: d, label: format(d, 'MMM yy'), end: format(endOfMonth(d), 'yyyy-MM-dd') })
    }

    // Fetch members joined up to each month-end (cumulative)
    const results = await Promise.all(
      months.map(async ({ label, end }) => {
        let q = supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', end + 'T23:59:59')
        if (gymId) q = q.eq('gym_id', gymId)
        const { count } = await q
        return { month: label, total: count || 0 }
      })
    )
    setData(results)
    setLoading(false)
  }

  if (loading) return <SkeletonBox className="h-44 w-full" />

  if (!data.length || data.every((d) => d.total === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <Users size={32} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-400">No member data yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#534AB7" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis hide domain={[0, (max) => max + 5]} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#534AB7"
          strokeWidth={2}
          fill="url(#mgGrad)"
          dot={{ r: 3, fill: '#534AB7', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
