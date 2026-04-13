import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import BMICalculator from '../components/health/BMICalculator'
import BodyLog from '../components/health/BodyLog'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card mb-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Health() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [members,        setMembers]        = useState([])
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase
      .from('members')
      .select('id, name, member_code')
      .eq('gym_id', activeGymId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setMembers(data || []))
  }, [activeGymId])

  const member = members.find((m) => m.id === selectedMember)

  return (
    <AppLayout pageTitle="Health Tools" pageSubtitle="BMI calculator & body measurements">

      {/* Member selector */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 form-group">
            <label className="label">Member (optional — for body log)</label>
            <select
              value={selectedMember || ''}
              onChange={(e) => setSelectedMember(e.target.value || null)}
              className="input"
            >
              <option value="">— Select a member —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.member_code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BMI Calculator */}
      <SectionCard
        title="BMI & Nutrition Calculator"
        subtitle="Uses Indian BMI thresholds — Mifflin-St Jeor formula for calorie needs"
      >
        <BMICalculator />
      </SectionCard>

      {/* Body Measurements Log */}
      <SectionCard
        title="Body Measurements Log"
        subtitle="Track weight, chest, waist, hips, arms, thighs over time"
      >
        <BodyLog memberId={selectedMember} memberName={member?.name} />
      </SectionCard>

    </AppLayout>
  )
}
