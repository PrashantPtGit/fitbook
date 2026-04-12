import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { ArrowLeft, MessageCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import PlanSelector from '../components/members/PlanSelector'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { addMember } from '../hooks/useMembers'
import {
  formatCurrency, formatDate, todayISO,
  generateWhatsAppLink, buildWelcomeMessage,
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
    (v) => !v || /^\d{10}$/.test(v),
    'Must be 10 digits'
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

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="card mb-4">
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddMember() {
  const navigate    = useNavigate()
  const { gyms }    = useGymStore()
  const activeGymId = useGymStore((s) => s.activeGymId)

  const [trainers,    setTrainers]    = useState([])
  const [plans,       setPlans]       = useState([])
  const [submitting,  setSubmitting]  = useState(false)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gym_id:         activeGymId || '',
      start_date:     todayISO(),
      payment_mode:   'upi',
      payment_amount: 0,
    },
  })

  const watchedGymId    = watch('gym_id')
  const watchedPlanId   = watch('plan_id')
  const watchedStart    = watch('start_date')
  const watchedName     = watch('name')
  const watchedMode     = watch('payment_mode')
  const watchedAmount   = watch('payment_amount')

  const selectedPlan    = plans.find((p) => p.id === watchedPlanId)
  const endDate         = selectedPlan && watchedStart
    ? format(addDays(new Date(watchedStart), selectedPlan.duration_days), 'yyyy-MM-dd')
    : null

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
        // Clear selected plan if gym changed
        setValue('plan_id', '')
        setValue('payment_amount', 0)
      })
  }, [watchedGymId, setValue])

  // Auto-fill amount when plan selected
  useEffect(() => {
    if (selectedPlan) setValue('payment_amount', selectedPlan.price)
  }, [selectedPlan, setValue])

  async function onSubmit(data, sendWhatsApp = false) {
    if (!supabaseReady) { toast.error('Database not connected'); return }
    setSubmitting(true)
    try {
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
        health_notes:  data.health_notes || null,
        trainer_id:    data.trainer_id || null,
        batch_timing:  data.batch_timing,
        plan_id:       data.plan_id,
        payment_amount: data.payment_amount,
        payment_mode:  data.payment_mode,
        transaction_id: data.transaction_id || null,
        start_date:    data.start_date,
      })

      toast.success('Member added successfully!')

      if (sendWhatsApp && result.member) {
        const gym     = gyms.find((g) => g.id === data.gym_id)
        const msg     = buildWelcomeMessage(
          data.name,
          gym?.name || 'the gym',
          selectedPlan?.name || '',
          formatDate(data.start_date),
          formatDate(endDate),
          data.batch_timing
        )
        window.open(generateWhatsAppLink(data.phone, msg), '_blank')
      }

      navigate('/members')
    } catch (err) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
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
              <input {...register('address')} placeholder="Street, area, city" className="input col-span-2" />
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
            <Field label="Gym" required error={errors.gym_id}>
              <select {...register('gym_id')} className="input">
                <option value="">Select gym</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>

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
            </div>
            <p className="text-xs text-success-dark mt-3 border-t border-success pt-2">
              Receipt will be sent on WhatsApp after saving
            </p>
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
            {submitting ? 'Saving…' : 'Save member & send WhatsApp welcome'}
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
    </AppLayout>
  )
}
