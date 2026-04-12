import { useNavigate } from 'react-router-dom'
import { MessageCircle, IndianRupee } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { SkeletonRow } from '../ui/Skeleton'
import {
  getMembershipStatus, formatDate, formatCurrency, daysFromNow,
  generateWhatsAppLink, buildRenewalMessage,
} from '../../utils/helpers'
import { useGymStore } from '../../store/useGymStore'

export default function DueTable({ pendingFees, loading }) {
  const navigate  = useNavigate()
  const activeGym = useGymStore((s) => s.activeGym)

  if (loading) {
    return (
      <div className="divide-y divide-gray-50 px-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (pendingFees.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <span className="text-4xl">🎉</span>
        <p className="text-sm font-semibold text-gray-700">All fees collected!</p>
        <p className="text-xs text-gray-400">No pending dues for this gym.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              {['Member', 'Plan', 'Due date', 'Amount', 'Urgency', 'WhatsApp', 'Action'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pendingFees.map((fee, i) => {
              const m    = fee.members
              const days = daysFromNow(fee.end_date)
              const amt  = fee.plans?.price || 0

              let urgencyVariant = 'green'
              let urgencyLabel   = `In ${days} days`
              if (days < 0)       { urgencyVariant = 'red';   urgencyLabel = `${Math.abs(days)}d overdue` }
              else if (days === 0) { urgencyVariant = 'red';   urgencyLabel = 'Due today' }
              else if (days <= 3)  { urgencyVariant = 'red';   urgencyLabel = `${days}d left` }
              else if (days <= 7)  { urgencyVariant = 'amber'; urgencyLabel = `${days}d left` }

              const waMsg = buildRenewalMessage(m?.name || '', activeGym?.name || 'the gym', fee.plans?.name || '', amt, formatDate(fee.end_date))

              return (
                <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m?.name || '?'} size="sm" gymIndex={i % 3} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m?.name}</p>
                        <p className="text-xs text-gray-400">{m?.member_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fee.plans?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(fee.end_date)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatCurrency(amt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={urgencyVariant}>{urgencyLabel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => m?.phone && window.open(generateWhatsAppLink(m.whatsapp || m.phone, waMsg), '_blank')}
                      className="flex items-center gap-1 text-xs text-success-dark bg-success-light hover:opacity-80 px-2.5 py-1.5 rounded-btn transition-opacity"
                    >
                      <MessageCircle size={12} />
                      Remind
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/fees/collect/${m?.id}`)}
                      className="flex items-center gap-1 text-xs btn-primary px-3 py-1.5"
                    >
                      <IndianRupee size={12} />
                      Collect
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {pendingFees.map((fee, i) => {
          const m    = fee.members
          const days = daysFromNow(fee.end_date)
          const amt  = fee.plans?.price || 0

          let urgencyVariant = 'green'
          let urgencyLabel   = `In ${days}d`
          if (days < 0)       { urgencyVariant = 'red';   urgencyLabel = `${Math.abs(days)}d overdue` }
          else if (days === 0) { urgencyVariant = 'red';   urgencyLabel = 'Due today' }
          else if (days <= 3)  { urgencyVariant = 'red';   urgencyLabel = `${days}d left` }
          else if (days <= 7)  { urgencyVariant = 'amber'; urgencyLabel = `${days}d left` }

          const waMsg = buildRenewalMessage(m?.name || '', activeGym?.name || 'the gym', fee.plans?.name || '', amt, formatDate(fee.end_date))

          return (
            <div key={fee.id} className="py-3 px-1 flex items-center gap-3">
              <Avatar name={m?.name || '?'} size="sm" gymIndex={i % 3} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-800 truncate">{m?.name}</p>
                  <Badge variant={urgencyVariant}>{urgencyLabel}</Badge>
                </div>
                <p className="text-xs text-gray-400">
                  {fee.plans?.name || '—'} · {formatCurrency(amt)}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => m?.phone && window.open(generateWhatsAppLink(m.whatsapp || m.phone, waMsg), '_blank')}
                  className="flex items-center gap-1 text-xs text-success-dark bg-success-light hover:opacity-80 px-2 py-1 rounded-btn transition-opacity"
                >
                  <MessageCircle size={11} /> Remind
                </button>
                <button
                  onClick={() => navigate(`/fees/collect/${m?.id}`)}
                  className="flex items-center gap-1 text-xs btn-primary px-2 py-1"
                >
                  <IndianRupee size={11} /> Collect
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
