import { format, parseISO, differenceInDays } from 'date-fns'
import { MessageCircle, CreditCard } from 'lucide-react'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { formatDate, formatCurrency, daysFromNow, generateWhatsAppLink } from '../../utils/helpers'

const MODE_COLORS = {
  upi:      { bg: 'bg-purple-50',  text: 'text-purple-700'  },
  cash:     { bg: 'bg-gray-50',    text: 'text-gray-600'    },
  transfer: { bg: 'bg-green-50',   text: 'text-green-700'   },
  other:    { bg: 'bg-yellow-50',  text: 'text-yellow-700'  },
}

export default function MemberPayments() {
  const { member, membership, payments, loading } = useMemberPortal()

  const totalPaid  = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const daysLeft   = membership ? daysFromNow(membership.end_date) : null
  const isExpiring = daysLeft !== null && daysLeft <= 14

  const trainerPhone = member?.trainers?.phone
  const waLink = trainerPhone
    ? generateWhatsAppLink(
        trainerPhone,
        `Hi, I'd like to renew my membership (${membership?.plans?.name || 'plan'}). My membership expires on ${formatDate(membership?.end_date)}. - ${member?.name}`
      )
    : null

  if (loading) {
    return (
      <MemberPortalLayout title="Payments">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl h-24" />)}
        </div>
      </MemberPortalLayout>
    )
  }

  return (
    <MemberPortalLayout title="Payments">
      {/* Renewal reminder banner */}
      {isExpiring && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            ⚠️ Membership expires {daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Expiry: {formatDate(membership?.end_date)}. Contact your trainer to renew.
          </p>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-btn transition-colors"
            >
              <MessageCircle size={12} /> WhatsApp trainer to renew
            </a>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total paid',    value: formatCurrency(totalPaid) },
          { label: 'Plan cost',     value: membership ? formatCurrency(membership.plans?.price || 0) : '—' },
          { label: 'Next renewal',  value: formatDate(membership?.end_date) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment History</p>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No payments found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((p, i) => {
              const modeKey = (p.payment_mode || 'other').toLowerCase()
              const modeStyle = MODE_COLORS[modeKey] || MODE_COLORS.other
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        {formatCurrency(p.amount || 0)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${modeStyle.bg} ${modeStyle.text} capitalize`}>
                        {p.payment_mode || 'other'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.plans?.name || 'Plan'} · {formatDate(p.payment_date)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MemberPortalLayout>
  )
}
