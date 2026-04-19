/*
 * SQL — run once in Supabase SQL editor:
 *
 * create table workout_plans (
 *   id uuid default gen_random_uuid() primary key,
 *   gym_id uuid references gyms(id) on delete cascade,
 *   member_id uuid references members(id) on delete cascade,
 *   created_by uuid references auth.users(id),
 *   created_at timestamptz default now(),
 *   name text not null,
 *   goal text,
 *   level text check (level in ('beginner', 'intermediate', 'advanced')),
 *   days_per_week int default 3,
 *   plan_data jsonb,
 *   is_active boolean default true
 * );
 *
 * create table workout_exercises (
 *   id uuid default gen_random_uuid() primary key,
 *   workout_plan_id uuid references workout_plans(id) on delete cascade,
 *   day_number int,
 *   exercise_id text,
 *   exercise_name text,
 *   body_part text,
 *   equipment text,
 *   gif_url text,
 *   youtube_url text,
 *   sets int default 3,
 *   reps text default '10-12',
 *   rest_seconds int default 60,
 *   notes text,
 *   order_index int
 * );
 *
 * alter table workout_plans    enable row level security;
 * alter table workout_exercises enable row level security;
 * create policy "Auth access" on workout_plans    for all using (auth.role() = 'authenticated');
 * create policy "Auth access" on workout_exercises for all using (auth.role() = 'authenticated');
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Search, Check, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import ExerciseCard from '../components/workouts/ExerciseCard'
import { supabase } from '../lib/supabase'
import { useActiveGym } from '../store/useGymStore'
import { getExercisesByBodyPart, searchExercises } from '../lib/exerciseDB'
import { WORKOUT_TEMPLATES, GOALS, LEVELS, BODY_PARTS } from '../data/workoutTemplates'

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
]

function StepDot({ n, current, label }) {
  const done   = current > n
  const active = current === n
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: done ? '#1D9E75' : active ? '#E1F5EE' : '#F3F4F6',
          color:      done ? '#fff'    : active ? '#1D9E75' : '#9CA3AF',
          border:     active ? '2px solid #1D9E75' : '2px solid transparent',
        }}
      >
        {done ? <Check size={12} /> : n}
      </div>
      <span className={`text-xs hidden sm:block ${active ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

export default function CreateWorkoutPlan() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { activeGymId } = useActiveGym()
  const prefillTemplate = location.state?.template || null

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)

  // Step 1 — basics
  const [members,        setMembers]        = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [planName,       setPlanName]       = useState('')
  const [goal,           setGoal]           = useState('')
  const [level,          setLevel]          = useState('')
  const [daysPerWeek,    setDaysPerWeek]    = useState(3)

  // Step 2 — exercises per day
  const [activeDay,      setActiveDay]      = useState(0)
  const [days,           setDays]           = useState([])

  // Exercise picker
  const [pickerOpen,     setPickerOpen]     = useState(false)
  const [bodyPart,       setBodyPart]       = useState('chest')
  const [exercises,      setExercises]      = useState([])
  const [exLoading,      setExLoading]      = useState(false)
  const [searchQ,        setSearchQ]        = useState('')
  const [searchTimer,    setSearchTimer]    = useState(null)

  // Sets/reps modal
  const [pendingEx,      setPendingEx]      = useState(null)
  const [pendingSets,    setPendingSets]    = useState(3)
  const [pendingReps,    setPendingReps]    = useState('10-12')
  const [pendingRest,    setPendingRest]    = useState(60)
  const [pendingNotes,   setPendingNotes]   = useState('')

  // Step 3 — saving
  const [saving, setSaving] = useState(false)

  // ── Load members ────────────────────────────────────────────────────────────
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

  // ── Prefill from template ───────────────────────────────────────────────────
  useEffect(() => {
    if (!prefillTemplate) return
    setPlanName(prefillTemplate.name)
    setGoal(prefillTemplate.goal)
    setLevel(prefillTemplate.level)
    setDaysPerWeek(prefillTemplate.daysPerWeek)
    setDays(prefillTemplate.days.map((d) => ({
      dayName:   d.dayName,
      exercises: d.exercises.map((e) => ({
        id:          e.id || `tmpl-${Math.random()}`,
        name:        e.name,
        bodyPart:    e.bodyPart,
        equipment:   e.equipment || '',
        gifUrl:      e.gifUrl || '',
        target:      e.target || '',
        sets:        e.sets,
        reps:        e.reps,
        rest:        e.rest || 60,
        notes:       '',
      })),
    })))
  }, [prefillTemplate])

  // ── Build day stubs when daysPerWeek changes ────────────────────────────────
  useEffect(() => {
    if (prefillTemplate) return
    setDays((prev) => {
      const arr = []
      for (let i = 0; i < daysPerWeek; i++) {
        arr.push(prev[i] || { dayName: `Day ${i + 1}`, exercises: [] })
      }
      return arr
    })
  }, [daysPerWeek])

  // ── Load exercises for body part ────────────────────────────────────────────
  useEffect(() => {
    if (!pickerOpen || searchQ) return
    setExLoading(true)
    getExercisesByBodyPart(bodyPart).then((data) => {
      setExercises(data || [])
      setExLoading(false)
    })
  }, [bodyPart, pickerOpen])

  function handleSearch(q) {
    setSearchQ(q)
    if (searchTimer) clearTimeout(searchTimer)
    if (!q.trim()) { setExercises([]); return }
    setExLoading(true)
    const t = setTimeout(() => {
      searchExercises(q).then((data) => {
        setExercises(data || [])
        setExLoading(false)
      })
    }, 400)
    setSearchTimer(t)
  }

  // ── Add exercise to current day ─────────────────────────────────────────────
  function openSetsPicker(ex) {
    setPendingEx(ex)
    setPendingSets(3)
    setPendingReps('10-12')
    setPendingRest(60)
    setPendingNotes('')
  }

  function confirmAdd() {
    if (!pendingEx) return
    const entry = {
      id:        pendingEx.id,
      name:      pendingEx.name,
      bodyPart:  pendingEx.bodyPart,
      equipment: pendingEx.equipment,
      gifUrl:    pendingEx.gifUrl,
      target:    pendingEx.target,
      sets:      pendingSets,
      reps:      pendingReps,
      rest:      pendingRest,
      notes:     pendingNotes,
    }
    setDays((prev) => {
      const next = [...prev]
      next[activeDay] = {
        ...next[activeDay],
        exercises: [...(next[activeDay].exercises || []), entry],
      }
      return next
    })
    setPendingEx(null)
  }

  function removeExercise(dayIdx, exIdx) {
    setDays((prev) => {
      const next = [...prev]
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: next[dayIdx].exercises.filter((_, i) => i !== exIdx),
      }
      return next
    })
  }

  function updateDayName(idx, name) {
    setDays((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], dayName: name }
      return next
    })
  }

  // ── Save plan ───────────────────────────────────────────────────────────────
  async function savePlan() {
    if (!selectedMember) { toast.error('Select a member'); return }
    if (!planName.trim()) { toast.error('Enter a plan name'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const planData = {
        gym_id:       activeGymId,
        member_id:    selectedMember.id,
        created_by:   user?.id,
        name:         planName.trim(),
        goal,
        level,
        days_per_week: daysPerWeek,
        is_active:    true,
        plan_data:    { days },
      }

      const { data: plan, error } = await supabase
        .from('workout_plans')
        .insert(planData)
        .select()
        .single()

      if (error) throw error

      // Insert flat exercise rows
      const exerciseRows = []
      days.forEach((day, di) => {
        ;(day.exercises || []).forEach((ex, ei) => {
          exerciseRows.push({
            workout_plan_id: plan.id,
            day_number:      di + 1,
            exercise_id:     ex.id,
            exercise_name:   ex.name,
            body_part:       ex.bodyPart,
            equipment:       ex.equipment,
            gif_url:         ex.gifUrl,
            sets:            ex.sets,
            reps:            ex.reps,
            rest_seconds:    ex.rest,
            notes:           ex.notes,
            order_index:     ei,
          })
        })
      })

      if (exerciseRows.length > 0) {
        const { error: exErr } = await supabase.from('workout_exercises').insert(exerciseRows)
        if (exErr) console.warn('Exercise rows error:', exErr)
      }

      toast.success('Workout plan saved!')
      navigate('/workouts')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  // ── Check if workout_plans table exists ────────────────────────────────────
  const [tablesReady, setTablesReady] = useState(null) // null=checking, true=ok, false=missing

  useEffect(() => {
    supabase.from('workout_plans').select('id').limit(1)
      .then(({ error }) => setTablesReady(!error || error.code !== '42P01'))
  }, [])

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalExercises = days.reduce((s, d) => s + (d.exercises?.length || 0), 0)
  const step1Valid     = selectedMember && planName.trim() && goal && level

  return (
    <AppLayout pageTitle="Create Workout Plan" pageSubtitle={`Step ${step} of 3`}>
      {/* Tables missing warning */}
      {tablesReady === false && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Workout tables not set up yet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Run <span className="font-mono bg-amber-100 px-1 rounded">SUPABASE_SETUP.sql</span> in your Supabase SQL editor before saving plans.
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <StepDot n={1} current={step} label="Basics"    />
        <div className="flex-1 h-px bg-gray-200" />
        <StepDot n={2} current={step} label="Exercises" />
        <div className="flex-1 h-px bg-gray-200" />
        <StepDot n={3} current={step} label="Review"    />
      </div>

      {/* ── STEP 1: BASICS ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Member select */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Member</p>
            <select
              className="input"
              value={selectedMember?.id || ''}
              onChange={(e) => setSelectedMember(members.find((m) => m.id === e.target.value) || null)}
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.member_code}</option>
              ))}
            </select>
          </div>

          {/* Plan name */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Plan Name</p>
            <input
              className="input"
              placeholder="e.g. Arjun's Summer Cut Plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>

          {/* Goal */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Goal</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className="flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left"
                  style={{
                    borderColor: goal === g.value ? g.color : '#E5E7EB',
                    background:  goal === g.value ? g.color + '15' : 'white',
                    color:       goal === g.value ? g.color : '#374151',
                  }}
                >
                  <span className="text-lg">{g.emoji}</span>
                  {g.value}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Level</p>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: level === l.value ? l.color : '#E5E7EB',
                    background:  level === l.value ? l.color + '15' : 'white',
                    color:       level === l.value ? l.color : '#6B7280',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days/week */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Days per week</p>
            <div className="flex gap-2">
              {[3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                  style={{
                    borderColor: daysPerWeek === d ? '#1D9E75' : '#E5E7EB',
                    background:  daysPerWeek === d ? '#E1F5EE' : 'white',
                    color:       daysPerWeek === d ? '#1D9E75' : '#6B7280',
                  }}
                >
                  {d}×
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Or start from template</p>
            <div className="space-y-2">
              {WORKOUT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setPlanName(t.name)
                    setGoal(t.goal)
                    setLevel(t.level)
                    setDaysPerWeek(t.daysPerWeek)
                    setDays(t.days.map((d) => ({
                      dayName:   d.dayName,
                      exercises: d.exercises.map((e) => ({ ...e, id: e.id || `t-${Math.random()}`, gifUrl: '', equipment: '', target: '' })),
                    })))
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm shrink-0">
                    {GOALS.find((g) => g.value === t.goal)?.emoji || '🏋️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.level} · {t.daysPerWeek}×/week · {t.goal}</p>
                  </div>
                  <ChevronLeft size={14} className="text-gray-300 rotate-180 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#1D9E75' }}
          >
            Next: Build exercises →
          </button>
        </div>
      )}

      {/* ── STEP 2: EXERCISES ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeDay === i ? '#1D9E75' : '#F3F4F6',
                  color:      activeDay === i ? 'white'    : '#6B7280',
                }}
              >
                D{i + 1} {d.exercises?.length > 0 ? `(${d.exercises.length})` : ''}
              </button>
            ))}
          </div>

          {/* Current day */}
          {days[activeDay] && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  className="input flex-1"
                  value={days[activeDay].dayName}
                  onChange={(e) => updateDayName(activeDay, e.target.value)}
                  placeholder="Day name…"
                />
                <button
                  onClick={() => { setPickerOpen(true); setSearchQ(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white shrink-0"
                  style={{ background: '#1D9E75' }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {(days[activeDay].exercises || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No exercises yet</p>
                  <p className="text-xs mt-1">Tap "Add" to browse exercises</p>
                </div>
              ) : (
                <div>
                  {days[activeDay].exercises.map((ex, ei) => (
                    <ExerciseCard
                      key={ei}
                      exercise={ex}
                      sets={ex.sets}
                      reps={ex.reps}
                      rest={ex.rest}
                      showAddButton={false}
                      onRemove={() => removeExercise(activeDay, ei)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={totalExercises === 0}
              className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: '#1D9E75' }}
            >
              Review plan →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-xl p-4 border border-gray-100" style={{ borderLeft: '3px solid #1D9E75' }}>
            <p className="text-xs text-gray-400 mb-0.5">Plan summary</p>
            <p className="text-lg font-bold text-gray-900">{planName}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              For {selectedMember?.name} · {goal} · {level} · {daysPerWeek}×/week
            </p>
            <p className="text-xs text-gray-400 mt-1">{totalExercises} exercises across {days.length} days</p>
          </div>

          {/* Day-by-day breakdown */}
          {days.map((day, di) => (
            <div key={di} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700">{day.dayName}</p>
                <p className="text-[11px] text-gray-400">{day.exercises?.length || 0} exercises</p>
              </div>
              <div className="px-4 divide-y divide-gray-50">
                {(day.exercises || []).length === 0 ? (
                  <p className="py-3 text-xs text-gray-400">No exercises</p>
                ) : (
                  day.exercises.map((ex, ei) => (
                    <ExerciseCard
                      key={ei}
                      exercise={ex}
                      sets={ex.sets}
                      reps={ex.reps}
                      rest={ex.rest}
                      showAddButton={false}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              ← Edit
            </button>
            <button
              onClick={savePlan}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#1D9E75' }}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : '✓ Save plan'}
            </button>
          </div>
        </div>
      )}

      {/* ── EXERCISE PICKER MODAL ────────────────────────────────────────────── */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:items-center sm:justify-center" onClick={() => setPickerOpen(false)}>
          <div
            className="bg-white w-full sm:w-[600px] sm:max-h-[80vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-gray-800">Add exercise — {days[activeDay]?.dayName}</p>
              <button onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-8"
                  placeholder="Search exercises…"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Body part tabs (only when not searching) */}
            {!searchQ && (
              <div className="flex gap-1.5 overflow-x-auto px-4 py-2 shrink-0 scrollbar-none">
                {BODY_PARTS.map((bp) => (
                  <button
                    key={bp.key}
                    onClick={() => setBodyPart(bp.key)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: bodyPart === bp.key ? '#1D9E75' : '#F3F4F6',
                      color:      bodyPart === bp.key ? 'white'    : '#6B7280',
                    }}
                  >
                    {bp.emoji} {bp.label}
                  </button>
                ))}
              </div>
            )}

            {/* Exercise grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {exLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-green-500" />
                </div>
              ) : exercises.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {searchQ ? 'No results found' : 'Loading exercises…'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {exercises.map((ex, i) => (
                    <ExerciseCard
                      key={ex.id || i}
                      exercise={ex}
                      showAddButton
                      onAdd={() => openSetsPicker(ex)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SETS / REPS CONFIRM MODAL ────────────────────────────────────────── */}
      {pendingEx && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setPendingEx(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-800 mb-4">Configure: {pendingEx.name}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sets</label>
                  <input type="number" className="input" min="1" max="10" value={pendingSets} onChange={(e) => setPendingSets(+e.target.value)} />
                </div>
                <div>
                  <label className="label">Reps</label>
                  <input className="input" placeholder="10-12 or 30 sec" value={pendingReps} onChange={(e) => setPendingReps(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Rest between sets</label>
                <div className="flex gap-1.5">
                  {REST_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setPendingRest(r.value)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg border-2 transition-all"
                      style={{
                        borderColor: pendingRest === r.value ? '#1D9E75' : '#E5E7EB',
                        background:  pendingRest === r.value ? '#E1F5EE' : 'white',
                        color:       pendingRest === r.value ? '#1D9E75' : '#6B7280',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <input className="input" placeholder="e.g. Slow eccentric" value={pendingNotes} onChange={(e) => setPendingNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setPendingEx(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100">
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1D9E75' }}
              >
                Add exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
