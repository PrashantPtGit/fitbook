import { useState, useEffect, useMemo } from 'react'
import { Download } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import AppLayout from '../components/layout/AppLayout'
import DueTable from '../components/fees/DueTable'
import FeePaymentHistory from '../components/fees/FeePaymentHistory'
import { SkeletonBox } from '../components/ui/Skeleton'
import { usePayments, getPendingFees } from '../hooks/usePayments'
import { useGymStore } from '../store/useGymStore'
import { formatCurrency, exportPaymentsCSV, todayISO } from '../utils/helpers'
import { supabase, supabaseReady } from '../lib/supabase'

const TABS = ['Due Now', 'Paid this month', 'All history']
const PAGE_SIZE = 20

// ─── Small summary card ───────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color = 'text-gray-900', loading }) {
  if (loading) return <div className="card"><SkeletonBox className="h-14 w-full" /></div>
  return (
    <div className="card">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Fees() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const { payments, loading: pLoading } = usePayments()

  const [activeTab,    setActiveTab]    = useState('Due Now')
  const [pendingFees,  setPendingFees]  = useState([])
  const [dueLoading,   setDueLoading]   = useState(true)
  const [summaryStats, setSummaryStats] = useState({ today: 0, month: 0, pending: 0, pendingAmt: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [historyMonth, setHistoryMonth] = useState('')   // '' = all
  const [historyPage,  setHistoryPage]  = useState(0)

  // ── Fetch pending fees & summary ──────────────────────────────────────────
  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setDueLoading(false); setStatsLoading(false); return }

    async function load() {
      setDueLoading(true)
      setStatsLoading(true)
      const today      = todayISO()
      const now        = new Date()
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')

      const [fees, todayRes, monthRes] = await Promise.all([
        getPendingFees(activeGymId),
        supabase.from('payments').select('amount').eq('gym_id', activeGymId).eq('payment_date', today),
        supabase.from('payments').select('amount').eq('gym_id', activeGymId).gte('payment_date', monthStart).lte('payment_date', monthEnd),
      ])

      setPendingFees(fees)
      setDueLoading(false)

      const todayTotal  = (todayRes.data  || []).reduce((s, p) => s + (p.amount || 0), 0)
      const monthTotal  = (monthRes.data  || []).reduce((s, p) => s + (p.amount || 0), 0)
      const pendingAmt  = fees.reduce((s, f) => s + (f.plans?.price || 0), 0)

      setSummaryStats({ today: todayTotal, month: monthTotal, pending: fees.length, pendingAmt })
      setStatsLoading(false)
    }

    load()
  }, [activeGymId])

  // ── Filter payments for tabs ──────────────────────────────────────────────
  const today      = todayISO()
  const now        = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now),   'yyyy-MM-dd')

  const thisMonthPayments = useMemo(() =>
    payments.filter((p) => p.payment_date >= monthStart && p.payment_date <= monthEnd)
  , [payments, monthStart, monthEnd])

  // Month options for history filter (last 12 months)
  const monthOptions = useMemo(() => {
    const opts = [{ value: '', label: 'All time' }]
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now, i)
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy') })
    }
    return opts
  }, [])

  const historyFiltered = useMemo(() => {
    if (!historyMonth) return payments
    return payments.filter((p) => p.payment_date?.startsWith(historyMonth))
  }, [payments, historyMonth])

  const historyPages   = Math.max(1, Math.ceil(historyFiltered.length / PAGE_SIZE))
  const historyPaged   = historyFiltered.slice(historyPage * PAGE_SIZE, (historyPage + 1) * PAGE_SIZE)

  const pendingSubtitle = `${summaryStats.pending} members pending · ${formatCurrency(summaryStats.pendingAmt)} due`

  return (
    <AppLayout pageTitle="Collect Fees" pageSubtitle={statsLoading ? 'Loading…' : pendingSubtitle}>
      {/* Header action */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => exportPaymentsCSV(payments, `fitbook-due-list-${today}.csv`)}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={14} /> Download due list
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          label="Collected today"
          value={formatCurrency(summaryStats.today)}
          sub={`${payments.filter((p) => p.payment_date === today).length} payments`}
          color="text-success-dark"
          loading={statsLoading}
        />
        <SummaryCard
          label="Pending this week"
          value={formatCurrency(summaryStats.pendingAmt)}
          sub={`${summaryStats.pending} members`}
          color="text-danger"
          loading={statsLoading}
        />
        <SummaryCard
          label="Collected this month"
          value={formatCurrency(summaryStats.month)}
          sub={`${thisMonthPayments.length} payments`}
          color="text-primary"
          loading={statsLoading}
        />
        <SummaryCard
          label="Total overdue"
          value={formatCurrency(pendingFees.filter((f) => f.end_date < today).reduce((s, f) => s + (f.plans?.price || 0), 0))}
          sub={`${pendingFees.filter((f) => f.end_date < today).length} expired`}
          color="text-warning-dark"
          loading={dueLoading}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-4 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'Due Now' && summaryStats.pending > 0 && (
              <span className="ml-1.5 badge-red">{summaryStats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Due Now ── */}
      {activeTab === 'Due Now' && (
        <div className="card">
          <DueTable pendingFees={pendingFees} loading={dueLoading} />
        </div>
      )}

      {/* ── Tab: Paid this month ── */}
      {activeTab === 'Paid this month' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {format(now, 'MMMM yyyy')} — {thisMonthPayments.length} payments
            </h3>
            <button
              onClick={() => exportPaymentsCSV(thisMonthPayments, `fitbook-payments-${format(now, 'yyyy-MM')}.csv`)}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <Download size={12} /> Export
            </button>
          </div>
          <FeePaymentHistory
            payments={thisMonthPayments}
            loading={pLoading}
            showMember
            showExport={false}
          />
        </div>
      )}

      {/* ── Tab: All history ── */}
      {activeTab === 'All history' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700">Payment history</h3>
            <div className="flex gap-2 items-center">
              <select
                value={historyMonth}
                onChange={(e) => { setHistoryMonth(e.target.value); setHistoryPage(0) }}
                className="input w-auto text-xs"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => exportPaymentsCSV(historyFiltered, `fitbook-payments-history.csv`)}
                className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
              >
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          <FeePaymentHistory
            payments={historyPaged}
            loading={pLoading}
            showMember
            showExport={false}
          />

          {/* Pagination */}
          {historyFiltered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {historyPage + 1} of {historyPages}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(historyPages - 1, p + 1))}
                disabled={historyPage >= historyPages - 1}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
