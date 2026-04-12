import { formatDate, formatCurrency } from '../../utils/helpers'

const MODE_LABEL = { upi: 'UPI', cash: 'Cash', online: 'Bank Transfer' }

export default function ReceiptPreview({
  member,
  plan,
  amount,
  mode,
  startDate,
  endDate,
  gymName,
}) {
  if (!member || !plan) return null

  return (
    <div className="rounded-card border-2 border-success bg-success-light p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-success">
        <div>
          <p className="text-sm font-bold text-success-dark">{gymName || 'FitBook Gym'}</p>
          <p className="text-xs text-success-dark opacity-70">Payment Receipt</p>
        </div>
        <span className="text-xs bg-success text-white px-2 py-0.5 rounded-full font-medium">
          Receipt will be sent on WhatsApp
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <Row label="Member"  value={`${member.name} (${member.member_code || '—'})`} />
        <Row label="Plan"    value={`${plan.name} · ${plan.duration_days} days`} />
        <Row
          label="Valid"
          value={
            startDate && endDate
              ? `${formatDate(startDate)} → ${formatDate(endDate)}`
              : '—'
          }
        />
        <Row
          label="Paid"
          value={`${formatCurrency(amount || 0)} via ${MODE_LABEL[mode] || mode}`}
          bold
        />
        <Row label="Date" value={startDate ? formatDate(startDate) : '—'} />
      </div>

      {/* Footer */}
      <p className="text-xs text-success-dark mt-4 pt-3 border-t border-success text-center font-medium">
        Thank you for your payment! — FitBook
      </p>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-800 text-right ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}
