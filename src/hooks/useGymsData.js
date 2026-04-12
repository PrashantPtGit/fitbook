import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

const DEV_GYMS = [
  { id: '1', name: 'MLC Mall',      location: 'Mall Road, Shimla' },
  { id: '2', name: 'MLC New Shimla', location: 'New Shimla, Phase 3' },
  { id: '3', name: 'Location 3',    location: 'Sanjauli, Shimla' },
]

export function useGymsData() {
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const { gyms, setGyms, activeGymId, setActiveGym, setSettings } = useGymStore.getState()

  useEffect(() => {
    if (!supabaseReady) {
      if (gyms.length === 0) {
        useGymStore.getState().setGyms(DEV_GYMS)
        useGymStore.getState().setActiveGym(DEV_GYMS[0].id)
      }
      setLoading(false)
      return
    }

    async function fetchAll() {
      try {
        setLoading(true)

        // Fetch gyms
        const { data: gymData, error: gymErr } = await supabase
          .from('gyms')
          .select('*')
          .order('created_at')

        if (gymErr) throw gymErr

        const fetchedGyms = gymData || []
        useGymStore.getState().setGyms(fetchedGyms)

        // Set first gym active if none set
        const currentActiveId = useGymStore.getState().activeGymId
        if (!currentActiveId && fetchedGyms.length > 0) {
          useGymStore.getState().setActiveGym(fetchedGyms[0].id)
        }

        // Fetch settings for active gym
        const activeId = useGymStore.getState().activeGymId
        if (activeId) {
          const { data: settingsData } = await supabase
            .from('gym_settings')
            .select('*')
            .eq('gym_id', activeId)
            .single()

          if (settingsData) useGymStore.getState().setSettings(settingsData)
        }
      } catch (err) {
        console.error('useGymsData error:', err)
        setError(err.message)
        toast.error('Failed to load gym data')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { gyms: useGymStore((s) => s.gyms), loading, error }
}
