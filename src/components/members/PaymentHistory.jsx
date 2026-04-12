import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { supabase, supabaseReady } from '../../lib/supabase'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { SkeletonRow } from '../ui/Skeleton'

const MODE_LABEL = { upi: 'UPI', cash: 'Cash', online: 'Online', card: 'Card' }

export default function PaymentHistory({ memberId, gymId }) {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!supabaseReady || !memberId || !gymId) { setLoading(false); return }

    async function fetchPayments() {
      setLoading(true)
      const { data } = await supabase
        .from('payments')
        .select('*, plans(name)')
        .eq('member_id', memberId)
        .eq('gym_id',    gymId)
        .order('payment_date', { ascending: false })
      setPayments(data || [])
      setLoading(false)
    }

    fetchPayments()
  }, [memberId, gymId])

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Total paid</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>
        <span className="text-xs text-gray-400">
          {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['Date', 'Plan', 'Amount', 'Mode', 'Transaction ID', ''].map((h) => (
                  <th key={h} className="pb-2.5 px-1 text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="text-sm hover:bg-gray-50">
                  <td className="py-3 px-1 text-gray-600 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                  <td className="py-3 px-1 text-gray-600">{p.plans?.name || '—'}</td>
                  <td className="py-3 px-1 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {MODE_LABEL[p.payment_mode] || p.payment_mode}
                    </span>
                  </td>
                  <td className="py-3 px-1 text-xs text-gray-400 font-mono">
                    {p.transaction_id || '—'}
                  </td>
                  <td className="py-3 px-1">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
                    >
                      <Download size={12} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
