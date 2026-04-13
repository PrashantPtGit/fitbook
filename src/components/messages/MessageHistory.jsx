import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { SkeletonRow } from '../ui/Skeleton'

const TYPE_META = {
  renewal_7d: { label: 'Renewal 7d',  cls: 'badge-amber'  },
  renewal_1d: { label: 'Renewal 1d',  cls: 'badge-red'    },
  welcome:    { label: 'Welcome',     cls: 'badge-green'  },
  birthday:   { label: 'Birthday',    cls: 'badge-purple' },
  inactive:   { label: 'Nudge',       cls: 'badge-gray'   },
  broadcast:  { label: 'Broadcast',   cls: 'badge-purple' },
}

const STATUS_META = {
  sent:   { label: 'Sent',   cls: 'badge-green' },
  failed: { label: 'Failed', cls: 'badge-red'   },
}

export default function MessageHistory() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    supabase
      .from('message_logs')
      .select('*, members(name, member_code)')
      .eq('gym_id', activeGymId)
      .order('sent_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLogs(data || [])
        setLoading(false)
      })
  }, [activeGymId])

  if (loading) {
    return (
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No messages sent yet. Use the broadcast or auto-triggers above.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100">
            {['Date', 'Type', 'Recipient', 'Message', 'Status'].map((h) => (
              <th key={h} className="pb-2.5 px-2 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map((log) => {
            const typeMeta   = TYPE_META[log.type]   || { label: log.type,   cls: 'badge-gray' }
            const statusMeta = STATUS_META[log.status] || { label: log.status, cls: 'badge-gray' }
            return (
              <tr key={log.id} className="hover:bg-gray-50 text-sm">
                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                  {log.sent_at
                    ? format(parseISO(log.sent_at), 'd MMM, h:mm a')
                    : '—'}
                </td>
                <td className="py-3 px-2">
                  <span className={typeMeta.cls}>{typeMeta.label}</span>
                </td>
                <td className="py-3 px-2">
                  <p className="text-gray-800 font-medium truncate max-w-[120px]">
                    {log.members?.name || '—'}
                  </p>
                  <p className="text-xs text-gray-400">{log.members?.member_code}</p>
                </td>
                <td className="py-3 px-2 max-w-[200px]">
                  <p className="text-gray-600 text-xs truncate">{log.message || '—'}</p>
                </td>
                <td className="py-3 px-2">
                  <span className={statusMeta.cls}>{statusMeta.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
