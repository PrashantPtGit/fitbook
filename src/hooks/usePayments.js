import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'
import { todayISO, dateISO } from '../utils/helpers'
import { addDays } from 'date-fns'

export function usePayments() {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const { activeGymId, setPayments } = useGymStore(useShallow((s) => ({
    activeGymId: s.activeGymId,
    setPayments:  s.setPayments,
  })))

  const fetchPayments = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return }

    try {
      setLoading(true)
      let query = supabase
        .from('payments')
        .select('*, members(name, phone, member_code), plans(name)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (activeGymId) query = query.eq('gym_id', activeGymId)

      const { data, error: err } = await query
      if (err) throw err
      setPayments(data || [])
    } catch (err) {
      console.error('usePayments error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const payments = useGymStore((s) => s.payments)
  return { payments, loading, error, refetch: fetchPayments }
}

// ─── Collect Fee ──────────────────────────────────────────────────────────────
export async function collectFee(feeData) {
  if (!supabaseReady) throw new Error('Supabase not configured')

  const {
    member_id, gym_id, plan_id, amount, payment_mode,
    transaction_id, payment_date, note,
  } = feeData

  // 1. Fetch plan for duration
  const { data: plan, error: planErr } = await supabase
    .from('plans').select('*').eq('id', plan_id).single()
  if (planErr) throw planErr

  const startDate = payment_date || todayISO()
  const endDate   = dateISO(addDays(new Date(startDate), plan.duration_days))

  // 2. Expire old active membership
  await supabase
    .from('memberships')
    .update({ status: 'expired' })
    .eq('member_id', member_id)
    .eq('status', 'active')

  // 3. Insert new membership
  const { data: membership, error: memErr } = await supabase
    .from('memberships')
    .insert({ member_id, gym_id, plan_id, start_date: startDate, end_date: endDate, status: 'active' })
    .select().single()
  if (memErr) throw memErr

  // 4. Insert payment
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      member_id, gym_id, plan_id, amount,
      payment_mode: payment_mode || 'cash',
      transaction_id, payment_date: startDate,
      membership_id: membership.id, note,
    })
    .select().single()
  if (payErr) throw payErr

  // 5. Update member status to active
  await supabase.from('members').update({ status: 'active' }).eq('id', member_id)

  return payment
}
