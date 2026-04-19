import { useState, useEffect } from 'react'
import { Dumbbell, MessageCircle, ChevronDown, ChevronUp, Play, Utensils } from 'lucide-react'

function YtIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
    </svg>
  )
}
import toast from 'react-hot-toast'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { calculateBMI, generateWhatsAppLink } from '../../utils/helpers'
import { supabase, supabaseReady } from '../../lib/supabase'
import { getYouTubeSearchUrl } from '../../lib/exerciseDB'

function BMIGauge({ bmi, category, color }) {
  // 15–40 range
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))
  return (
    <div>
      <div className="flex items-end gap-3 mb-3">
        <p className="text-5xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#1D9E75' }}>
          {bmi}
        </p>
        <div className="mb-2">
          <p className={`text-sm font-semibold ${color}`}>{category}</p>
          <p className="text-xs text-gray-400">BMI score</p>
        </div>
      </div>
      {/* Gauge bar */}
      <div className="relative h-3 rounded-full mb-1 overflow-hidden"
        style={{ background: 'linear-gradient(to right, #3b82f6, #1D9E75, #BA7517, #A32D2D)' }}>
        <div
          className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-gray-600 -translate-x-1/2"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400">
        <span>15</span><span>18.5</span><span>23</span><span>25</span><span>30</span><span>40</span>
      </div>
    </div>
  )
}

function DietPlanViewer({ memberId, trainerPhone, memberName }) {
  const [plan,         setPlan]         = useState(null)
  const [planLoading,  setPlanLoading]  = useState(true)
  const [expandedMeal, setExpandedMeal] = useState(0)

  useEffect(() => {
    if (!memberId) return
    supabase
      .from('diet_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setPlan(data); setPlanLoading(false) })
  }, [memberId])

  const waLink = trainerPhone
    ? generateWhatsAppLink(trainerPhone, `Hi, can you create a diet plan for me? - ${memberName}`)
    : null

  if (planLoading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <Utensils size={22} className="text-orange-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">No diet plan yet</p>
        <p className="text-xs text-gray-400 mb-3">Your trainer hasn't assigned a diet plan yet.</p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-btn hover:bg-green-100 transition-colors"
          >
            <MessageCircle size={12} /> Ask your trainer
          </a>
        )}
      </div>
    )
  }

  const meals = plan.plan_data?.meals || []

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <div className="p-4 border-b border-gray-50" style={{ borderLeft: '3px solid #F97316' }}>
        <p className="text-xs text-gray-400 mb-0.5">Your diet plan</p>
        <p className="text-base font-bold text-gray-800">{plan.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {plan.goal && (
            <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">{plan.goal}</span>
          )}
          {plan.calories_target && (
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{plan.calories_target} kcal/day</span>
          )}
        </div>
        {(plan.protein_g || plan.carbs_g || plan.fat_g) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {plan.protein_g && <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Protein: {plan.protein_g}g</span>}
            {plan.carbs_g   && <span className="text-[11px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Carbs: {plan.carbs_g}g</span>}
            {plan.fat_g     && <span className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">Fat: {plan.fat_g}g</span>}
          </div>
        )}
      </div>

      {/* Meal list */}
      {meals.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {meals.map((meal, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === i ? -1 : i)}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{meal.name}</p>
                  {meal.time && <p className="text-xs text-gray-400">{meal.time}</p>}
                </div>
                {expandedMeal === i ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
              </button>
              {expandedMeal === i && (meal.items || []).length > 0 && (
                <div className="px-4 pb-3 space-y-1.5">
                  {meal.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{item.name}</p>
                        {item.quantity && <p className="text-[10px] text-gray-400">{item.quantity}</p>}
                      </div>
                      <div className="text-right">
                        {item.calories && <p className="text-xs font-semibold text-gray-700">{item.calories} kcal</p>}
                        {item.protein  && <p className="text-[10px] text-gray-400">{item.protein}g protein</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">No meals listed in this plan</p>
      )}

      {plan.notes && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 bg-amber-50 rounded-lg p-2.5">📝 {plan.notes}</p>
        </div>
      )}
    </div>
  )
}

function WorkoutPlanViewer({ memberId, trainerPhone, memberName }) {
  const [plan,        setPlan]        = useState(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(0)

  useEffect(() => {
    if (!memberId) return
    supabase
      .from('workout_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setPlan(data)
        setPlanLoading(false)
      })
  }, [memberId])

  const waLink = trainerPhone
    ? generateWhatsAppLink(trainerPhone, `Hi, can you create a workout plan for me? - ${memberName}`)
    : null

  if (planLoading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Dumbbell size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">No workout plan yet</p>
        <p className="text-xs text-gray-400 mb-3">Your trainer hasn't assigned a plan yet.</p>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-btn hover:bg-green-100 transition-colors"
          >
            <MessageCircle size={12} /> Ask your trainer
          </a>
        )}
      </div>
    )
  }

  const days = plan.plan_data?.days || []

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Plan header */}
      <div className="p-4 border-b border-gray-50" style={{ borderLeft: '3px solid #1D9E75' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Your workout plan</p>
            <p className="text-base font-bold text-gray-800">{plan.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {plan.goal}
              </span>
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {plan.level}
              </span>
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {plan.days_per_week}×/week
              </span>
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shrink-0"
            style={{ background: '#1D9E75' }}
            onClick={() => toast('Let\'s go! 💪', { icon: '🏋️' })}
          >
            <Play size={11} /> Start
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 p-3 overflow-x-auto scrollbar-none border-b border-gray-50">
        {days.map((_, i) => (
          <button
            key={i}
            onClick={() => setExpandedDay(i)}
            className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: expandedDay === i ? '#1D9E75' : '#F3F4F6',
              color:      expandedDay === i ? 'white'    : '#6B7280',
            }}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      {/* Active day exercises */}
      {days[expandedDay] && (
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-600 mb-3">{days[expandedDay].dayName}</p>
          <div className="space-y-2">
            {(days[expandedDay].exercises || []).map((ex, ei) => (
              <ExerciseRow key={ei} exercise={ex} />
            ))}
            {(days[expandedDay].exercises || []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No exercises for this day</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseRow({ exercise }) {
  const [imgErr, setImgErr] = useState(!exercise.gifUrl)
  const [open,   setOpen]   = useState(false)

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
          {!imgErr && exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <Dumbbell size={18} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{exercise.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {exercise.sets} sets × {exercise.reps}
            {exercise.rest > 0 ? ` · ${exercise.rest}s rest` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={getYouTubeSearchUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            title="Watch on YouTube"
          >
            <YtIcon size={12} />
          </a>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded GIF + notes */}
      {open && (
        <div className="px-3 pb-3 border-t border-gray-50 pt-3">
          {!imgErr && exercise.gifUrl && (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-full max-w-xs mx-auto rounded-xl mb-3"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
              onError={() => setImgErr(true)}
            />
          )}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Sets</p>
              <p className="text-sm font-bold text-gray-800">{exercise.sets}</p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Reps</p>
              <p className="text-sm font-bold text-gray-800">{exercise.reps}</p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Rest</p>
              <p className="text-sm font-bold text-gray-800">{exercise.rest > 0 ? `${exercise.rest}s` : '—'}</p>
            </div>
          </div>
          {exercise.notes && (
            <p className="text-xs text-gray-500 bg-amber-50 rounded-lg p-2">📝 {exercise.notes}</p>
          )}
          <a
            href={getYouTubeSearchUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <YtIcon size={13} /> Watch tutorial on YouTube
          </a>
        </div>
      )}
    </div>
  )
}

export default function MemberHealth() {
  const { member, loading } = useMemberPortal()

  const [height,   setHeight]   = useState('')
  const [weight,   setWeight]   = useState('')
  const [age,      setAge]      = useState('')
  const [gender,   setGender]   = useState('male')
  const [activity, setActivity] = useState('moderate')
  const [saving,   setSaving]   = useState(false)

  const bmiResult = height && weight
    ? calculateBMI(
        parseFloat(weight),
        parseFloat(height),
        parseInt(age) || 25,
        gender,
        activity
      )
    : null

  async function handleSave() {
    if (!bmiResult || !member) return
    if (!supabaseReady) { toast.error('Supabase not configured'); return }
    setSaving(true)
    const { error } = await supabase.from('measurements').insert({
      member_id: member.id,
      gym_id:    member.gym_id,
      date:      new Date().toISOString().split('T')[0],
      weight_kg: parseFloat(weight),
      height_cm: parseFloat(height),
      bmi:       bmiResult.bmi,
    })
    setSaving(false)
    if (error) toast.error('Could not save measurement')
    else toast.success('Measurement saved!')
  }

  const waLink = member?.phone
    ? generateWhatsAppLink(member.phone, bmiResult
        ? `My BMI update: ${bmiResult.bmi} (${bmiResult.category}). Height: ${height}cm, Weight: ${weight}kg. Calories needed: ${bmiResult.tdee}/day.`
        : 'My FitBook health update'
      )
    : null

  if (loading) {
    return (
      <MemberPortalLayout title="Health">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl h-40" />)}
        </div>
      </MemberPortalLayout>
    )
  }

  return (
    <MemberPortalLayout title="Health">
      {/* BMI Calculator */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100" style={{ borderLeft: '3px solid #1D9E75' }}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">BMI Calculator</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 170"
              className="input"
            />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 70"
              className="input"
            />
          </div>
          <div>
            <label className="label">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="input"
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Activity level</label>
          <select className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="sedentary">Sedentary (no exercise)</option>
            <option value="light">Light (1-3 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="very_active">Very active (twice/day)</option>
          </select>
        </div>

        {bmiResult && (
          <div className="mb-4">
            <BMIGauge bmi={bmiResult.bmi} category={bmiResult.category} color={bmiResult.color} />

            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Ideal weight',   value: `${bmiResult.idealWeightMin}–${bmiResult.idealWeightMax} kg` },
                { label: 'Daily calories', value: `${bmiResult.tdee} kcal`                                     },
                { label: 'Protein target', value: `${bmiResult.protein} g/day`                                 },
                { label: 'Water intake',   value: `${bmiResult.water} L/day`                                   },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-btn disabled:opacity-60 transition-colors"
                style={{ background: '#1D9E75' }}
              >
                {saving ? 'Saving…' : 'Save measurement'}
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-btn hover:bg-green-100 transition-colors"
                >
                  <MessageCircle size={14} /> Share
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diet Plan */}
      {member && (
        <DietPlanViewer
          memberId={member.id}
          trainerPhone={member.trainers?.phone}
          memberName={member.name}
        />
      )}

      {/* Workout Plan */}
      {member && (
        <WorkoutPlanViewer
          memberId={member.id}
          trainerPhone={member.trainers?.phone}
          memberName={member.name}
        />
      )}
    </MemberPortalLayout>
  )
}
