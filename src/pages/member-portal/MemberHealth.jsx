import { useState } from 'react'
import { Dumbbell, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { calculateBMI, generateWhatsAppLink } from '../../utils/helpers'
import { supabase, supabaseReady } from '../../lib/supabase'

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

      {/* Workout plan placeholder */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Dumbbell size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Workout Plan</p>
        <p className="text-xs text-gray-400 mb-3">Coming in Part 14 — personalised workout plans from your trainer.</p>
        {member?.trainers?.phone && (
          <a
            href={generateWhatsAppLink(member.trainers.phone, `Hi, can you create a workout plan for me? - ${member.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-btn hover:bg-green-100 transition-colors"
          >
            <MessageCircle size={12} /> Ask your trainer
          </a>
        )}
      </div>
    </MemberPortalLayout>
  )
}
