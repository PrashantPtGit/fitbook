import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart2 } from 'lucide-react'
import { useReports } from '../../hooks/useReports'
import { formatCurrency } from '../../utils/helpers'
import { SkeletonBox } from '../ui/Skeleton'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-card px-3 py-2 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-primary-dark">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function RevenueChart() {
  const { monthlyRevenue, loading } = useReports()
  const currentMonthAmt = monthlyRevenue[monthlyRevenue.length - 1]?.amount || 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Revenue — last 6 months</h3>
        <span className="text-xs text-gray-500">{formatCurrency(currentMonthAmt)} this month</span>
      </div>

      {loading ? (
        <SkeletonBox className="w-full h-40" />
      ) : monthlyRevenue.every((r) => r.amount === 0) ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <BarChart2 size={32} className="text-gray-200" />
          <p className="text-xs text-gray-400">No revenue data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyRevenue} barCategoryGap="35%">
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888780' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9f9f9' }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {monthlyRevenue.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === monthlyRevenue.length - 1 ? '#534AB7' : '#AFA9EC'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
