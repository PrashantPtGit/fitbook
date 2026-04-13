import { useState } from 'react'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { DIET_TEMPLATES } from '../../data/dietTemplates'

const GOALS = [
  { value: 'weight_loss',   label: 'Weight Loss',   emoji: '🔥' },
  { value: 'muscle_gain',   label: 'Muscle Gain',   emoji: '💪' },
  { value: 'maintenance',   label: 'Maintenance',   emoji: '⚖️' },
]

const DIET_TYPES = [
  { value: 'veg',     label: 'Vegetarian', emoji: '🥦' },
  { value: 'non_veg', label: 'Non-Veg',    emoji: '🍗' },
  { value: 'vegan',   label: 'Vegan',      emoji: '🌱' },
]

export default function DietPlanGenerator({ memberId, memberName, onPlanGenerated }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [goal,     setGoal]     = useState('weight_loss')
  const [dietType, setDietType] = useState('non_veg')
  const [saving,   setSaving]   = useState(false)

  function handleGenerate() {
    const key  = `${goal}_${dietType}`
    const tmpl = DIET_TEMPLATES[key]
    if (!tmpl) { toast.error('Template not available yet'); return }
    onPlanGenerated({ ...tmpl, goal, dietType, memberId, memberName })
  }

  async function handleSave(plan) {
    if (!supabaseReady || !memberId) { toast.error('Select a member first'); return }
    setSaving(true)
    const { error } = await supabase.from('diet_plans').insert({
      gym_id:    activeGymId,
      member_id: memberId,
      goal,
      diet_type: dietType,
      calories:  plan.calories,
      plan_json: plan,
    })
    if (error) toast.error('Could not save plan')
    else       toast.success('Plan saved for ' + memberName)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Goal */}
      <div className="form-group">
        <label className="label">Goal</label>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`rounded-btn border py-3 text-xs font-medium text-center transition-all ${
                goal === g.value
                  ? 'border-primary bg-primary-light text-primary-dark'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-0.5">{g.emoji}</div>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diet type */}
      <div className="form-group">
        <label className="label">Food preference</label>
        <div className="grid grid-cols-3 gap-2">
          {DIET_TYPES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDietType(d.value)}
              className={`rounded-btn border py-3 text-xs font-medium text-center transition-all ${
                dietType === d.value
                  ? 'border-success bg-success-light text-success-dark'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-0.5">{d.emoji}</div>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Zap size={15} />
        Generate diet plan
      </button>

      {memberId && (
        <p className="text-xs text-gray-400 text-center">
          Generating for <span className="font-medium text-gray-600">{memberName}</span>
        </p>
      )}
    </div>
  )
}
