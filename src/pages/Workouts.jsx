import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Dumbbell, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import WorkoutPlanCard from '../components/workouts/WorkoutPlanCard'
import ExerciseCard from '../components/workouts/ExerciseCard'
import { supabase } from '../lib/supabase'
import { useActiveGym } from '../store/useGymStore'
import { generateWhatsAppLink } from '../utils/helpers'
import { WORKOUT_TEMPLATES, GOALS, LEVELS } from '../data/workoutTemplates'

const LEVEL_STYLE = {
  beginner:     { bg: '#D1FAE5', text: '#065F46' },
  intermediate: { bg: '#FEF3C7', text: '#92400E' },
  advanced:     { bg: '#FEE2E2', text: '#991B1B' },
}

export default function Workouts() {
  const navigate = useNavigate()
  const { activeGymId } = useActiveGym()

  const [tab,           setTab]           = useState('plans')
  const [members,       setMembers]       = useState([])
  const [selectedId,    setSelectedId]    = useState('')
  const [plans,         setPlans]         = useState([])
  const [plansLoading,  setPlansLoading]  = useState(false)
  const [memberSearch,  setMemberSearch]  = useState('')
  const [viewPlan,      setViewPlan]      = useState(null)

  // Load members once
  useEffect(() => {
    if (!activeGymId) return
    supabase
      .from('members')
      .select('id, name, member_code')
      .eq('gym_id', activeGymId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setMembers(data || []))
  }, [activeGymId])

  // Load plans when member changes
  useEffect(() => {
    if (!selectedId) { setPlans([]); return }
    setPlansLoading(true)
    supabase
      .from('workout_plans')
      .select('*')
      .eq('member_id', selectedId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { toast.error('Could not load plans'); console.error(error) }
        setPlans(data || [])
        setPlansLoading(false)
      })
  }, [selectedId])

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.member_code?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members

  async function handleSendToMember(plan) {
    const { data: member } = await supabase
      .from('members')
      .select('name, phone, whatsapp')
      .eq('id', plan.member_id)
      .single()
    if (!member?.phone) { toast.error('No phone number for this member'); return }
    const msg = `Hi ${member.name}! 💪\n\nYour workout plan *${plan.name}* is ready.\n\nGoal: ${plan.goal || '—'} | Level: ${plan.level || '—'} | ${plan.days_per_week || 3} days/week\n\nOpen FitBook to view your full plan.\n\n— Your Trainer`
    window.open(generateWhatsAppLink(member.whatsapp || member.phone, msg), '_blank')
  }

  async function toggleActive(plan) {
    const { error } = await supabase
      .from('workout_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id)
    if (error) { toast.error('Update failed'); return }
    setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, is_active: !plan.is_active } : p))
    toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated')
  }

  return (
    <AppLayout pageTitle="Workout Plans" pageSubtitle="Create and manage workout plans for members">
      {/* Header action */}
      <div className="flex items-center justify-end mb-5">
        <button
          onClick={() => navigate('/workouts/create')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1D9E75' }}
        >
          <Plus size={15} /> Create plan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
        {[
          { key: 'plans',     label: 'Member plans'  },
          { key: 'templates', label: 'Templates'     },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'white' : 'transparent',
              color:      tab === key ? '#111827' : '#6B7280',
              boxShadow:  tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: MEMBER PLANS ─────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div>
          {/* Member selector */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select member</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8"
                placeholder="Search members…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="text-left px-3 py-2 rounded-lg text-sm border-2 transition-all truncate"
                  style={{
                    borderColor: selectedId === m.id ? '#1D9E75' : '#E5E7EB',
                    background:  selectedId === m.id ? '#E1F5EE' : 'white',
                    color:       selectedId === m.id ? '#1D9E75' : '#374151',
                    fontWeight:  selectedId === m.id ? 600 : 400,
                  }}
                >
                  {m.name}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="col-span-3 text-sm text-gray-400 text-center py-3">No members found</p>
              )}
            </div>
          </div>

          {/* Plans list */}
          {!selectedId ? (
            <div className="text-center py-16 text-gray-400">
              <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a member to view their workout plans</p>
            </div>
          ) : plansLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Dumbbell size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700 mb-1">No plans yet</p>
              <p className="text-xs text-gray-400 mb-4">Create a workout plan for {members.find((m) => m.id === selectedId)?.name}</p>
              <button
                onClick={() => navigate('/workouts/create')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1D9E75' }}
              >
                <Plus size={14} /> Create plan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <WorkoutPlanCard
                  key={plan.id}
                  plan={plan}
                  onView={() => setViewPlan(plan)}
                  onEdit={() => navigate('/workouts/create', { state: { editPlan: plan } })}
                  onSend={() => handleSendToMember(plan)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TEMPLATES ────────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {WORKOUT_TEMPLATES.map((t) => {
            const goalData   = GOALS.find((g) => g.value === t.goal)
            const levelStyle = LEVEL_STYLE[t.level] || LEVEL_STYLE.beginner
            const totalEx    = t.days.reduce((s, d) => s + d.exercises.length, 0)

            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
                    {goalData?.emoji || '🏋️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: levelStyle.bg, color: levelStyle.text }}>
                    {t.level}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {t.daysPerWeek}×/week
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                    {goalData?.emoji} {t.goal}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                    {totalEx} exercises
                  </span>
                </div>

                {/* Day breakdown */}
                <div className="space-y-1 mb-3">
                  {t.days.map((d, di) => (
                    <div key={di} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-4 h-4 rounded bg-green-50 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {di + 1}
                      </span>
                      <span className="truncate">{d.dayName} · {d.exercises.length} exercises</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/workouts/create', { state: { template: t } })}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#1D9E75' }}
                >
                  Use this template →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VIEW PLAN MODAL ───────────────────────────────────────────────── */}
      {viewPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setViewPlan(null)}>
          <div
            className="bg-white w-full sm:w-[560px] sm:max-h-[85vh] max-h-[90vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{viewPlan.name}</p>
                <p className="text-xs text-gray-400">{viewPlan.goal} · {viewPlan.level} · {viewPlan.days_per_week}×/week</p>
              </div>
              <button onClick={() => setViewPlan(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(viewPlan.plan_data?.days || []).map((day, di) => (
                <div key={di} className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-100">
                    <p className="text-xs font-semibold text-gray-700">{day.dayName}</p>
                  </div>
                  <div className="px-3 divide-y divide-gray-100">
                    {(day.exercises || []).map((ex, ei) => (
                      <ExerciseCard
                        key={ei}
                        exercise={ex}
                        sets={ex.sets}
                        reps={ex.reps}
                        rest={ex.rest}
                        showAddButton={false}
                        compact
                      />
                    ))}
                    {(day.exercises || []).length === 0 && (
                      <p className="py-3 text-xs text-gray-400">No exercises</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
