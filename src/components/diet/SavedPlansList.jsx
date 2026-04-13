import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonRow } from '../ui/Skeleton'

const GOAL_LABELS = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', maintenance: 'Maintenance' }
const GOAL_BADGE  = { weight_loss: 'badge-red', muscle_gain: 'badge-purple', maintenance: 'badge-green' }
const DIET_LABELS = { veg: 'Veg', non_veg: 'Non-Veg', vegan: 'Vegan' }

export default function SavedPlansList({ onView }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }
    fetchPlans()
  }, [activeGymId])

  async function fetchPlans() {
    setLoading(true)
    const { data } = await supabase
      .from('diet_plans')
      .select('id, goal, diet_type, calories, plan_json, created_at, members(name, member_code)')
      .eq('gym_id', activeGymId)
      .order('created_at', { ascending: false })
      .limit(30)
    setPlans(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('diet_plans').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { toast.success('Plan deleted'); setPlans((p) => p.filter((x) => x.id !== id)) }
  }

  if (loading) {
    return (
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No saved plans yet. Generate a plan above and save it for a member.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Member', 'Goal', 'Food pref', 'Calories', 'Date', ''].map((h) => (
              <th key={h} className="pb-2.5 px-2 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {plans.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="py-3 px-2">
                <p className="font-medium text-gray-800 truncate max-w-[120px]">{p.members?.name || '—'}</p>
                <p className="text-[10px] text-gray-400">{p.members?.member_code}</p>
              </td>
              <td className="py-3 px-2">
                <span className={GOAL_BADGE[p.goal] || 'badge-gray'}>
                  {GOAL_LABELS[p.goal] || p.goal}
                </span>
              </td>
              <td className="py-3 px-2 text-gray-600 text-xs">{DIET_LABELS[p.diet_type] || p.diet_type}</td>
              <td className="py-3 px-2 text-gray-600 text-xs">{p.calories} kcal</td>
              <td className="py-3 px-2 text-gray-500 text-xs whitespace-nowrap">
                {p.created_at ? format(parseISO(p.created_at), 'd MMM yyyy') : '—'}
              </td>
              <td className="py-3 px-2">
                <div className="flex gap-1">
                  {p.plan_json && (
                    <button
                      onClick={() => onView?.({ ...p.plan_json, memberId: null })}
                      className="p-1.5 rounded text-gray-400 hover:text-primary transition-colors"
                      title="View plan"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded text-gray-300 hover:text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
