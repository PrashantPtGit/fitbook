import { format, parseISO } from 'date-fns'
import { Clock, Fingerprint } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { SkeletonRow } from '../ui/Skeleton'

const SOURCE_META = {
  fingerprint: {
    label: 'Fingerprint',
    cls:   'bg-primary-light text-primary-dark',
    Icon:  Fingerprint,
  },
  manual: {
    label: 'Manual',
    cls:   'bg-neutral-50 text-neutral-600',
    Icon:  null,
  },
  qr: {
    label: 'QR',
    cls:   'bg-blue-50 text-blue-700',
    Icon:  null,
  },
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || SOURCE_META.manual
  const Icon = meta.Icon
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${meta.cls}`}>
      {Icon && <Icon size={9} />}
      {meta.label}
    </span>
  )
}

export default function TodayList({ todayAttendance, loading, isConnected }) {
  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">
          Today's check-ins ({todayAttendance.length})
        </h3>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected ? 'bg-success animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Connecting…'}</span>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : todayAttendance.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 flex-1">
          <Clock size={30} className="text-gray-200" />
          <p className="text-sm font-medium text-gray-500">No check-ins yet today</p>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Members will appear here<br />as they check in
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto divide-y divide-gray-50 flex-1 -mx-1 px-1">
          {todayAttendance.map((a, i) => (
            <div key={a.id || i} className="flex items-center gap-2.5 py-2.5">
              <Avatar name={a.members?.name || '?'} size="sm" gymIndex={i % 3} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {a.members?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">{a.members?.member_code || '—'}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {a.checked_in_at && (
                  <span className="text-xs text-gray-500">
                    {format(parseISO(a.checked_in_at), 'h:mm a')}
                  </span>
                )}
                <SourceBadge source={a.source} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
