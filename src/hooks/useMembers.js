import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'
import { generateMemberCode, todayISO, dateISO } from '../utils/helpers'
import { addDays, subDays, format } from 'date-fns'

export function useMembersHook() {
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)
  const { activeGymId, setMembers } = useGymStore(useShallow((s) => ({
    activeGymId: s.activeGymId,
    setMembers:  s.setMembers,
  })))

  const fetchMembers = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return }

    try {
      setLoading(true)
      let query = supabase
        .from('members')
        .select(`
          *,
          memberships(*, plans(name, duration_days, price)),
          trainers(name),
          gyms(name, location)
        `)
        .order('created_at', { ascending: false })

      if (activeGymId) query = query.eq('gym_id', activeGymId)

      const { data, error: err } = await query
      if (err) throw err
      setMembers(data || [])
    } catch (err) {
      console.error('useMembers error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const members = useGymStore((s) => s.members)
  return { members, loading, error, refetch: fetchMembers }
}

// ─── Add Member ───────────────────────────────────────────────────────────────
export async function addMember(memberData) {
  if (!supabaseReady) throw new Error('Supabase not configured')

  const {
    gym_id, name, phone, whatsapp, date_of_birth, gender,
    address, emergency_contact, health_notes, trainer_id,
    batch_timing, plan_id, payment_amount, payment_mode,
    transaction_id, start_date,
  } = memberData

  // 1. Fetch plan details
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('*')
    .eq('id', plan_id)
    .single()
  if (planErr) throw planErr

  // 2. Insert member
  const { data: member, error: memberErr } = await supabase
    .from('members')
    .insert({
      gym_id, name, phone, whatsapp: whatsapp || phone,
      date_of_birth, gender, address, emergency_contact,
      health_notes, trainer_id, batch_timing, status: 'active',
    })
    .select()
    .single()
  if (memberErr) throw memberErr

  // 3. Generate and update member_code
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gym_id)

  const { data: gym } = await supabase.from('gyms').select('name').eq('id', gym_id).single()
  const member_code = generateMemberCode(gym?.name || '', (count || 1) - 1)

  await supabase.from('members').update({ member_code }).eq('id', member.id)

  // 4. Calculate dates
  const joinDate = start_date || todayISO()
  const endDate  = dateISO(addDays(new Date(joinDate), plan.duration_days))

  // 5. Insert membership
  const { data: membership, error: memErr } = await supabase
    .from('memberships')
    .insert({
      member_id: member.id, gym_id, plan_id,
      start_date: joinDate, end_date: endDate, status: 'active',
    })
    .select()
    .single()
  if (memErr) throw memErr

  // 6. Insert payment
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      member_id: member.id, gym_id, plan_id,
      amount: payment_amount || plan.price,
      payment_mode: payment_mode || 'cash',
      transaction_id, payment_date: joinDate,
      membership_id: membership.id,
    })
    .select()
    .single()
  if (payErr) throw payErr

  return { member: { ...member, member_code }, membership, payment }
}
