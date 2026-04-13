import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Plus } from 'lucide-react'
import { differenceInMinutes } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonBox } from '../ui/Skeleton'

function deviceStatus(lastSyncedAt) {
  if (!lastSyncedAt) {
    return { label: 'Never synced', dot: 'bg-gray-400', text: 'text-gray-500', sub: 'Never synced' }
  }
  const mins = differenceInMinutes(new Date(), new Date(lastSyncedAt))
  if (mins <= 10) {
    return { label: 'Online', dot: 'bg-success animate-pulse', text: 'text-success-dark', sub: 'Just now' }
  }
  if (mins <= 60) {
    return { label: `Synced ${mins}m ago`, dot: 'bg-warning animate-pulse', text: 'text-warning-dark', sub: `${mins} min ago` }
  }
  const hrs = Math.floor(mins / 60)
  return {
    label: 'Offline',
    dot:   'bg-danger',
    text:  'text-danger',
    sub:   mins < 1440 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`,
  }
}

export default function DeviceStatus() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          onClick={() => toast('Device management coming soon')}
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
          <div>
            <p className="text-sm font-medium text-gray-600">No fingerprint device configured</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add a device to enable biometric check-in for members
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map((d) => {
            const st = deviceStatus(d.last_synced_at)
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-btn"
              >
                <div className="w-9 h-9 rounded-btn bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <Wifi size={16} className={st.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {d.name || 'Device'}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                      <span className={`text-xs font-medium ${st.text}`}>{st.label}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {d.serial_number ? `S/N: ${d.serial_number}` : 'No serial number'}
                    {d.last_synced_at && ` · Last sync: ${st.sub}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
