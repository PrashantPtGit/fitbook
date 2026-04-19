import { useState, useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

/**
 * Fetches all data for the currently logged-in member.
 * Looks up member_accounts by auth user_id → gets member_id → fetches full profile.
 */
export function useMemberPortal() {
  const [member,     setMember]     = useState(null)
  const [membership, setMembership] = useState(null)
  const [payments,   setPayments]   = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // 1. Get current auth user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // 2. Find member_accounts row
      const { data: account, error: accErr } = await supabase
        .from('member_accounts')
        .select('member_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (accErr || !account) throw new Error('Member account not found')

      const memberId = account.member_id

      // 3. Fetch member profile + gym + trainer (memberships fetched separately to avoid RLS join issues)
      const [memberRes, membershipRes, paymentsRes, attendanceRes] = await Promise.all([
        supabase
          .from('members')
          .select('*, gyms(name, location, phone), trainers(name, phone)')
          .eq('id', memberId)
          .maybeSingle(),

        supabase
          .from('memberships')
          .select('*, plans(name, price, duration_days)')
          .eq('member_id', memberId)
          .eq('status', 'active')
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from('payments')
          .select('*, plans(name)')
          .eq('member_id', memberId)
          .order('payment_date', { ascending: false }),

        supabase
          .from('attendance')
          .select('date, checked_in_at, source')
          .eq('member_id', memberId)
          .order('date', { ascending: false })
          .limit(365),
      ])

      if (memberRes.error) throw memberRes.error

      setMember(memberRes.data)
      setMembership(membershipRes.data || null)
      setPayments(paymentsRes.data || [])
      setAttendance(attendanceRes.data || [])
    } catch (err) {
      console.error('useMemberPortal error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { member, membership, payments, attendance, loading, error, refetch: fetchAll }
}
