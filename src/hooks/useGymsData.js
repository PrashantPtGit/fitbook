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
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!supabaseReady) {
      const { gyms } = useGymStore.getState()
      if (gyms.length === 0) {
        useGymStore.getState().setGyms(DEV_GYMS)
        useGymStore.getState().setActiveGym(DEV_GYMS[0].id)
      }
      useGymStore.getState().setUserRole('main_admin', null, 'Dev User')
      setLoading(false)
      return
    }

    async function fetchAll() {
      try {
        setLoading(true)

        // 1. Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        console.log('[useGymsData] Auth user ID:', user.id)

        // 2. Fetch role from user_roles table
        const { data: roleData, error: roleErr } = await supabase
          .from('user_roles')
          .select('role, gym_id, name')
          .eq('user_id', user.id)
          .single()
        console.log('[useGymsData] Role data:', roleData, '| Error:', roleErr)

        const role   = roleData?.role   || 'co_owner'
        const gymId  = roleData?.gym_id || null
        const name   = roleData?.name   || user.email
        useGymStore.getState().setUserRole(role, gymId, name)

        // 3. Fetch all gyms
        const { data: gymData, error: gymErr } = await supabase
          .from('gyms')
          .select('*')
          .order('created_at')

        if (gymErr) throw gymErr

        const allGyms = gymData || []

        // 4. co_owner: locked to their gym only
        if (role === 'co_owner' && gymId) {
          const myGym = allGyms.filter((g) => g.id === gymId)
          useGymStore.getState().setGyms(myGym)
          useGymStore.getState().setActiveGym(gymId)
        } else {
          // main_admin: all gyms, keep current selection or default to first
          useGymStore.getState().setGyms(allGyms)
          const currentActiveId = useGymStore.getState().activeGymId
          if (!currentActiveId && allGyms.length > 0) {
            useGymStore.getState().setActiveGym(allGyms[0].id)
          }
        }

        // 5. Fetch settings for active gym
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
