import { Download } from 'lucide-react'
import { formatDate, formatCurrency, exportPaymentsCSV } from '../../utils/helpers'
import { SkeletonRow } from '../ui/Skeleton'

const MODE_META = {
  upi:    { label: 'UPI',      cls: 'bg-blue-50 text-blue-700' },
  cash:   { label: 'Cash',     cls: 'bg-gray-100 text-gray-600' },
  online: { label: 'Transfer', cls: 'bg-purple-50 text-purple-700' },
  card:   { label: 'Card',     cls: 'bg-gray-100 text-gray-600' },
}

export default function FeePaymentHistory({
  payments,
  loading,
  showMember = true,
  showExport = false,
  filename,
}) {
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0)

  if (loading) {
    return (
      <div className="divide-y divide-gray-50 px-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">No payments found.</p>
    )
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-gray-400">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        {showExport && (
          <button
            onClick={() => exportPaymentsCSV(payments, filename)}
            className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5"
          >
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium whitespace-nowrap">Date</th>
              {showMember && <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium">Member</th>}
              <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium">Plan</th>
              <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium">Amount</th>
              <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium">Mode</th>
              <th className="pb-2.5 px-1 text-xs text-gray-400 font-medium whitespace-nowrap">Transaction ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map((p) => {
              const meta = MODE_META[p.payment_mode] || { label: p.payment_mode, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={p.id} className="text-sm hover:bg-gray-50">
                  <td className="py-3 px-1 text-gray-600 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                  {showMember && (
                    <td className="py-3 px-1">
                      <p className="text-gray-800 font-medium">{p.members?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{p.members?.member_code}</p>
                    </td>
                  )}
                  <td className="py-3 px-1 text-gray-600">{p.plans?.name || '—'}</td>
                  <td className="py-3 px-1 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3 px-1 text-xs text-gray-400 font-mono">
                    {p.transaction_id || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Total row */}
      <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500 font-medium">Total collected</span>
        <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
