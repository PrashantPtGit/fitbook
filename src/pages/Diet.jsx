import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import DietPlanGenerator from '../components/diet/DietPlanGenerator'
import MealPlanDisplay from '../components/diet/MealPlanDisplay'
import SavedPlansList from '../components/diet/SavedPlansList'
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

export default function Diet() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [members,        setMembers]        = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [generatedPlan,  setGeneratedPlan]  = useState(null)
  const [savedKey,       setSavedKey]       = useState(0) // bumped to refresh saved list

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

  function handlePlanGenerated(plan) {
    setGeneratedPlan({
      ...plan,
      memberId:   selectedMember,
      memberName: member?.name,
    })
    // Scroll to the generated plan
    setTimeout(() => document.getElementById('plan-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleSaved() {
    setSavedKey((k) => k + 1)
  }

  return (
    <AppLayout pageTitle="Diet Plans" pageSubtitle="Generate & save personalised meal plans for members">

      {/* Member selector */}
      <div className="card mb-5">
        <div className="form-group">
          <label className="label">Member (optional — for saving plans)</label>
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

      {/* Generator */}
      <SectionCard
        title="Generate Diet Plan"
        subtitle="Pick a goal and food preference — get an instant Indian gym diet plan"
      >
        <DietPlanGenerator
          memberId={selectedMember}
          memberName={member?.name}
          onPlanGenerated={handlePlanGenerated}
        />
      </SectionCard>

      {/* Generated plan display */}
      {generatedPlan && (
        <div id="plan-section" className="card mb-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800">Generated Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review, save or print below</p>
          </div>
          <MealPlanDisplay
            plan={generatedPlan}
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* Saved plans */}
      <SectionCard
        title="Saved Plans"
        subtitle="All diet plans saved for members of this gym"
      >
        <SavedPlansList
          key={savedKey}
          onView={(plan) => { setGeneratedPlan(plan); document.getElementById('plan-section')?.scrollIntoView({ behavior: 'smooth' }) }}
        />
      </SectionCard>

    </AppLayout>
  )
}
