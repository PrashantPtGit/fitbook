import { Eye, Edit2, Send, Dumbbell } from 'lucide-react'
import { GOALS, LEVELS } from '../../data/workoutTemplates'

const LEVEL_STYLE = {
  beginner:     { bg: '#D1FAE5', text: '#065F46' },
  intermediate: { bg: '#FEF3C7', text: '#92400E' },
  advanced:     { bg: '#FEE2E2', text: '#991B1B' },
}

export default function WorkoutPlanCard({ plan, onView, onEdit, onSend }) {
  const goalData  = GOALS.find((g) => g.value === plan.goal)
  const levelStyle = LEVEL_STYLE[plan.level] || LEVEL_STYLE.beginner
  const exerciseCount = Array.isArray(plan.plan_data?.days)
    ? plan.plan_data.days.reduce((sum, d) => sum + (d.exercises?.length || 0), 0)
    : 0

  const createdAt = plan.created_at
    ? new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#E1F5EE' }}>
            <Dumbbell size={16} style={{ color: '#1D9E75' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{plan.name}</p>
            {createdAt && <p className="text-[10px] text-gray-400 mt-0.5">Created {createdAt}</p>}
          </div>
        </div>
        {plan.is_active ? (
          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Active</span>
        ) : (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Inactive</span>
        )}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {goalData && (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-50 text-gray-600">
            {goalData.emoji} {plan.goal}
          </span>
        )}
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ background: levelStyle.bg, color: levelStyle.text }}
        >
          {plan.level}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          {plan.days_per_week}×/week
        </span>
        {exerciseCount > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
            {exerciseCount} exercises
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
        {onView && (
          <button onClick={onView} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <Eye size={12} /> View
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <Edit2 size={12} /> Edit
          </button>
        )}
        {onSend && (
          <button onClick={onSend} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white transition-colors ml-auto" style={{ background: '#1D9E75' }}>
            <Send size={12} /> Send to member
          </button>
        )}
      </div>
    </div>
  )
}
