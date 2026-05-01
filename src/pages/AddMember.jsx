import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { ArrowLeft, MessageCircle, Save, Copy, Check, RefreshCw, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import PlanSelector from '../components/members/PlanSelector'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { addMember } from '../hooks/useMembers'
import { createMemberAccount } from '../scripts/createMemberAccount'
import {
  formatCurrency, formatDate, todayISO,
  generateWhatsAppLink, buildWelcomeMessage, generatePassword,
} from '../utils/helpers'

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  name:              z.string().min(2, 'Minimum 2 characters'),
  phone:             z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number'),
  date_of_birth:     z.string().optional(),
  gender:            z.string().optional(),
  address:           z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone:   z.string().optional().refine(
    (v) => !v || /^\d{10}$/.test(v), 'Must be 10 digits'
  ),
  health_notes:      z.string().optional(),
  fingerprint_id:    z.string().optional(),
  gym_id:            z.string().min(1, 'Select a gym'),
  batch_timing:      z.string().min(1, 'Select a batch'),
  trainer_id:        z.string().optional(),
  plan_id:           z.string().min(1, 'Select a plan'),
  start_date:        z.string().min(1, 'Required'),
  payment_mode:      z.string().min(1, 'Select payment mode'),
  payment_amount:    z.coerce.number().min(1, 'Enter an amount'),
  transaction_id:    z.string().optional(),
  payment_note:      z.string().optional(),
})

function Section({ title, subtitle, children, accentColor }) {
  return (
    <div
      className="card mb-4"
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-danger mt-0.5">{error.message}</p>}
    </div>
  )
}

const BATCHES = ['6-8 AM', '7-9 AM', '10-12 PM', '5-7 PM', '7-9 PM']

// ─── Success modal ────────────────────────────────────────────────────────────
function SuccessModal({ data, onAddAnother, onViewProfile }) {
  const [copied, setCopied] = useState(false)

  function copyPassword() {
    navigator.clipboard.writeText(data.password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" />
      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-success-light flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎉</span>
          </div>
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Member added successfully!
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {data.name} · <span className="font-mono font-semibold text-gray-600">{data.memberCode}</span>
          </p>
        </div>

        {/* Portal login card */}
        {data.portalCreated && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #085041)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={14} className="text-white/80" />
              <p className="text-xs font-semibold text-white/90">Portal login created</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70 text-xs">Phone</span>
                <span className="text-white font-mono text-xs">{data.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Password</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm font-bold tracking-wider">{data.password}</span>
                  <button
                    onClick={copyPassword}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-white" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-white/60 mt-3 pt-2 border-t border-white/20">
              ⚠ Save this password — it cannot be recovered later
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onAddAnother}
            className="flex-1 btn-secondary text-sm"
          >
            + Add another
          </button>
          <button
            onClick={onViewProfile}
            className="flex-1 text-sm font-semibold text-white py-2 rounded-btn transition-colors"
            style={{ background: '#1D9E75' }}
          >
            View profile
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AddMember() {
  const navigate    = useNavigate()
  const { gyms, activeGymId, userRole, userGymId } = useGymStore()

  const [trainers,    setTrainers]    = useState([])
  const [plans,       setPlans]       = useState([])
  const [submitting,  setSubmitting]  = useState(false)

  // Portal login state
  const [portalOption, setPortalOption] = useState('create')       // 'create' | 'skip'
  const [pwdMode,      setPwdMode]      = useState('auto')          // 'auto' | 'custom'
  const [generatedPwd, setGeneratedPwd] = useState(generatePassword)
  const [customPwd,    setCustomPwd]    = useState('')
  const [sendPortalWA, setSendPortalWA] = useState(false)
  const [successData,  setSuccessData]  = useState(null)
  const [newMemberId,  setNewMemberId]  = useState(null)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gym_id:         activeGymId || '',
      start_date:     todayISO(),
      payment_mode:   'upi',
      payment_amount: 0,
    },
  })

  const watchedGymId  = watch('gym_id')
  const watchedPlanId = watch('plan_id')
  const watchedStart  = watch('start_date')
  const watchedName   = watch('name')
  const watchedPhone  = watch('phone')
  const watchedMode   = watch('payment_mode')
  const watchedAmount = watch('payment_amount')

  const selectedPlan = plans.find((p) => p.id === watchedPlanId)
  const endDate      = selectedPlan && watchedStart
    ? format(addDays(new Date(watchedStart), selectedPlan.duration_days), 'yyyy-MM-dd')
    : null

  const activePassword = pwdMode === 'auto' ? generatedPwd : customPwd

  // Lock gym for co_owner / staff
  const isRestricted = userRole === 'co_owner' || userRole === 'staff'
  useEffect(() => {
    if (isRestricted && userGymId) setValue('gym_id', userGymId)
  }, [isRestricted, userGymId, setValue])

  // Fetch trainers when gym changes
  useEffect(() => {
    if (!supabaseReady || !watchedGymId) return
    supabase
      .from('trainers')
      .select('id, name')
      .eq('gym_id', watchedGymId)
      .then(({ data }) => setTrainers(data || []))
  }, [watchedGymId])

  // Fetch plans when gym changes
  useEffect(() => {
    if (!supabaseReady || !watchedGymId) return
    supabase
      .from('plans')
      .select('*')
      .eq('gym_id', watchedGymId)
      .eq('is_active', true)
      .order('duration_days')
      .then(({ data }) => {
        setPlans(data || [])
        setValue('plan_id', '')
        setValue('payment_amount', 0)
      })
  }, [watchedGymId, setValue])

  // Auto-fill amount when plan selected
  useEffect(() => {
    if (selectedPlan) setValue('payment_amount', selectedPlan.price)
  }, [selectedPlan, setValue])

  async function onSubmit(data, sendWelcomeWA = false) {
    if (!supabaseReady) { toast.error('Database not connected'); return }

    // Validate portal password if creating
    if (portalOption === 'create' && pwdMode === 'custom' && customPwd.length < 6) {
      toast.error('Portal password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    let portalCreated = false

    try {
      // 1. Add member to DB
      const result = await addMember({
        gym_id:            data.gym_id,
        name:              data.name,
        phone:             data.phone,
        whatsapp:          data.phone,
        date_of_birth:     data.date_of_birth || null,
        gender:            data.gender || null,
        address:           data.address || null,
        emergency_contact: data.emergency_contact
          ? `${data.emergency_contact}${data.emergency_phone ? ' · ' + data.emergency_phone : ''}`
          : null,
        health_notes:   data.health_notes || null,
        trainer_id:     data.trainer_id || null,
        batch_timing:   data.batch_timing,
        plan_id:        data.plan_id,
        payment_amount: data.payment_amount,
        payment_mode:   data.payment_mode,
        transaction_id: data.transaction_id || null,
        start_date:     data.start_date,
      })

      setNewMemberId(result.member.id)

      // 2. Welcome WhatsApp (if requested)
      if (sendWelcomeWA) {
        const gym = gyms.find((g) => g.id === data.gym_id)
        const msg = buildWelcomeMessage(
          data.name, gym?.name || 'the gym',
          selectedPlan?.name || '', formatDate(data.start_date),
          formatDate(endDate), data.batch_timing
        )
        window.open(generateWhatsAppLink(data.phone, msg), '_blank')
      }

      // 3. Create portal login if selected
      if (portalOption === 'create') {
        const pwd = activePassword
        const { error: portalErr } = await createMemberAccount(result.member.id, data.phone, pwd)

        if (portalErr) {
          toast.error(`Member saved, but portal login failed: ${portalErr}`)
        } else {
          portalCreated = true

          // 4. Send portal credentials via WhatsApp if checked
          if (sendPortalWA) {
            const msg = `Welcome to MLC Gym! 🏋️\n\nYour member portal login:\n📱 Phone: ${data.phone}\n🔑 Password: ${pwd}\n🔗 Login at: fitbook-tawny.vercel.app/login\n\nYou can check your attendance, membership details, and health data from your phone.\n- MLC Gym Team`
            setTimeout(() => {
              window.open(generateWhatsAppLink(data.phone, msg), '_blank')
            }, 800)
          }
        }
      }

      // 5. Show success modal
      setSuccessData({
        name:          result.member.name || data.name,
        memberCode:    result.member.member_code || '—',
        portalCreated,
        phone:         data.phone,
        password:      activePassword,
      })

    } catch (err) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  // Success modal handlers
  function handleAddAnother() {
    setSuccessData(null)
    setNewMemberId(null)
    reset({
      gym_id: isRestricted ? (userGymId || '') : (activeGymId || ''),
      start_date: todayISO(),
      payment_mode: 'upi',
      payment_amount: 0,
    })
    setGeneratedPwd(generatePassword())
    setCustomPwd('')
    setPortalOption('create')
    setPwdMode('auto')
    setSendPortalWA(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleViewProfile() {
    if (newMemberId) navigate(`/members/${newMemberId}`)
    else navigate('/members')
  }

  return (
    <AppLayout pageTitle="Add new member" pageSubtitle="Fill in details and assign a membership plan">
      {/* Back */}
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Back to members
      </button>

      <form onSubmit={handleSubmit((d) => onSubmit(d, false))}>

        {/* ── Section 1: Personal details ── */}
        <Section title="Personal details" subtitle="Basic information about the member">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required error={errors.name}>
              <input {...register('name')} placeholder="e.g. Rahul Sharma" className="input" />
            </Field>

            <Field label="WhatsApp number" required error={errors.phone}>
              <div className="flex">
                <span className="input rounded-r-none border-r-0 w-14 text-center text-gray-500 bg-gray-100">+91</span>
                <input {...register('phone')} placeholder="98765 43210" className="input rounded-l-none flex-1" maxLength={10} />
              </div>
            </Field>

            <Field label="Date of birth" error={errors.date_of_birth}>
              <input {...register('date_of_birth')} type="date" className="input" />
            </Field>

            <Field label="Gender" error={errors.gender}>
              <select {...register('gender')} className="input">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Address" error={errors.address}>
              <input {...register('address')} placeholder="Street, area, city" className="input" />
            </Field>

            <Field label="Emergency contact name" error={errors.emergency_contact}>
              <input {...register('emergency_contact')} placeholder="Name of contact person" className="input" />
            </Field>

            <Field label="Emergency contact phone" error={errors.emergency_phone}>
              <input {...register('emergency_phone')} placeholder="10-digit number" className="input" maxLength={10} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Health notes" error={errors.health_notes}>
                <textarea
                  {...register('health_notes')}
                  placeholder="Any injuries, medical conditions, allergies..."
                  rows={3}
                  className="input resize-none"
                />
              </Field>
            </div>

            <Field label="Fingerprint ID" error={errors.fingerprint_id}>
              <input {...register('fingerprint_id')} type="number" placeholder="ID from fingerprint machine (optional)" className="input" />
            </Field>
          </div>
        </Section>

        {/* ── Section 2: Gym & batch ── */}
        <Section title="Gym & batch" subtitle="Which gym and time slot">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isRestricted && (
              <Field label="Gym" required error={errors.gym_id}>
                <select {...register('gym_id')} className="input">
                  <option value="">Select gym</option>
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>{g.location || g.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Batch timing" required error={errors.batch_timing}>
              <select {...register('batch_timing')} className="input">
                <option value="">Select batch</option>
                {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Assign trainer" error={errors.trainer_id}>
              <select {...register('trainer_id')} className="input">
                <option value="">No trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Section 3: Membership plan ── */}
        <Section title="Membership plan" subtitle="Select a plan and start date">
          <PlanSelector
            plans={plans}
            selectedPlanId={watchedPlanId}
            onSelect={(id) => setValue('plan_id', id, { shouldValidate: true })}
          />
          {errors.plan_id && (
            <p className="text-xs text-danger mt-2">{errors.plan_id.message}</p>
          )}

          <div className="mt-4 w-48">
            <Field label="Start date" required error={errors.start_date}>
              <input {...register('start_date')} type="date" className="input" />
            </Field>
          </div>

          {selectedPlan && endDate && (
            <p className="text-xs text-gray-400 mt-2">
              Membership valid until <strong className="text-gray-700">{formatDate(endDate)}</strong>
            </p>
          )}
        </Section>

        {/* ── Section 4: Payment ── */}
        <Section title="Payment" subtitle="Record the fee collection">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Payment mode" required error={errors.payment_mode}>
              <select {...register('payment_mode')} className="input">
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="online">Online Transfer</option>
              </select>
            </Field>

            <Field label="Amount (₹)" required error={errors.payment_amount}>
              <input {...register('payment_amount')} type="number" className="input" />
            </Field>

            <Field label="Transaction / UPI ref ID" error={errors.transaction_id}>
              <input {...register('transaction_id')} placeholder="Optional reference number" className="input" />
            </Field>

            <Field label="Note" error={errors.payment_note}>
              <input {...register('payment_note')} placeholder="Optional note" className="input" />
            </Field>
          </div>
        </Section>

        {/* ── Section 5: Member portal login ── */}
        <Section
          title="Member portal login"
          subtitle="Member can use this to check their profile, attendance and diet plans"
          accentColor="#1D9E75"
        >
          {/* Radio options */}
          <div className="flex flex-col gap-3 mb-4">
            {[
              { value: 'create', label: 'Create portal login now', sub: 'Recommended' },
              { value: 'skip',   label: 'Skip for now',            sub: 'Can be created later from member profile' },
            ].map(({ value, label, sub }) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  portalOption === value
                    ? 'border-success bg-success-light/40'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="portalOption"
                  value={value}
                  checked={portalOption === value}
                  onChange={() => setPortalOption(value)}
                  className="mt-0.5 accent-success"
                />
                <div>
                  <p className={`text-sm font-medium ${portalOption === value ? 'text-success-dark' : 'text-gray-700'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Portal config (only when 'create' selected) */}
          {portalOption === 'create' && (
            <div className="space-y-4 pl-2">
              {/* Phone (read-only, auto-filled) */}
              <div>
                <label className="label">Login phone number</label>
                <div className="flex">
                  <span className="input rounded-r-none border-r-0 w-14 text-center text-gray-500 bg-gray-100">+91</span>
                  <input
                    type="text"
                    value={watchedPhone || ''}
                    readOnly
                    className="input rounded-l-none flex-1 bg-gray-50 text-gray-600"
                    placeholder="Auto-filled from above"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Member will login with this phone number</p>
              </div>

              {/* Password mode toggle */}
              <div>
                <label className="label">Password</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { value: 'auto',   label: 'Auto generate' },
                    { value: 'custom', label: 'Set custom'     },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPwdMode(value)}
                      className={`text-xs px-3 py-1.5 rounded-btn font-medium border transition-colors ${
                        pwdMode === value
                          ? 'border-success bg-success-light text-success-dark'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {pwdMode === 'auto' ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-btn border-2 border-dashed border-success bg-success-light/30"
                    >
                      <span className="text-lg font-bold tracking-widest text-success-dark font-mono">
                        {generatedPwd}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGeneratedPwd(generatePassword())}
                      className="p-2.5 rounded-btn border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customPwd}
                    onChange={(e) => setCustomPwd(e.target.value)}
                    placeholder="Min 6 characters"
                    className="input"
                    minLength={6}
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Note this down — you'll see it once more after saving.
                </p>
              </div>

              {/* WhatsApp checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendPortalWA}
                  onChange={(e) => setSendPortalWA(e.target.checked)}
                  className="mt-0.5 accent-success w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Send login details on WhatsApp</p>
                  <p className="text-xs text-gray-400">Opens WhatsApp with phone and password after saving</p>
                </div>
              </label>
            </div>
          )}
        </Section>

        {/* ── Receipt preview ── */}
        {selectedPlan && watchedName && (
          <div className="rounded-card border-2 border-success bg-success-light p-4 mb-5">
            <p className="text-xs font-semibold text-success-dark uppercase tracking-wide mb-3">Receipt preview</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member</span>
                <span className="font-medium text-gray-800">{watchedName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium text-gray-800">
                  {selectedPlan.name} · {selectedPlan.duration_days} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium text-gray-800">
                  {watchedStart ? formatDate(watchedStart) : '—'} → {endDate ? formatDate(endDate) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment</span>
                <span className="font-medium text-gray-800">
                  {watchedMode?.toUpperCase()} · {formatCurrency(watchedAmount || 0)}
                </span>
              </div>
              {portalOption === 'create' && (
                <div className="flex justify-between pt-1 border-t border-success mt-1">
                  <span className="text-gray-600">Portal login</span>
                  <span className="font-medium text-success-dark">
                    Will be created ✓
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Submit buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <button
            type="button"
            onClick={handleSubmit((d) => onSubmit(d, true))}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 justify-center flex-1 disabled:opacity-60"
          >
            <MessageCircle size={15} />
            {submitting ? 'Saving…' : 'Save & send WhatsApp welcome'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-secondary flex items-center gap-2 justify-center sm:w-auto disabled:opacity-60"
          >
            <Save size={15} />
            Save without message
          </button>
        </div>
      </form>

      {/* Success modal */}
      {successData && (
        <SuccessModal
          data={successData}
          onAddAnother={handleAddAnother}
          onViewProfile={handleViewProfile}
        />
      )}
    </AppLayout>
  )
}
