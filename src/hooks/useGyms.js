import { useState, useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

// Fake gyms shown when Supabase isn't configured yet
const DEV_GYMS = [
  { id: '1', name: 'MLC Mall' },
  { id: '2', name: 'New Shimla' },
  { id: '3', name: 'Location 3' },
]

export function useGyms() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { setGyms, setActiveGym } = useGymStore()

  useEffect(() => {
    if (!supabaseReady) {
      setGyms(DEV_GYMS)
      setActiveGym(DEV_GYMS[0].id)
      setLoading(false)
      return
    }

    async function fetchGyms() {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from('gyms')
          .select('*')
          .order('created_at')

        if (err) throw err

        setGyms(data)
        if (data && data.length > 0) setActiveGym(data[0].id)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGyms()
  }, [])

  const { gyms } = useGymStore()
  return { gyms, loading, error }
}
