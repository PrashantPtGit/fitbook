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
        .single()
      if (accErr || !account) throw new Error('Member account not found')

      const memberId = account.member_id

      // 3. Fetch member profile + gym + trainer + memberships + latest plan
      const [memberRes, paymentsRes, attendanceRes] = await Promise.all([
        supabase
          .from('members')
          .select('*, gyms(name, location, phone), trainers(name, phone), memberships(*, plans(name, price, duration_days))')
          .eq('id', memberId)
          .single(),

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

      // Derive active membership (latest end_date)
      const memberships = memberRes.data.memberships || []
      const activeMembership = memberships
        .sort((a, b) => (b.end_date || '') > (a.end_date || '') ? 1 : -1)[0] || null

      setMember(memberRes.data)
      setMembership(activeMembership)
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
