import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Trash2, PauseCircle, PlayCircle,
  Phone, Calendar, User, MapPin, Heart,
  Activity, CreditCard, MessageCircle, Clock, Fingerprint, Shield,
} from 'lucide-react'
import { differenceInDays, format, parseISO, isValid, startOfMonth, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import AttendanceCalendar from '../components/attendance/AttendanceCalendar'
import PaymentHistory from '../components/members/PaymentHistory'
import EditMemberModal from '../components/members/EditMemberModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { supabase, supabaseReady } from '../lib/supabase'
import { syncMemberToHikvision } from '../lib/hikvisionSync'
import {
  getMembershipStatus, formatDate, formatCurrency, daysFromNow,
  generateWhatsAppLink, buildRenewalMessage, buildPaymentReceiptMessage,
} from '../utils/helpers'
import { SkeletonCard } from '../components/ui/Skeleton'
import { createMemberAccount, getMemberAccountStatus } from '../scripts/createMemberAccount'

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Attendance', 'Payments']

// ─── Small detail row ─────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 break-words">{value}</p>
      </div>
    </div>
  )
}

// ─── WhatsApp action button ───────────────────────────────────────────────────
function WAButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-xs text-success-dark bg-success-light hover:opacity-80 px-3 py-2 rounded-btn transition-opacity w-full"
    >
      <MessageCircle size={13} />
      {label}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MemberProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [member,       setMember]       = useState(null)
  const [payments,     setPayments]     = useState([])
  const [attendance,   setAttendance]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('Overview')
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteModal,  setDeleteModal]  = useState(false)
  const [pauseModal,   setPauseModal]   = useState(false)
  const [actioning,    setActioning]    = useState(false)
  const [hasPortal,    setHasPortal]    = useState(false)
  const [portalLoad,   setPortalLoad]   = useState(true)
  const [createModal,  setCreateModal]  = useState(false)
  const [newPassword,  setNewPassword]  = useState('')
  const [creating,     setCreating]     = useState(false)
  const [machineLoading, setMachineLoading] = useState(false)

  // Check portal account status when member loads
  useEffect(() => {
    if (!member) return
    setPortalLoad(true)
    getMemberAccountStatus(member.id)
      .then(({ hasAccount }) => setHasPortal(hasAccount))
      .finally(() => setPortalLoad(false))
  }, [member?.id])

  async function handleCreatePortal() {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setCreating(true)
    const result = await createMemberAccount(member.id, member.phone, newPassword)
    setCreating(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setHasPortal(true)
      setCreateModal(false)
      setNewPassword('')
      toast.success(`Login created! Member can login with phone: ${member.phone}`)
    }
  }

  // Fetch member + related data
  useEffect(() => {
    if (!supabaseReady || !id) return

    async function fetchAll() {
      setLoading(true)

      const [memberRes, paymentsRes, attendanceRes] = await Promise.all([
        supabase
          .from('members')
          .select('*, memberships(*, plans(name, duration_days, price)), trainers(name), gyms(name, location)')
          .eq('id', id)
          .single(),

        supabase
          .from('payments')
          .select('*, plans(name)')
          .eq('member_id', id)
          .order('payment_date', { ascending: false }),

        supabase
          .from('attendance')
          .select('date, checked_in_at, source')
          .eq('member_id', id)
          .order('date', { ascending: false })
          .limit(200),
      ])

      if (memberRes.error) {
        toast.error('Member not found')
        navigate('/members')
        return
      }

      setMember(memberRes.data)
      setPayments(paymentsRes.data || [])
      setAttendance(attendanceRes.data || [])
      setLoading(false)
    }

    fetchAll()
  }, [id, navigate])

  // 6-month attendance chart data
  const monthlyAttendance = useMemo(() => {
    const now = new Date()
    const months = {}
    for (let i = 5; i >= 0; i--) {
      const d   = subMonths(now, i)
      const key = format(d, 'yyyy-MM')
      months[key] = { label: format(d, 'MMM'), count: 0 }
    }
    attendance.forEach((a) => {
      const key = a.date?.substring(0, 7)
      if (key && months[key]) months[key].count++
    })
    return Object.entries(months).map(([key, v]) => ({ key, ...v }))
  }, [attendance])

  // This-month attendance count
  const thisMonthKey     = format(new Date(), 'yyyy-MM')
  const thisMonthCount   = attendance.filter((a) => a.date?.startsWith(thisMonthKey)).length
  const daysInThisMonth  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const thisMonthPct     = Math.round((thisMonthCount / daysInThisMonth) * 100)

  // Derived values
  const membership = useMemo(() => {
    if (!member?.memberships?.length) return null
    return [...member.memberships].sort((a, b) =>
      (b.end_date || '') > (a.end_date || '') ? 1 : -1
    )[0]
  }, [member])

  const memStatus    = membership ? getMembershipStatus(membership.end_date) : null
  const daysLeft     = membership ? daysFromNow(membership.end_date) : null
  const daysAsMember = member
    ? Math.max(0, differenceInDays(new Date(), parseISO(member.created_at)))
    : 0

  const totalPaid   = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const lastPayment = payments[0]

  const planDays     = membership?.plans?.duration_days || 1
  const daysUsed     = membership
    ? Math.max(0, differenceInDays(new Date(), parseISO(membership.start_date)))
    : 0
  const progressPct  = Math.min(100, Math.round((daysUsed / planDays) * 100))

  const needsCollect = memStatus && ['expired', 'critical', 'warning'].includes(memStatus.status)

  // WhatsApp helpers
  function sendRenewal() {
    if (!member?.phone) return
    const msg = buildRenewalMessage(
      member.name,
      member.gyms?.name || 'the gym',
      membership?.plans?.name || '',
      membership?.plans?.price || 0,
      formatDate(membership?.end_date)
    )
    window.open(generateWhatsAppLink(member.phone, msg), '_blank')
  }

  function sendCustom() {
    if (!member?.phone) return
    const msg = encodeURIComponent(`Hi ${member.name}! `)
    window.open(`https://wa.me/91${member.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  async function handleDelete() {
    setActioning(true)
    const mid = member.id
    const steps = [
      supabase.from('hikvision_commands').delete().eq('member_id', mid),
      supabase.from('attendance').delete().eq('member_id', mid),
      supabase.from('payments').delete().eq('member_id', mid),
      supabase.from('memberships').delete().eq('member_id', mid),
    ]
    for (const step of steps) {
      const { error } = await step
      if (error) { setActioning(false); toast.error(error.message); return }
    }
    const { error } = await supabase.from('members').delete().eq('id', mid)
    setActioning(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${member.name} has been removed`)
    navigate('/members')
  }

  async function handleMachineAction(action) {
    setMachineLoading(true)
    const endDate = membership?.end_date
      ? new Date(membership.end_date).toISOString().split('T')[0]
      : null
    const result = await syncMemberToHikvision(supabase, member.id, member.gym_id, action, endDate)
    setMachineLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else if (result.method === 'queued') {
      toast.success(action === 'disable' ? 'Block queued — will apply within 1 minute' : 'Unblock queued — will apply within 1 minute')
    } else {
      toast.success(action === 'disable' ? 'Member blocked on machine' : 'Member unblocked on machine')
    }
  }

  async function handlePauseResume() {
    const isPaused  = member.status === 'paused'
    const newStatus = isPaused ? 'active' : 'paused'
    setActioning(true)
    await Promise.all([
      supabase.from('members').update({ status: newStatus }).eq('id', member.id),
      membership && supabase.from('memberships').update({ status: newStatus }).eq('id', membership.id),
    ])
    setActioning(false)
    setMember((m) => ({ ...m, status: newStatus }))
    setPauseModal(false)
    toast.success(isPaused ? `${member.name} reactivated` : `${member.name} paused`)
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout pageTitle="Member Profile">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard className="lg:col-span-2" />
          <SkeletonCard />
          <SkeletonCard className="lg:col-span-2" />
          <SkeletonCard />
        </div>
      </AppLayout>
    )
  }

  if (!member) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      pageTitle={member.name}
      pageSubtitle={member.member_code || 'Member profile'}
    >
      {/* Back */}
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> Back to members
      </button>

      {/* Header card */}
      <div className="card mb-4 flex flex-wrap items-center gap-4">
        <Avatar name={member.name} size="lg" gymIndex={0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">{member.name}</h2>
            {member.status === 'paused'
              ? <span className="badge-gray">Paused</span>
              : memStatus && <Badge variant={memStatus.badgeVariant}>{memStatus.label}</Badge>
            }
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{member.member_code} · {member.gyms?.name}</p>
          {member.batch_timing && (
            <p className="text-xs text-gray-400">{member.batch_timing}</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {needsCollect && (
            <button
              onClick={() => navigate(`/fees/collect/${member.id}`)}
              className="btn-danger text-sm flex items-center gap-1.5"
            >
              <CreditCard size={14} /> Collect fee
            </button>
          )}
          <button
            onClick={() => setEditOpen(true)}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-3 py-1.5 text-sm text-danger border border-danger-light bg-danger-light hover:bg-danger hover:text-white rounded-btn transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-100">
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
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Left column (3/5) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Personal details */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Personal details</h3>
              <div className="divide-y divide-gray-50">
                <DetailRow icon={Phone}       label="Phone / WhatsApp" value={member.phone} />
                <DetailRow icon={Calendar}    label="Date of birth"    value={member.date_of_birth ? formatDate(member.date_of_birth) : null} />
                <DetailRow icon={User}        label="Gender"           value={member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : null} />
                <DetailRow icon={MapPin}      label="Address"          value={member.address} />
                <DetailRow icon={Phone}       label="Emergency contact" value={member.emergency_contact} />
                <DetailRow icon={Heart}       label="Health notes"     value={member.health_notes} />
                <DetailRow icon={Fingerprint} label="Fingerprint ID"   value={member.fingerprint_id ? String(member.fingerprint_id) : null} />
                <DetailRow icon={User}        label="Trainer"          value={member.trainers?.name} />
              </div>
            </div>

            {/* Membership */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current membership</h3>
              {membership ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-base font-semibold text-gray-800">{membership.plans?.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(membership.start_date)} → {formatDate(membership.end_date)}
                      </p>
                    </div>
                    {memStatus && <Badge variant={memStatus.badgeVariant}>{memStatus.label}</Badge>}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Plan progress</span>
                      <span>{daysUsed} / {planDays} days</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {daysLeft !== null && (
                    <p className="text-xs text-gray-400 mt-2">
                      {daysLeft > 0
                        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                        : daysLeft === 0 ? 'Expires today'
                        : `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`}
                    </p>
                  )}

                  {/* Pause / Resume */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {member.status === 'paused' ? (
                      <button
                        onClick={handlePauseResume}
                        disabled={actioning}
                        className="flex items-center gap-1.5 text-xs text-success-dark bg-success-light hover:bg-success hover:text-white px-3 py-1.5 rounded-btn transition-colors disabled:opacity-60"
                      >
                        <PlayCircle size={13} /> Resume membership
                      </button>
                    ) : (
                      <button
                        onClick={() => setPauseModal(true)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-btn transition-colors"
                      >
                        <PauseCircle size={13} /> Pause membership
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">No active membership</p>
              )}
            </div>
          </div>

          {/* Right column (2/5) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Quick stats */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total visits',    value: attendance.length },
                  { label: 'Days as member',  value: daysAsMember },
                  { label: 'Last visited',
                    value: attendance[0]
                      ? formatDate(attendance[0].date)
                      : 'Never' },
                  { label: 'Member since',    value: formatDate(member.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-btn p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment summary */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total paid</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last payment</span>
                  <span className="text-gray-800">{lastPayment ? formatDate(lastPayment.payment_date) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mode</span>
                  <span className="text-gray-800 capitalize">{lastPayment?.payment_mode || '—'}</span>
                </div>
              </div>
            </div>

            {/* Member Portal Access */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Member Portal Access</h3>
              {portalLoad ? (
                <p className="text-xs text-gray-400">Checking…</p>
              ) : hasPortal ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-success-light text-success-dark px-2.5 py-1 rounded-full font-medium">
                    ✓ Active
                  </span>
                  <p className="text-xs text-gray-400">Login: {member.phone}@mlcgym.member</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-3">No portal access yet. Create a login so this member can check their profile.</p>
                  <button
                    onClick={() => setCreateModal(true)}
                    className="text-xs font-semibold text-white px-3 py-1.5 rounded-btn transition-colors"
                    style={{ background: '#1D9E75' }}
                  >
                    Create login
                  </button>
                </div>
              )}
            </div>

            {/* Machine Access Status */}
            {member.fingerprint_id && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Shield size={14} className="text-gray-400" /> Machine Access
                </h3>
                {memStatus?.status === 'expired' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-danger-light text-danger px-2.5 py-1 rounded-full font-medium">
                      Blocked on machine
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-success-light text-success-dark px-2.5 py-1 rounded-full font-medium">
                      Active on machine
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMachineAction('disable')}
                    disabled={machineLoading}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-btn border border-danger-light text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                  >
                    {machineLoading ? '…' : 'Block now'}
                  </button>
                  <button
                    onClick={() => handleMachineAction('enable')}
                    disabled={machineLoading}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-btn border border-success-light text-success-dark hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                  >
                    {machineLoading ? '…' : 'Unblock'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">FP ID: {member.fingerprint_id}</p>
              </div>
            )}

            {/* WhatsApp actions */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">WhatsApp quick actions</h3>
              <div className="space-y-2">
                <WAButton label="Send renewal reminder" onClick={sendRenewal} />
                <WAButton
                  label="Send receipt"
                  onClick={() => {
                    if (!member?.phone || !lastPayment) {
                      toast.error('No payment found for this member')
                      return
                    }
                    const msg = buildPaymentReceiptMessage(
                      member.name,
                      member.gyms?.name || 'MLC Gym',
                      lastPayment.plans?.name || membership?.plans?.name || '',
                      lastPayment.amount || 0,
                      formatDate(lastPayment.payment_date),
                      formatDate(membership?.end_date),
                      lastPayment.payment_mode || '',
                      lastPayment.transaction_id || null
                    )
                    window.open(generateWhatsAppLink(member.phone, msg), '_blank')
                  }}
                />
                <WAButton label="Send custom message" onClick={sendCustom} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Attendance ── */}
      {activeTab === 'Attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left col: calendar + 6-month chart */}
          <div className="lg:col-span-2 space-y-4">

            {/* Calendar */}
            <div className="card">
              <AttendanceCalendar memberId={member.id} gymId={member.gym_id} />
            </div>

            {/* This month summary + 6-month bar chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Attendance trend</h3>
                <span className="text-xs text-gray-400">
                  This month: <span className="font-semibold text-gray-700">{thisMonthCount} days</span>
                  <span className="text-gray-400"> ({thisMonthPct}%)</span>
                </span>
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={monthlyAttendance} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-white border border-gray-100 rounded-btn px-2.5 py-1.5 shadow-sm">
                          <p className="text-xs font-medium text-gray-700">{label}</p>
                          <p className="text-xs text-gray-500">{payload[0].value} days attended</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {monthlyAttendance.map((entry, i) => (
                      <Cell
                        key={entry.key}
                        fill={i === monthlyAttendance.length - 1 ? '#534AB7' : '#AFA9EC'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="text-xs text-gray-400 mt-2 text-center">Last 6 months</p>
            </div>
          </div>

          {/* Right col: recent check-ins */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent check-ins</h3>
            {attendance.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No attendance recorded</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {attendance.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-gray-800">{formatDate(a.date)}</p>
                      {a.checked_in_at && isValid(parseISO(a.checked_in_at)) && (
                        <p className="text-xs text-gray-400">
                          {format(parseISO(a.checked_in_at), 'h:mm a')}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                      {a.source || 'manual'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Payments ── */}
      {activeTab === 'Payments' && (
        <div className="card">
          <PaymentHistory memberId={member.id} gymId={member.gym_id} />
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${member.name}?`}
        message="This cannot be undone. The member will be hidden from all lists."
        confirmText={actioning ? 'Deleting…' : 'Delete'}
        danger
      />

      {/* Pause confirm */}
      <ConfirmModal
        isOpen={pauseModal}
        onCancel={() => setPauseModal(false)}
        onConfirm={handlePauseResume}
        title={`Pause ${member.name}'s membership?`}
        message="They will not be counted as active. You can resume anytime."
        confirmText={actioning ? 'Pausing…' : 'Pause'}
      />

      {/* Create portal login modal */}
      {createModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setCreateModal(false)} />
          <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Create member portal login</h3>
            <p className="text-xs text-gray-400 mb-4">
              Member will login with phone <span className="font-mono font-medium">{member.phone}</span> and this password.
            </p>
            <label className="label">Set password</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="input mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setCreateModal(false); setNewPassword('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePortal}
                disabled={creating}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-btn disabled:opacity-60"
                style={{ background: '#1D9E75' }}
              >
                {creating ? 'Creating…' : 'Create login'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editOpen && (
        <EditMemberModal
          member={member}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            // Refetch updated member data
            supabase
              .from('members')
              .select('*, memberships(*, plans(name, duration_days, price)), trainers(name), gyms(name, location)')
              .eq('id', id)
              .single()
              .then(({ data }) => { if (data) setMember(data) })
          }}
        />
      )}
    </AppLayout>
  )
}
