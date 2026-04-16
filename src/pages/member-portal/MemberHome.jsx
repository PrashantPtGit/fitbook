import { useMemo } from 'react'
import { differenceInDays, format, parseISO } from 'date-fns'
import { MessageCircle, RefreshCw, Flame } from 'lucide-react'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { formatDate, daysFromNow, generateWhatsAppLink } from '../../utils/helpers'

const QUOTES = [
  'Every rep counts. Every day matters. Keep going! 💪',
  'The gym is your temple. Show up and grow stronger.',
  'Consistency is the secret ingredient to fitness.',
  'Your only competition is who you were yesterday.',
  'Push yourself because no one else is going to do it for you.',
  'Strong body, strong mind. You\'ve got this!',
  'Progress, not perfection. One day at a time.',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function calcStreak(attendance) {
  if (!attendance.length) return { current: 0, best: 0 }
  const dates = [...new Set(attendance.map((a) => a.date))].sort((a, b) => b > a ? 1 : -1)
  let current = 0
  let best    = 0
  let streak  = 1
  const today = format(new Date(), 'yyyy-MM-dd')

  // current streak: count backwards from today
  let prev = today
  for (const d of dates) {
    const diff = differenceInDays(parseISO(prev), parseISO(d))
    if (diff === 0) { prev = d; continue }
    if (diff === 1) { streak++; prev = d }
    else break
  }
  current = dates[0] === today || differenceInDays(new Date(), parseISO(dates[0])) <= 1 ? streak : 0

  // best streak: scan all dates
  let run = 1
  for (let i = 0; i < dates.length - 1; i++) {
    if (differenceInDays(parseISO(dates[i]), parseISO(dates[i + 1])) === 1) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  best = Math.max(best, current, 1)
  return { current, best }
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

export default function MemberHome() {
  const { member, membership, attendance, loading } = useMemberPortal()

  const todayStr   = format(new Date(), 'yyyy-MM-dd')
  const todayEntry = attendance.find((a) => a.date === todayStr)
  const daysLeft   = membership ? daysFromNow(membership.end_date) : null

  const thisMonthKey   = format(new Date(), 'yyyy-MM')
  const thisMonthCount = attendance.filter((a) => a.date?.startsWith(thisMonthKey)).length
  const totalVisits    = attendance.length

  const { current: currentStreak, best: bestStreak } = useMemo(
    () => calcStreak(attendance),
    [attendance]
  )

  const planDays  = membership?.plans?.duration_days || 30
  const startDate = membership?.start_date
  const daysUsed  = startDate
    ? Math.max(0, differenceInDays(new Date(), parseISO(startDate)))
    : 0
  const progressPct = Math.min(100, Math.round((daysUsed / planDays) * 100))

  const barColor =
    daysLeft === null ? '#9ca3af'
    : daysLeft <= 7   ? '#A32D2D'
    : daysLeft <= 15  ? '#BA7517'
    : '#1D9E75'

  const quote = useMemo(
    () => QUOTES[new Date().getDate() % QUOTES.length],
    []
  )

  const trainerPhone = member?.trainers?.phone
  const waLink = trainerPhone
    ? generateWhatsAppLink(trainerPhone, `Hi, I'd like to renew my membership. - ${member?.name}`)
    : null

  if (loading) {
    return (
      <MemberPortalLayout title="Home">
        <SkeletonCard className="mb-4 h-40" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </MemberPortalLayout>
    )
  }

  if (!member) {
    return (
      <MemberPortalLayout title="Home">
        <div className="text-center py-12 text-gray-400 text-sm">
          Could not load your profile. Please try again.
        </div>
      </MemberPortalLayout>
    )
  }

  const firstName = member.name?.split(' ')[0] || 'there'

  return (
    <MemberPortalLayout title="Home">
      {/* Greeting */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {member.gyms?.name} · Member since {formatDate(member.created_at)}
        </p>
      </div>

      {/* ── Membership card (hero) ── */}
      <div
        className="rounded-2xl p-5 mb-4 text-white"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', boxShadow: '0 8px 32px rgba(29,158,117,0.25)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/70 mb-0.5">Member</p>
            <p className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {member.name}
            </p>
            <p className="text-xs text-white/70">{member.member_code}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 mb-0.5">Plan</p>
            <p className="text-sm font-semibold">{membership?.plans?.name || '—'}</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>Valid until {formatDate(membership?.end_date)}</span>
            <span style={{ color: daysLeft !== null && daysLeft <= 7 ? '#FCA5A5' : 'rgba(255,255,255,0.7)' }}>
              {daysLeft === null ? '—'
                : daysLeft < 0 ? 'Expired'
                : daysLeft === 0 ? 'Expires today!'
                : `${daysLeft} days left`}
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: barColor }}
            />
          </div>
        </div>

        {daysLeft !== null && daysLeft <= 14 && waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-btn transition-colors"
          >
            <MessageCircle size={12} /> Renew membership
          </a>
        )}
      </div>

      {/* ── Quick stats grid ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'This month',      value: thisMonthCount,   unit: 'visits'     },
          { label: 'Total visits',    value: totalVisits,      unit: 'all time'   },
          { label: 'Current streak',  value: currentStreak,    unit: 'days in a row' },
          { label: 'Best streak',     value: bestStreak,       unit: 'days ever'  },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white rounded-xl p-3.5 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {value}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{unit}</p>
          </div>
        ))}
      </div>

      {/* ── Today's status ── */}
      <div className={`rounded-xl p-4 mb-4 border ${
        todayEntry
          ? 'bg-green-50 border-green-100'
          : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            todayEntry ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {todayEntry ? '✓' : '—'}
          </div>
          <div>
            <p className={`text-sm font-semibold ${todayEntry ? 'text-green-800' : 'text-gray-500'}`}>
              {todayEntry
                ? `Checked in today ${todayEntry.checked_in_at
                    ? `at ${format(parseISO(todayEntry.checked_in_at), 'h:mm a')}`
                    : ''} ✓`
                : 'Not checked in today'}
            </p>
            {currentStreak > 1 && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Flame size={10} className="text-orange-400" />
                {currentStreak}-day streak — keep it up!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Motivational quote ── */}
      <div
        className="rounded-xl p-4 mb-4 border-l-4 bg-white"
        style={{ borderLeftColor: '#1D9E75' }}
      >
        <p className="text-xs text-gray-400 mb-1">Daily motivation</p>
        <p className="text-sm text-gray-700 italic">{quote}</p>
      </div>

      {/* ── Contact trainer ── */}
      {member.trainers?.name && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Your trainer</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{member.trainers.name}</p>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-btn hover:bg-green-100 transition-colors"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </MemberPortalLayout>
  )
}
