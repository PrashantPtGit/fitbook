import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { format, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { todayISO, dateISO } from '../utils/helpers'

export function useReports() {
  const [monthlyRevenue,    setMonthlyRevenue]    = useState([])
  const [breakdown,         setBreakdown]          = useState([])
  const [expiringThisWeek,  setExpiringThisWeek]  = useState([])
  const [inactiveMembers,   setInactiveMembers]    = useState([])
  const [loading,           setLoading]            = useState(true)

  const activeGymId = useGymStore((s) => s.activeGymId)

  const fetchReports = useCallback(async () => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    try {
      setLoading(true)
      await Promise.all([
        fetchMonthlyRevenue(activeGymId),
        fetchBreakdown(activeGymId),
        fetchExpiringThisWeek(activeGymId),
        fetchInactiveMembers(activeGymId),
      ])
    } catch (err) {
      console.error('useReports error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  async function fetchMonthlyRevenue(gymId, months = 6) {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i)
      const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
      const end   = format(endOfMonth(monthDate),   'yyyy-MM-dd')

      let q = supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', start)
        .lte('payment_date', end)

      if (gymId) q = q.eq('gym_id', gymId)

      const { data } = await q
      const total = (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
      results.push({ month: format(monthDate, 'MMM'), amount: total })
    }
    setMonthlyRevenue(results)
  }

  async function fetchBreakdown(gymId) {
    let q = supabase
      .from('memberships')
      .select('plans(name), member_id')
      .eq('status', 'active')

    if (gymId) q = q.eq('gym_id', gymId)

    const { data } = await q
    const records = data || []
    const counts  = {}
    records.forEach((r) => {
      const name = r.plans?.name || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    const total = records.length || 1
    const result = Object.entries(counts).map(([plan, count]) => ({
      plan,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    setBreakdown(result)
  }

  async function fetchExpiringThisWeek(gymId) {
    const today     = todayISO()
    const todayPlus14 = dateISO(addDays(new Date(), 14))

    let q = supabase
      .from('memberships')
      .select('*, members(name, phone, member_code), plans(name, price)')
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', todayPlus14)
      .order('end_date', { ascending: true })

    if (gymId) q = q.eq('gym_id', gymId)

    const { data } = await q
    setExpiringThisWeek(data || [])
  }

  async function fetchInactiveMembers(gymId, days = 10) {
    const cutoff = dateISO(addDays(new Date(), -days))

    // Get members with active memberships
    let mq = supabase
      .from('members')
      .select('id, name, phone, member_code')
      .eq('status', 'active')

    if (gymId) mq = mq.eq('gym_id', gymId)

    const { data: activeMembers } = await mq
    if (!activeMembers?.length) { setInactiveMembers([]); return }

    // Get member IDs who attended in last X days
    let aq = supabase
      .from('attendance')
      .select('member_id')
      .gte('date', cutoff)

    if (gymId) aq = aq.eq('gym_id', gymId)

    const { data: recentAttendance } = await aq
    const recentIds = new Set((recentAttendance || []).map((r) => r.member_id))

    const inactive = activeMembers.filter((m) => !recentIds.has(m.id))
    setInactiveMembers(inactive)
  }

  useEffect(() => { fetchReports() }, [fetchReports])

  return { monthlyRevenue, breakdown, expiringThisWeek, inactiveMembers, loading, refetch: fetchReports }
}

// ─── Standalone helpers for direct component calls ─────────────────────────
export async function getExpiringThisWeek(gymId) {
  if (!gymId) return []
  const today       = todayISO()
  const todayPlus14 = dateISO(addDays(new Date(), 14))
  const { data } = await supabase
    .from('memberships')
    .select('*, members(name, phone, member_code), plans(name, price)')
    .eq('gym_id', gymId)
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', todayPlus14)
    .order('end_date', { ascending: true })
  return data || []
}

export async function getMonthlyRevenue(gymId, months = 6) {
  if (!gymId) return []
  const results = []
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i)
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const end   = format(endOfMonth(monthDate),   'yyyy-MM-dd')
    const { data } = await supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gymId)
      .gte('payment_date', start)
      .lte('payment_date', end)
    const total = (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
    results.push({ month: format(monthDate, 'MMM'), amount: total })
  }
  return results
}

export async function getCurrentMonthRevenue(gymId) {
  if (!gymId) return 0
  const now   = new Date()
  const start = format(startOfMonth(now), 'yyyy-MM-dd')
  const end   = format(endOfMonth(now),   'yyyy-MM-dd')
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('gym_id', gymId)
    .gte('payment_date', start)
    .lte('payment_date', end)
  return (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
}
