import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { SkeletonBox } from '../ui/Skeleton'

const COLORS = ['#534AB7', '#1D9E75', '#BA7517', '#A32D2D', '#AFA9EC']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { plan, count, percentage } = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-btn shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{plan}</p>
      <p className="text-gray-400">{count} members · {percentage}%</p>
    </div>
  )
}

function CenterLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-6" fontSize={22} fontWeight={600} fill="#1f2937">{total}</tspan>
      <tspan x={cx} dy={18} fontSize={10} fill="#9ca3af">members</tspan>
    </text>
  )
}

export default function PlanBreakdown({ data = [], loading = false }) {
  const total = data.reduce((s, d) => s + d.count, 0)

  if (loading) return <SkeletonBox className="h-52 w-full" />

  if (!data.length || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <PieIcon size={32} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-400">No membership data yet</p>
      </div>
    )
  }

  return (
    <div>
      {/* Donut chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="plan"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label via SVG overlay isn't trivial with ResponsiveContainer, so use absolute */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 leading-none">{total}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">members</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-1 space-y-1.5">
        {data.map((item, i) => (
          <div key={item.plan} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-gray-700 truncate max-w-[140px]">{item.plan}</span>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-gray-800 font-medium">{item.count}</span>
              <span className="text-gray-400 w-8 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
