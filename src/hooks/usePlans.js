import { useState, useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

export function usePlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const activeGymId = useGymStore((s) => s.activeGymId)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) {
      setLoading(false)
      return
    }

    async function fetchPlans() {
      setLoading(true)
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('gym_id', activeGymId)
        .eq('is_active', true)
        .order('duration_days')

      if (!error) setPlans(data || [])
      setLoading(false)
    }

    fetchPlans()
  }, [activeGymId])

  return { plans, loading }
}
