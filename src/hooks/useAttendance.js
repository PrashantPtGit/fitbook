import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

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
      member_id: memberId,
      gym_id: gymId,
      date: today,
      checked_in_at: new Date().toISOString(),
      source: 'manual'
    })
    .select()
    .single()

  return { data, error }
}

export const useAttendance = () => {
  const { activeGymId } = useGymStore()
  const { attendance, setAttendance, addAttendance } = useGymStore()
  const [todayAttendance, setTodayAttendance] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!activeGymId) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('*, members(name, member_code)')
          .eq('gym_id', activeGymId)
          .eq('date', today)
          .order('checked_in_at', { ascending: false })

        if (error) throw error
        setTodayAttendance(data || [])
        setAttendance(data || [])

        const weekly = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' })

          const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('gym_id', activeGymId)
            .eq('date', dateStr)

          weekly.push({ date: dateStr, day: dayName, count: count || 0 })
        }
        setWeeklyData(weekly)

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()

    // Realtime subscription — unique name per effect run avoids the
    // "cannot add callbacks after subscribe()" error in React StrictMode,
    // where effects fire twice and Supabase would otherwise return the same
    // already-subscribed channel object when the name is reused.
    const channelName = 'attendance-' + activeGymId + '-' + crypto.randomUUID()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: 'gym_id=eq.' + activeGymId
        },
        (payload) => {
          setTodayAttendance(prev => [payload.new, ...prev])
          addAttendance(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGymId])

  return { todayAttendance, weeklyData, loading, error }
}

export default useAttendance