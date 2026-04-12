import { useState, useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'

export function useSettings() {
  const [settings, setSettingsLocal] = useState({})
  const [loading, setLoading] = useState(true)
  const { activeGymId, setSettings } = useGymStore(useShallow((s) => ({
    activeGymId: s.activeGymId,
    setSettings: s.setSettings,
  })))

  useEffect(() => {
    if (!supabaseReady || !activeGymId) {
      setLoading(false)
      return
    }

    async function fetchSettings() {
      setLoading(true)
      const { data, error } = await supabase
        .from('gym_settings')
        .select('*')
        .eq('gym_id', activeGymId)
        .single()

      if (!error && data) {
        setSettingsLocal(data)
        setSettings(data)
      }
      setLoading(false)
    }

    fetchSettings()
  }, [activeGymId])

  async function updateSettings(updates) {
    if (!supabaseReady || !activeGymId) return
    const { data, error } = await supabase
      .from('gym_settings')
      .update(updates)
      .eq('gym_id', activeGymId)
      .select()
      .single()

    if (!error && data) {
      setSettingsLocal(data)
      setSettings(data)
    }
    return { data, error }
  }

  return { settings, loading, updateSettings }
}
