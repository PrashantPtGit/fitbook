import { useState, useEffect } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'

// Keys that control automatic message triggers
export const MSG_KEYS = {
  renewal7d: 'msg_renewal_7day',
  renewal1d: 'msg_renewal_1day',
  welcome:   'msg_welcome',
  birthday:  'msg_birthday',
  inactive:  'msg_inactive',
}

// Default ON for all toggles when no gym_settings row exists yet
export const MSG_DEFAULTS = {
  msg_renewal_7day: true,
  msg_renewal_1day: true,
  msg_welcome:      true,
  msg_birthday:     true,
  msg_inactive:     true,
}

export function useSettings() {
  const [settings, setSettingsLocal] = useState({ ...MSG_DEFAULTS })
  const [loading,  setLoading]       = useState(true)

  const { activeGymId, setSettings } = useGymStore(
    useShallow((s) => ({ activeGymId: s.activeGymId, setSettings: s.setSettings }))
  )

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    async function fetchSettings() {
      setLoading(true)
      const { data, error } = await supabase
        .from('gym_settings')
        .select('*')
        .eq('gym_id', activeGymId)
        .single()

      const merged = error ? { ...MSG_DEFAULTS } : { ...MSG_DEFAULTS, ...data }
      setSettingsLocal(merged)
      setSettings(merged)
      setLoading(false)
    }

    fetchSettings()
  }, [activeGymId])

  /** Update one or more keys and persist via upsert */
  async function updateSettings(updates) {
    if (!supabaseReady || !activeGymId) return { error: 'Not ready' }

    // Optimistic local update first
    const next = { ...settings, ...updates }
    setSettingsLocal(next)
    setSettings(next)

    const { data, error } = await supabase
      .from('gym_settings')
      .upsert({ gym_id: activeGymId, ...next }, { onConflict: 'gym_id' })
      .select()
      .single()

    if (!error && data) {
      setSettingsLocal(data)
      setSettings(data)
    }
    return { data, error }
  }

  /** Convenience — update a single key */
  async function updateSetting(key, value) {
    return updateSettings({ [key]: value })
  }

  return { settings, loading, updateSettings, updateSetting }
}
