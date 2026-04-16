import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'

export const markAttendance = async (memberId, gymId) => {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('date', today)
    .single()

  if (existing) {
    return { error: 'Already checked in today' }
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id:      memberId,
      gym_id:         gymId,
      date:           today,
      checked_in_at:  new Date().toISOString(),
      source:         'manual',
    })
    .select()
    .single()

  return { data, error }
}

export const useAttendance = () => {
  const { activeGymId, attendance, setAttendance, addAttendance } = useGymStore(
    useShallow((s) => ({
      activeGymId:   s.activeGymId,
      attendance:    s.attendance,
      setAttendance: s.setAttendance,
      addAttendance: s.addAttendance,
    }))
  )

  const [todayAttendance, setTodayAttendance] = useState([])
  const [weeklyData,      setWeeklyData]      = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [isConnected,     setIsConnected]     = useState(false)

  useEffect(() => {
    if (!activeGymId) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    async function fetchAttendance() {
      setLoading(true)
      try {
        // Today's check-ins with member info
        const { data, error: fetchErr } = await supabase
          .from('attendance')
          .select('*, members(name, member_code)')
          .eq('gym_id', activeGymId)
          .eq('date', today)
          .order('checked_in_at', { ascending: false })

        if (fetchErr) throw fetchErr
        setTodayAttendance(data || [])
        setAttendance(data || [])

        // Weekly data — 7 days in parallel
        const dates = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          dates.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          })
        }

        const counts = await Promise.all(
          dates.map(({ dateStr }) =>
            supabase
              .from('attendance')
              .select('*', { count: 'exact', head: true })
              .eq('gym_id', activeGymId)
              .eq('date', dateStr)
              .then(({ count }) => count || 0)
          )
        )

        setWeeklyData(dates.map(({ dateStr, dayName }, i) => ({
          date:  dateStr,
          day:   dayName,
          count: counts[i],
        })))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()

    // Unique channel name avoids StrictMode double-subscribe collision
    const channelName = `attendance-${activeGymId}-${crypto.randomUUID()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'attendance',
          filter: `gym_id=eq.${activeGymId}`,
        },
        async (payload) => {
          // Fetch member info so the list row is complete
          const { data: memberData } = await supabase
            .from('members')
            .select('name, member_code')
            .eq('id', payload.new.member_id)
            .single()

          const enriched = { ...payload.new, members: memberData || null }
          setTodayAttendance((prev) => [enriched, ...prev])
          addAttendance(enriched)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGymId])

  return { todayAttendance, weeklyData, loading, error, isConnected }
}

export default useAttendance
