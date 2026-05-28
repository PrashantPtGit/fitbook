import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonBox } from '../ui/Skeleton'

function deviceStatus(lastSyncedAt) {
  if (!lastSyncedAt) {
    return { label: 'Never synced', dot: 'bg-gray-400', text: 'text-gray-500', sub: 'Never synced' }
  }
  const mins = Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 60000)
  const relative = formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })

  if (mins <= 10) {
    return { label: 'Online', dot: 'bg-success animate-pulse', text: 'text-success-dark', sub: mins <= 1 ? 'Synced just now' : `Synced ${mins} min ago` }
  }
  if (mins <= 60) {
    return { label: `Synced ${mins}m ago`, dot: 'bg-warning animate-pulse', text: 'text-warning-dark', sub: `Synced ${relative}` }
  }
  return {
    label: 'Offline',
    dot:   'bg-danger',
    text:  'text-danger',
    sub:   `Last synced ${relative}`,
  }
}

function connectionBadge(device) {
  const ct = device.connection_type
  if (ct === 'sync_js') return { label: 'Local Sync', cls: 'bg-blue-50 text-blue-600' }
  if (ct === 'direct')  return { label: 'Direct',     cls: 'bg-purple-50 text-purple-600' }
  // fall back to device_type brand label
  const brand = (device.device_type || 'device').charAt(0).toUpperCase() + (device.device_type || 'device').slice(1)
  return { label: brand, cls: 'bg-gray-100 text-gray-500' }
}

export default function DeviceStatus() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gyms        = useGymStore((s) => s.gyms)
  const navigate    = useNavigate()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = useCallback(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }
    supabase
      .from('fingerprint_devices')
      .select('*')
      .eq('gym_id', activeGymId)
      .then(({ data }) => {
        setDevices(data || [])
        setLoading(false)
      })
  }, [activeGymId])

  // Initial fetch + auto-refresh every 60 s
  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 60_000)
    return () => clearInterval(interval)
  }, [fetchDevices])

  const gymName = gyms.find((g) => g.id === activeGymId)?.location
    || gyms.find((g) => g.id === activeGymId)?.name || ''

  if (loading) {
    return (
      <div className="card">
        <SkeletonBox className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Fingerprint devices</h3>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
        >
          <Plus size={12} />
          Add device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-btn bg-gray-100 flex items-center justify-center shrink-0">
            <WifiOff size={18} className="text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600">No device configured</p>
            <p className="text-xs text-gray-400 mt-0.5">Add a Hikvision device in Settings to enable biometric check-in</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-xs text-primary hover:text-primary-dark font-medium shrink-0"
          >
            + Add device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map((d) => {
            const st    = deviceStatus(d.last_synced_at)
            const badge = connectionBadge(d)
            return (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-btn">
                <div className="w-9 h-9 rounded-btn bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <Wifi size={16} className={st.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {d.device_name || 'Device'}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {gymName && <span>{gymName} · </span>}
                    <span className={st.text.replace('text-', 'text-')}>{st.sub}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                    <span className={`text-xs font-medium ${st.text}`}>{st.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
