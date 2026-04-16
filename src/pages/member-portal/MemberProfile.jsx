import { differenceInDays, parseISO } from 'date-fns'
import { User, Phone, Calendar, MapPin, Clock, CreditCard } from 'lucide-react'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { formatDate, formatCurrency, daysFromNow } from '../../utils/helpers'

function Row({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Icon size={14} className="text-gray-300 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function Card({ title, children, accent = false }) {
  return (
    <div
      className="bg-white rounded-xl p-4 mb-4 border border-gray-100"
      style={accent ? { borderLeft: '3px solid #1D9E75' } : {}}
    >
      {title && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>}
      {children}
    </div>
  )
}

export default function MemberProfile() {
  const { member, membership, payments, loading } = useMemberPortal()

  if (loading) {
    return (
      <MemberPortalLayout title="My Profile">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 h-32" />
          ))}
        </div>
      </MemberPortalLayout>
    )
  }

  if (!member) {
    return (
      <MemberPortalLayout title="My Profile">
        <p className="text-center text-gray-400 py-12 text-sm">Profile not found.</p>
      </MemberPortalLayout>
    )
  }

  const daysLeft   = membership ? daysFromNow(membership.end_date) : null
  const planDays   = membership?.plans?.duration_days || 30
  const daysUsed   = membership?.start_date
    ? Math.max(0, differenceInDays(new Date(), parseISO(membership.start_date)))
    : 0
  const progressPct = Math.min(100, Math.round((daysUsed / planDays) * 100))
  const barColor    = daysLeft === null ? '#9ca3af' : daysLeft <= 7 ? '#A32D2D' : daysLeft <= 15 ? '#BA7517' : '#1D9E75'
  const lastPayment = payments[0]

  // Avatar initials
  const parts    = (member.name || 'M').trim().split(' ')
  const initials = parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2)

  return (
    <MemberPortalLayout title="My Profile">
      {/* Avatar + name hero */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #1D9E75, #085041)' }}
        >
          {initials.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {member.name}
          </h1>
          <p className="text-xs text-gray-400">{member.member_code} · {member.gyms?.name}</p>
          {member.batch_timing && (
            <p className="text-xs text-gray-400">{member.batch_timing}</p>
          )}
        </div>
      </div>

      {/* Personal info */}
      <Card title="Personal Information" accent>
        <Row icon={Phone}    label="Phone"            value={member.phone} />
        <Row icon={Calendar} label="Date of birth"    value={member.date_of_birth ? formatDate(member.date_of_birth) : null} />
        <Row icon={User}     label="Gender"           value={member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : null} />
        <Row icon={MapPin}   label="Address"          value={member.address} />
        <Row icon={Calendar} label="Member since"     value={formatDate(member.created_at)} />
        <Row icon={Clock}    label="Batch timing"     value={member.batch_timing} />
        <Row icon={User}     label="Trainer"          value={member.trainers?.name} />
      </Card>

      {/* Current membership */}
      <Card title="Current Membership" accent>
        {membership ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base font-semibold text-gray-800">{membership.plans?.name}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(membership.start_date)} → {formatDate(membership.end_date)}
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: barColor + '20',
                  color: barColor,
                }}
              >
                {daysLeft === null ? '—'
                  : daysLeft < 0 ? 'Expired'
                  : daysLeft === 0 ? 'Expires today'
                  : `${daysLeft}d left`}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: barColor }}
              />
            </div>
            <p className="text-xs text-gray-400">{daysUsed} of {planDays} days used</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">No active membership</p>
        )}
      </Card>

      {/* Payment summary */}
      <Card title="Last Payment">
        {lastPayment ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Date</span>
              <span className="text-gray-800">{formatDate(lastPayment.payment_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Plan</span>
              <span className="text-gray-800">{lastPayment.plans?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="font-semibold text-gray-900">{formatCurrency(lastPayment.amount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mode</span>
              <span className="text-gray-800 capitalize">{lastPayment.payment_mode || '—'}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No payments found</p>
        )}
      </Card>
    </MemberPortalLayout>
  )
}
