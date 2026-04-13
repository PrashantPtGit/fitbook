import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import { BarChart2 } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import { SkeletonBox } from '../ui/Skeleton'

function CustomLabel({ x, y, width, value }) {
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 5} fill="#534AB7" fontSize={10} textAnchor="middle">
      {formatCurrency(value)}
    </text>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { month, amount } = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-btn shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{formatCurrency(amount)}</p>
      <p className="text-gray-400">{month}</p>
    </div>
  )
}

export default function RevenueChart({ data = [], loading = false }) {
  const currentMonthIdx = data.length - 1
  const amounts = data.map((d) => d.amount)
  const sum = amounts.reduce((a, b) => a + b, 0)
  const avg = data.length ? Math.round(sum / data.length) : 0
  const maxAmt = Math.max(...amounts, 0)
  const bestIdx = amounts.lastIndexOf(maxAmt)
  const bestMonth = maxAmt > 0 ? data[bestIdx] : null

  const half = Math.floor(data.length / 2)
  const recentSum = data.slice(half).reduce((a, b) => a + b.amount, 0)
  const prevSum = data.slice(0, half).reduce((a, b) => a + b.amount, 0)
  const growth = prevSum > 0 ? Math.round(((recentSum - prevSum) / prevSum) * 100) : 0

  if (loading) return <SkeletonBox className="h-56 w-full" />

  if (data.every((d) => d.amount === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <BarChart2 size={36} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-400">No revenue data yet</p>
        <p className="text-xs text-gray-300 mt-1">Payments will appear here once recorded</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="35%" margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis hide domain={[0, (max) => max * 1.2]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            <LabelList content={<CustomLabel />} />
            {data.map((_, i) => (
              <Cell key={i} fill={i === currentMonthIdx ? '#534AB7' : '#AFA9EC'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {bestMonth && (
          <span className="text-xs bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium">
            Best: {bestMonth.month} — {formatCurrency(bestMonth.amount)}
          </span>
        )}
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          Avg: {formatCurrency(avg)}/month
        </span>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          growth >= 0 ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'
        }`}>
          {growth >= 0 ? '+' : ''}{growth}% vs prev 3 months
        </span>
      </div>
    </div>
  )
}
