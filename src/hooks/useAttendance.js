import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'
import { todayISO, subDaysISO, dateISO } from '../utils/helpers'
import { subDays, format } from 'date-fns'

export function useAttendance() {
  const [todayAttendance, setTodayAttendance] = useState([])
  const [weeklyData,      setWeeklyData]      = useState([])
  const [loading,         setLoading]          = useState(true)
  const [error,           setError]            = useState(null)
  const channelRef = useRef(null)

  const { activeGymId, addAttendance } = useGymStore(useShallow((s) => ({
    activeGymId:   s.activeGymId,
    addAttendance: s.addAttendance,
  })))

  const fetchAttendance = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return }

    try {
      setLoading(true)
      const today = todayISO()

      // Today's records
      let query = supabase
        .from('attendance')
        .select('*, members(name, member_code, phone)')
        .eq('date', today)
        .order('checked_in_at', { ascending: false })

      if (activeGymId) query = query.eq('gym_id', activeGymId)

      const { data: todayData, error: err } = await query
      if (err) throw err
      setTodayAttendance(todayData || [])

      // Weekly counts (last 7 days)
      const weekly = []
      for (let i = 6; i >= 0; i--) {
        const day  = subDays(new Date(), i)
        const date = dateISO(day)
        let wq = supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', date)
        if (activeGymId) wq = wq.eq('gym_id', activeGymId)
        const { count } = await wq
        weekly.push({ day: format(day, 'EEE'), date, count: count || 0 })
      }
      setWeeklyData(weekly)
    } catch (err) {
      console.error('useAttendance error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  // Real-time subscription
  useEffect(() => {
    if (!supabaseReady || !activeGymId) return

    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`attendance-${activeGymId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `gym_id=eq.${activeGymId}` },
        (payload) => {
          setTodayAttendance((prev) => [payload.new, ...prev])
          addAttendance(payload.new)
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [activeGymId])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  return { todayAttendance, weeklyData, loading, error, refetch: fetchAttendance }
}

// ─── Mark Attendance ──────────────────────────────────────────────────────────
export async function markAttendance(memberId, gymId) {
  if (!supabaseReady) throw new Error('Supabase not configured')

  const today = todayISO()

  // Check for duplicate
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('date', today)
    .maybeSingle()

  if (existing) return { error: 'Already checked in today', data: null }

  const { data, error } = await supabase
    .from('attendance')
    .insert({ member_id: memberId, gym_id: gymId, date: today, checked_in_at: new Date().toISOString() })
    .select('*, members(name, member_code)')
    .single()

  return { data, error: error?.message || null }
}
