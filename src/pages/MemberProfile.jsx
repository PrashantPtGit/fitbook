import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Phone, Calendar, User, MapPin, Heart,
  Activity, CreditCard, MessageCircle, Clock, Fingerprint,
} from 'lucide-react'
import { differenceInDays, format, parseISO, isValid, startOfMonth, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import AttendanceCalendar from '../components/attendance/AttendanceCalendar'
import PaymentHistory from '../components/members/PaymentHistory'
import { supabase, supabaseReady } from '../lib/supabase'
import {
  getMembershipStatus, formatDate, formatCurrency, daysFromNow,
  generateWhatsAppLink, buildRenewalMessage,
} from '../utils/helpers'
import { SkeletonCard } from '../components/ui/Skeleton'

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
            {memStatus && <Badge variant={memStatus.badgeVariant}>{memStatus.label}</Badge>}
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
            onClick={() => toast('Edit coming soon')}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <Edit2 size={14} /> Edit member
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

            {/* WhatsApp actions */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">WhatsApp quick actions</h3>
              <div className="space-y-2">
                <WAButton label="Send renewal reminder" onClick={sendRenewal} />
                <WAButton
                  label="Send receipt"
                  onClick={() => toast('Receipt feature coming soon')}
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
    </AppLayout>
  )
}
