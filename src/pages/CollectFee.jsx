import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { ArrowLeft, MessageCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import PlanSelector from '../components/members/PlanSelector'
import PaymentModeSelector from '../components/fees/PaymentModeSelector'
import ReceiptPreview from '../components/fees/ReceiptPreview'
import { SkeletonCard } from '../components/ui/Skeleton'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { collectFee } from '../hooks/usePayments'
import {
  getMembershipStatus, formatDate, formatCurrency, todayISO, dateISO,
  generateWhatsAppLink, buildPaymentReceiptMessage,
} from '../utils/helpers'

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  plan_id:        z.string().min(1, 'Select a plan'),
  amount:         z.coerce.number().min(1, 'Enter an amount'),
  payment_mode:   z.string().min(1, 'Select payment mode'),
  transaction_id: z.string().optional(),
  payment_date:   z.string().min(1, 'Required'),
  note:           z.string().optional(),
})

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CollectFee() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const activeGym  = useGymStore((s) => s.activeGym)

  const [member,     setMember]     = useState(null)
  const [plans,      setPlans]      = useState([])
  const [membership, setMembership] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_mode: 'upi',
      payment_date: todayISO(),
      amount:       0,
    },
  })

  const watchedPlanId = watch('plan_id')
  const watchedAmount = watch('amount')
  const watchedMode   = watch('payment_mode')
  const watchedDate   = watch('payment_date')
  const selectedPlan  = plans.find((p) => p.id === watchedPlanId)
  const endDate       = selectedPlan && watchedDate
    ? dateISO(addDays(new Date(watchedDate), selectedPlan.duration_days))
    : null

  // ── Fetch member + plans ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseReady || !id) return

    async function fetchData() {
      setLoading(true)

      const [memberRes, plansRes] = await Promise.all([
        supabase
          .from('members')
          .select('*, memberships(*, plans(name, duration_days, price)), trainers(name), gyms(name, location)')
          .eq('id', id)
          .single(),
        supabase
          .from('plans')
          .select('*')
          .order('duration_days'),
      ])

      if (memberRes.error || !memberRes.data) {
        toast.error('Member not found')
        navigate('/fees')
        return
      }

      const m   = memberRes.data
      setMember(m)

      // Find active membership (latest end_date)
      const mems = (m.memberships || []).sort((a, b) =>
        (b.end_date || '') > (a.end_date || '') ? 1 : -1
      )
      const activeMem = mems[0] || null
      setMembership(activeMem)

      // Filter plans to this member's gym
      const gymPlans = (plansRes.data || []).filter((p) => p.gym_id === m.gym_id)
      setPlans(gymPlans)

      // Default to current plan
      if (activeMem?.plan_id) {
        setValue('plan_id', activeMem.plan_id)
        const currentPlan = gymPlans.find((p) => p.id === activeMem.plan_id)
        if (currentPlan) setValue('amount', currentPlan.price)
      } else if (gymPlans.length) {
        setValue('plan_id', gymPlans[0].id)
        setValue('amount', gymPlans[0].price)
      }

      setLoading(false)
    }

    fetchData()
  }, [id, navigate, setValue])

  // Auto-fill amount when plan changes
  useEffect(() => {
    if (selectedPlan) setValue('amount', selectedPlan.price)
  }, [selectedPlan, setValue])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function onSubmit(data, sendWhatsApp = false) {
    if (!member) return
    setSubmitting(true)
    try {
      await collectFee({
        member_id:      member.id,
        gym_id:         member.gym_id,
        plan_id:        data.plan_id,
        amount:         data.amount,
        payment_mode:   data.payment_mode,
        transaction_id: data.transaction_id || null,
        payment_date:   data.payment_date,
        note:           data.note || null,
      })

      toast.success(`✓ Payment recorded for ${member.name}`)

      if (sendWhatsApp && member.phone) {
        const msg = buildPaymentReceiptMessage(
          member.name,
          activeGym?.name || member.gyms?.name || 'the gym',
          selectedPlan?.name || '',
          data.amount,
          formatDate(data.payment_date),
          formatDate(endDate),
          data.payment_mode,
          data.transaction_id || null
        )
        window.open(generateWhatsAppLink(member.whatsapp || member.phone, msg), '_blank')
      }

      navigate('/fees')
    } catch (err) {
      toast.error(err.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout pageTitle="Collect Fee">
        <div className="space-y-4 max-w-2xl mx-auto">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </AppLayout>
    )
  }

  if (!member) return null

  const memStatus   = membership ? getMembershipStatus(membership.end_date) : null
  const lastPayDate = member.memberships?.[0]?.start_date

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Collect Fee" pageSubtitle={`Recording payment for ${member.name}`}>
      {/* Back */}
      <button
        onClick={() => navigate('/fees')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Back to fees
      </button>

      {/* Member info card */}
      <div className="card mb-4 flex items-center gap-4 flex-wrap">
        <Avatar name={member.name} size="lg" gymIndex={0} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900">{member.name}</h2>
            {memStatus && <Badge variant={memStatus.badgeVariant}>{memStatus.label}</Badge>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{member.member_code} · {member.batch_timing}</p>
          <p className="text-xs text-gray-400">
            Current plan: <strong>{membership?.plans?.name || '—'}</strong>
            {lastPayDate && ` · Last paid: ${formatDate(lastPayDate)}`}
          </p>
        </div>
        {membership?.plans?.price && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Due amount</p>
            <p className="text-lg font-bold text-danger">{formatCurrency(membership.plans.price)}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit((d) => onSubmit(d, false))}>

        {/* ── Section 1: Plan ── */}
        <Section title="Select renewal plan">
          <PlanSelector
            plans={plans}
            selectedPlanId={watchedPlanId}
            onSelect={(pid) => setValue('plan_id', pid, { shouldValidate: true })}
          />
          {errors.plan_id && (
            <p className="text-xs text-danger mt-2">{errors.plan_id.message}</p>
          )}
        </Section>

        {/* ── Section 2: Payment details ── */}
        <Section title="Payment details">
          {/* Payment mode — big radio buttons */}
          <div className="mb-5">
            <p className="label mb-2">Payment mode <span className="text-danger">*</span></p>
            <Controller
              name="payment_mode"
              control={control}
              render={({ field }) => (
                <PaymentModeSelector value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.payment_mode && (
              <p className="text-xs text-danger mt-1">{errors.payment_mode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="form-group">
              <label className="label">Amount (₹) <span className="text-danger">*</span></label>
              <input {...register('amount')} type="number" className="input" />
              {errors.amount && <p className="text-xs text-danger mt-0.5">{errors.amount.message}</p>}
            </div>

            {/* Payment date */}
            <div className="form-group">
              <label className="label">Payment date <span className="text-danger">*</span></label>
              <input {...register('payment_date')} type="date" className="input" />
              {errors.payment_date && <p className="text-xs text-danger mt-0.5">{errors.payment_date.message}</p>}
            </div>

            {/* Transaction ID — only for UPI / online */}
            {(watchedMode === 'upi' || watchedMode === 'online') && (
              <div className="form-group">
                <label className="label">Transaction / UPI ref ID</label>
                <input {...register('transaction_id')} placeholder="Reference number" className="input" />
              </div>
            )}

            {/* Note */}
            <div className="form-group">
              <label className="label">Note (optional)</label>
              <input {...register('note')} placeholder="Any remarks" className="input" />
            </div>
          </div>
        </Section>

        {/* ── Receipt preview ── */}
        {selectedPlan && (
          <div className="mb-5">
            <ReceiptPreview
              member={member}
              plan={selectedPlan}
              amount={watchedAmount}
              mode={watchedMode}
              startDate={watchedDate}
              endDate={endDate}
              gymName={activeGym?.name || member.gyms?.name}
            />
          </div>
        )}

        {/* ── Submit buttons ── */}
        <div className="flex flex-col gap-3 pb-6">
          <button
            type="button"
            onClick={handleSubmit((d) => onSubmit(d, true))}
            disabled={submitting}
            className="btn-success flex items-center gap-2 justify-center w-full disabled:opacity-60"
          >
            <MessageCircle size={15} />
            {submitting ? 'Saving…' : 'Mark as paid & send WhatsApp receipt'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-secondary flex items-center gap-2 justify-center w-full disabled:opacity-60"
          >
            <Save size={15} />
            Mark as paid — no message
          </button>
        </div>
      </form>
    </AppLayout>
  )
}
