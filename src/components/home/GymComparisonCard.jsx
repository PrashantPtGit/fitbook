import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { formatCurrency, getGymColor } from '../../utils/helpers'

const LEFT_BORDER = ['border-l-gym1', 'border-l-gym2', 'border-l-gym3']
const BAR_FILL    = ['#534AB7', '#1D9E75', '#BA7517']

export default function GymComparisonCard({ gym, stats = {}, gymIndex = 0, onSelect }) {
  const {
    memberCount    = 0,
    todayCheckins  = 0,
    monthlyRevenue = 0,
    pendingFees    = 0,
    sparklineData  = [],
  } = stats

  const color      = getGymColor(gymIndex)
  const borderCls  = LEFT_BORDER[gymIndex % 3]
  const barColor   = BAR_FILL[gymIndex % 3]

  return (
    <div className={`card border-l-4 ${borderCls}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{gym.name}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
            {gym.location || 'Shimla, HP'}
          </span>
        </div>
        {sparklineData.length > 0 && (
          <div className="w-16 h-10 shrink-0 ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparklineData} barCategoryGap="15%">
                <Bar dataKey="amount" fill={barColor} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="metric-card">
          <p className="metric-label">Members</p>
          <p className="text-base font-medium text-gray-900">{memberCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Today</p>
          <p className="text-base font-medium text-gray-900">{todayCheckins}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">This month</p>
          <p className="text-base font-medium text-gray-900">{formatCurrency(monthlyRevenue)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending fees</p>
          <p className={`text-base font-medium ${pendingFees > 0 ? 'text-danger' : 'text-gray-900'}`}>
            {formatCurrency(pendingFees)}
          </p>
        </div>
      </div>

      <button
        onClick={() => onSelect?.(gym.id)}
        className="w-full text-center text-xs text-primary hover:text-primary-dark font-medium py-1.5 hover:bg-primary-light rounded-btn transition-colors"
      >
        View gym →
      </button>
    </div>
  )
}
