import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, getDaysInMonth, parseISO, subDays } from 'date-fns'
import { Download, TrendingUp, Users, CreditCard, CalendarCheck, X, CheckSquare, Square } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  PieChart, Pie,
} from 'recharts'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import RevenueChart from '../components/reports/RevenueChart'
import MemberGrowthChart from '../components/reports/MemberGrowthChart'
import AttendanceHeatmap from '../components/reports/AttendanceHeatmap'
import PlanBreakdown from '../components/reports/PlanBreakdown'
import GymComparison from '../components/reports/GymComparison'
import { SkeletonMetricCard, SkeletonBox } from '../components/ui/Skeleton'
import { useReports } from '../hooks/useReports'
import { useGymStore } from '../store/useGymStore'
import { supabase, supabaseReady } from '../lib/supabase'
import { formatCurrency, formatDate, todayISO, exportMembersCSV, exportPaymentsCSV } from '../utils/helpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PAY_MODE_COLORS = { upi: '#534AB7', cash: '#6b7280', transfer: '#1D9E75', other: '#AFA9EC' }

function exportAttendanceCSV(rows, monthLabel) {
  const headers = ['Date', 'Check-ins']
  const escape  = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv     = [headers, ...rows.map((r) => [r.date, r.count])].map((r) => r.map(escape).join(',')).join('\n')
  const blob    = new Blob([csv], { type: 'text/csv' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = url
  a.download    = `fitbook-attendance-${monthLabel}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card mb-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub, icon: Icon, iconBg, loading }) {
  if (loading) return <SkeletonMetricCard />
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-400">{label}</p>
        <div className={`w-8 h-8 rounded-btn flex items-center justify-center ${iconBg}`}>
          <Icon size={14} className="text-white" />
        </div>
      </div>
      <p className="text-xl font-semibold text-gray-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function PayModePie({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <p className="text-xs text-gray-400 text-center py-6">No payment data this month</p>
  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={PAY_MODE_COLORS[d.name.toLowerCase()] || '#AFA9EC'} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [formatCurrency(v), n]}
            contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-1">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: PAY_MODE_COLORS[d.name.toLowerCase()] || '#AFA9EC' }} />
                <span className="text-gray-700">{d.name}</span>
              </div>
              <span className="text-gray-500">{formatCurrency(d.value)} · {pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DailyAttChart({ data, avg }) {
  if (!data.length) return <p className="text-xs text-gray-400 text-center py-6">No attendance data this month</p>
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} interval={4} />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [v, 'Check-ins']}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
        {avg > 0 && (
          <ReferenceLine y={avg} stroke="#BA7517" strokeDasharray="4 3" strokeWidth={1.5} />
        )}
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => {
            const color = d.count > avg ? '#1D9E75' : d.count < avg && d.count > 0 ? '#A32D2D' : '#AFA9EC'
            return <Cell key={i} fill={color} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ExportModal({ isOpen, onClose, gymId, payments, dailyAttData, monthLabel }) {
  const [checks, setChecks] = useState({ members: true, payments: true, attendance: false })
  const [loading, setLoading] = useState(false)

  function toggle(k) { setChecks((c) => ({ ...c, [k]: !c[k] })) }

  async function handleDownload() {
    if (!Object.values(checks).some(Boolean)) { toast.error('Select at least one export'); return }
    setLoading(true)
    try {
      if (checks.members) {
        const { data } = await supabase.from('members')
          .select('*, memberships(start_date, end_date, status, plans(name, price)), trainers(name)')
          .eq('gym_id', gymId)
        exportMembersCSV(data || [])
        await new Promise((r) => setTimeout(r, 400))
      }
      if (checks.payments) {
        exportPaymentsCSV(payments, `fitbook-payments-${monthLabel}.csv`)
        await new Promise((r) => setTimeout(r, 400))
      }
      if (checks.attendance) {
        exportAttendanceCSV(dailyAttData, monthLabel)
      }
      toast.success('Download complete')
      onClose()
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null
  const items = [
    { key: 'members',    label: 'Members list',      sub: 'All member details' },
    { key: 'payments',   label: 'Payments report',   sub: 'This month\'s payments' },
    { key: 'attendance', label: 'Attendance report',  sub: 'Daily check-in counts' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Export data</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3 mb-5">
          {items.map(({ key, label, sub }) => (
            <button key={key} onClick={() => toggle(key)} className="w-full flex items-start gap-3 text-left">
              {checks[key]
                ? <CheckSquare size={18} className="text-primary mt-0.5 shrink-0" />
                : <Square     size={18} className="text-gray-300 mt-0.5 shrink-0" />}
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download size={14} />
          {loading ? 'Downloading…' : 'Download selected'}
        </button>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Reports() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gyms        = useGymStore((s) => s.gyms)

  const { monthlyRevenue, breakdown, loading: reportsLoading } = useReports()

  const [metrics,     setMetrics]     = useState(null)
  const [payModeData, setPayModeData] = useState([])
  const [recentPays,  setRecentPays]  = useState([])
  const [dailyAtt,    setDailyAtt]    = useState([])
  const [avgAtt,      setAvgAtt]      = useState(0)
  const [metricsLoad, setMetricsLoad] = useState(true)
  const [showExport,  setShowExport]  = useState(false)
  const [showAllPays, setShowAllPays] = useState(false)

  const today      = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(today),   'yyyy-MM-dd')
  const monthLabel = format(today, 'MMM-yyyy')

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setMetricsLoad(false); return }
    fetchMetrics()
  }, [activeGymId])

  async function fetchMetrics() {
    setMetricsLoad(true)
    const [payRes, pendingRes, newMembRes, attRes, payModeRes, recentPayRes] = await Promise.all([
      supabase.from('payments').select('amount').eq('gym_id', activeGymId).gte('payment_date', monthStart).lte('payment_date', monthEnd),
      supabase.from('memberships').select('plans(price)').eq('gym_id', activeGymId).eq('status', 'active').lt('end_date', todayISO()),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', activeGymId).gte('created_at', monthStart + 'T00:00:00'),
      supabase.from('attendance').select('date').eq('gym_id', activeGymId).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('payments').select('payment_mode, amount').eq('gym_id', activeGymId).gte('payment_date', monthStart).lte('payment_date', monthEnd),
      supabase.from('payments').select('payment_date, amount, payment_mode, members(name, member_code), plans(name)').eq('gym_id', activeGymId).gte('payment_date', monthStart).order('payment_date', { ascending: false }).limit(20),
    ])

    // Metrics
    const collected  = (payRes.data || []).reduce((s, p) => s + (p.amount || 0), 0)
    const pending    = (pendingRes.data || []).reduce((s, m) => s + (m.plans?.price || 0), 0)
    const newMembers = newMembRes.count || 0

    // Daily attendance
    const dayMap = {}
    ;(attRes.data || []).forEach((r) => { dayMap[r.date] = (dayMap[r.date] || 0) + 1 })
    const daysInMonth = getDaysInMonth(today)
    const dailyData = Array.from({ length: Math.min(daysInMonth, today.getDate()) }, (_, i) => {
      const dayNum  = i + 1
      const dateStr = format(new Date(today.getFullYear(), today.getMonth(), dayNum), 'yyyy-MM-dd')
      return { day: dayNum, date: dateStr, count: dayMap[dateStr] || 0 }
    })
    const daysWithData = dailyData.filter((d) => d.count > 0).length
    const totalAtt     = dailyData.reduce((s, d) => s + d.count, 0)
    const avg          = daysWithData > 0 ? Math.round(totalAtt / daysWithData) : 0

    // Payment mode breakdown
    const modeMap = {}
    ;(payModeRes.data || []).forEach((p) => {
      const mode = (p.payment_mode || 'other').toLowerCase()
      modeMap[mode] = (modeMap[mode] || 0) + (p.amount || 0)
    })
    const modeArr = Object.entries(modeMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))

    setMetrics({ collected, pending, newMembers, avgAtt: avg })
    setDailyAtt(dailyData)
    setAvgAtt(avg)
    setPayModeData(modeArr)
    setRecentPays(recentPayRes.data || [])
    setMetricsLoad(false)
  }

  const displayedPays = showAllPays ? recentPays : recentPays.slice(0, 10)
  const payTotal      = recentPays.reduce((s, p) => s + (p.amount || 0), 0)
  const isAllGyms     = !activeGymId

  return (
    <AppLayout pageTitle="Reports" pageSubtitle="Your gym performance at a glance">
      <div className="page-enter">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-5">
          <div />
          <button
            onClick={() => setShowExport(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={14} />
            Export to CSV
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard label="Collected this month" value={formatCurrency(metrics?.collected ?? 0)} sub="from payments" icon={TrendingUp} iconBg="bg-primary" loading={metricsLoad} />
          <MetricCard label="Pending fees"         value={formatCurrency(metrics?.pending ?? 0)}   sub="overdue members" icon={CreditCard} iconBg="bg-danger" loading={metricsLoad} />
          <MetricCard label="New members"          value={metrics?.newMembers ?? 0}                sub="joined this month" icon={Users} iconBg="bg-success" loading={metricsLoad} />
          <MetricCard label="Avg daily attendance" value={`${metrics?.avgAtt ?? 0}/day`}           sub="this month" icon={CalendarCheck} iconBg="bg-warning" loading={metricsLoad} />
        </div>

        {/* Section 1 — Revenue */}
        <SectionCard title="Revenue — last 6 months" subtitle="Bar chart of monthly collections">
          <RevenueChart data={monthlyRevenue} loading={reportsLoading} />
        </SectionCard>

        {/* Section 2 — Member analytics */}
        <SectionCard title="Member analytics" subtitle="Plan distribution and growth trend">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3">Membership plan distribution</p>
              <PlanBreakdown data={breakdown} loading={reportsLoading} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3">Member growth — last 6 months</p>
              <MemberGrowthChart />
            </div>
          </div>
        </SectionCard>

        {/* Section 3 — Attendance */}
        <SectionCard title="Attendance trends" subtitle="Daily check-ins and peak hour heatmap">
          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Daily attendance — {format(today, 'MMMM yyyy')}
                {avgAtt > 0 && <span className="text-gray-400"> · avg {avgAtt}/day</span>}
              </p>
              <DailyAttChart data={dailyAtt} avg={avgAtt} />
              {avgAtt > 0 && (
                <p className="text-[10px] text-warning mt-1">— dashed line = daily average ({avgAtt})</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Peak hours heatmap — last 30 days</p>
              <AttendanceHeatmap />
            </div>
          </div>
        </SectionCard>

        {/* Section 4 — Fee collection */}
        <SectionCard title="Fee collection breakdown" subtitle="Payment modes and recent transactions">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Payment mode breakdown</p>
              {metricsLoad
                ? <SkeletonBox className="h-40 w-full" />
                : <PayModePie data={payModeData} />}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Recent payments this month</p>
              {metricsLoad
                ? <SkeletonBox className="h-40 w-full" />
                : recentPays.length === 0
                ? <p className="text-xs text-gray-400 text-center py-6">No payments this month</p>
                : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {['Date', 'Member', 'Plan', 'Amount', 'Mode'].map((h) => (
                              <th key={h} className="pb-2 px-1 text-[10px] text-gray-400 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {displayedPays.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-2 px-1 whitespace-nowrap text-gray-500">{p.payment_date ? format(parseISO(p.payment_date), 'd MMM') : '—'}</td>
                              <td className="py-2 px-1 font-medium text-gray-800 truncate max-w-[80px]">{p.members?.name || '—'}</td>
                              <td className="py-2 px-1 text-gray-500 truncate max-w-[80px]">{p.plans?.name || '—'}</td>
                              <td className="py-2 px-1 font-medium text-gray-800 whitespace-nowrap">{formatCurrency(p.amount || 0)}</td>
                              <td className="py-2 px-1 text-gray-500 capitalize">{p.payment_mode || '—'}</td>
                            </tr>
                          ))}
                          {/* Total row */}
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={3} className="py-2 px-1 text-gray-600">Total ({recentPays.length} payments)</td>
                            <td className="py-2 px-1 text-primary-dark">{formatCurrency(payTotal)}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {recentPays.length > 10 && (
                      <button
                        onClick={() => setShowAllPays((v) => !v)}
                        className="text-xs text-primary font-medium mt-2 hover:underline"
                      >
                        {showAllPays ? 'Show less' : `View all ${recentPays.length} payments`}
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
        </SectionCard>

        {/* Section 5 — All gyms comparison */}
        {isAllGyms && gyms.length > 1 && (
          <SectionCard title="Performance across all locations" subtitle="Side-by-side gym comparison">
            <GymComparison gyms={gyms} />
          </SectionCard>
        )}

        {/* Export modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          gymId={activeGymId}
          payments={recentPays}
          dailyAttData={dailyAtt}
          monthLabel={monthLabel}
        />
      </div>
    </AppLayout>
  )
}
