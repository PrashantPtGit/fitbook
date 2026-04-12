import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'
import { todayISO, dateISO } from '../utils/helpers'
import { addDays } from 'date-fns'

export function usePayments() {
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const { activeGymId, setPayments } = useGymStore(useShallow((s) => ({
    activeGymId:  s.activeGymId,
    setPayments:  s.setPayments,
  })))

  const fetchPayments = useCallback(async () => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('payments')
        .select('*, members(name, phone, member_code), plans(name)')
        .eq('gym_id', activeGymId)
        .order('payment_date', { ascending: false })
        .limit(200)

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

  // 2. Expire old active memberships for this member
  await supabase
    .from('memberships')
    .update({ status: 'expired' })
    .eq('member_id', member_id)
    .eq('status', 'active')

  // 3. Insert new membership
  const { data: membership, error: memErr } = await supabase
    .from('memberships')
    .insert({
      member_id, gym_id, plan_id,
      start_date: startDate,
      end_date:   endDate,
      status:     'active',
    })
    .select()
    .single()
  if (memErr) throw memErr

  // 4. Insert payment record
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      member_id, gym_id, plan_id, amount,
      payment_mode:  payment_mode || 'cash',
      transaction_id: transaction_id || null,
      payment_date:  startDate,
      membership_id: membership.id,
      note:          note || null,
    })
    .select()
    .single()
  if (payErr) throw payErr

  // 5. Mark member as active
  await supabase.from('members').update({ status: 'active' }).eq('id', member_id)

  return { payment, membership }
}

// ─── Standalone helpers ───────────────────────────────────────────────────────
export async function getTodayCollection(gymId) {
  if (!supabaseReady || !gymId) return 0
  const today = todayISO()
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('gym_id', gymId)
    .eq('payment_date', today)
  return (data || []).reduce((s, p) => s + (p.amount || 0), 0)
}

export async function getMonthCollection(gymId) {
  if (!supabaseReady || !gymId) return 0
  const now   = new Date()
  const start = format(startOfMonth(now), 'yyyy-MM-dd')
  const end   = format(endOfMonth(now),   'yyyy-MM-dd')
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('gym_id', gymId)
    .gte('payment_date', start)
    .lte('payment_date', end)
  return (data || []).reduce((s, p) => s + (p.amount || 0), 0)
}

export async function getPendingFees(gymId) {
  if (!supabaseReady || !gymId) return []
  const in7 = dateISO(addDays(new Date(), 7))
  const { data } = await supabase
    .from('memberships')
    .select('*, members(id, name, phone, whatsapp, member_code, batch_timing), plans(name, price)')
    .eq('gym_id', gymId)
    .eq('status', 'active')
    .lte('end_date', in7)
    .order('end_date', { ascending: true })
  return data || []
}
