import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Star, CheckCircle, Gift, Info, CheckCircle2 } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { useReports } from '../../hooks/useReports'
import { useAttendance } from '../../hooks/useAttendance'
import { usePayments } from '../../hooks/usePayments'
import { useMembersHook } from '../../hooks/useMembers'
import { formatCurrency, generateWhatsAppLink, buildBirthdayMessage, todayISO } from '../../utils/helpers'

export default function AlertsPanel() {
  const navigate    = useNavigate()
  const activeGymId = useGymStore((s) => s.activeGymId)
  const activeGym   = useGymStore((s) => s.activeGym)

  const { inactiveMembers } = useReports()
  const { todayAttendance } = useAttendance()
  const { payments }        = usePayments()
  const { members }         = useMembersHook()

  const [expiredToday, setExpiredToday] = useState([])

  useEffect(() => {
    if (!supabaseReady) return
    async function loadExpired() {
      const today = todayISO()
      let q = supabase
        .from('memberships')
        .select('*, members(id, name, phone, whatsapp), plans(name, price)')
        .eq('end_date', today)
        .eq('status', 'active')
      if (activeGymId) q = q.eq('gym_id', activeGymId)
      const { data } = await q
      setExpiredToday(data || [])
    }
    loadExpired()
  }, [activeGymId])

  const todayPayments = useMemo(() => {
    const today = todayISO()
    return payments.filter((p) => p.payment_date === today)
  }, [payments])

  const todayRevenue = todayPayments.reduce((s, p) => s + (p.amount || 0), 0)
  const upiCount     = todayPayments.filter((p) => p.payment_mode === 'upi').length
  const cashCount    = todayPayments.filter((p) => p.payment_mode === 'cash').length

  const birthdayMembers = useMemo(() => {
    const todayMD = format(new Date(), 'MM-dd')
    return members.filter((m) => {
      if (!m.date_of_birth) return false
      try {
        const d = parseISO(m.date_of_birth)
        return isValid(d) && format(d, 'MM-dd') === todayMD
      } catch { return false }
    })
  }, [members])

  const alerts = useMemo(() => {
    const list = []

    expiredToday.forEach((m) => list.push({
      key: `exp-${m.id}`,
      priority: 1,
      Icon: AlertCircle,
      iconBg: 'bg-danger-light', iconColor: 'text-danger',
      message: `${m.members?.name}'s plan expired today.${m.plans?.price ? ` ${formatCurrency(m.plans.price)} due.` : ''}`,
      sub: null,
      action: 'Collect',
      onAction: () => navigate(`/fees/collect/${m.members?.id}`),
    }))

    birthdayMembers.forEach((m) => list.push({
      key: `bday-${m.id}`,
      priority: 2,
      Icon: Gift,
      iconBg: 'bg-primary-light', iconColor: 'text-primary',
      message: `Birthday today: ${m.name} 🎂`,
      sub: null,
      action: 'Send wish',
      onAction: () => {
        const msg = buildBirthdayMessage(m.name, activeGym?.name || 'the gym')
        window.open(generateWhatsAppLink(m.whatsapp || m.phone, msg), '_blank')
      },
    }))

    if (inactiveMembers.length > 0) list.push({
      key: 'inactive',
      priority: 3,
      Icon: Star,
      iconBg: 'bg-warning-light', iconColor: 'text-warning',
      message: `${inactiveMembers.length} member${inactiveMembers.length > 1 ? 's' : ''} haven't visited in 10+ days.`,
      sub: null,
      action: 'Send nudge',
      onAction: () => navigate('/messages'),
    })

    if (todayPayments.length > 0) list.push({
      key: 'payments',
      priority: 4,
      Icon: CheckCircle,
      iconBg: 'bg-success-light', iconColor: 'text-success',
      message: `${formatCurrency(todayRevenue)} collected today — ${todayPayments.length} payment${todayPayments.length > 1 ? 's' : ''}`,
      sub: `UPI: ${upiCount} · Cash: ${cashCount}`,
      action: null,
    })

    if (todayAttendance.length < 10) list.push({
      key: 'low-att',
      priority: 5,
      Icon: Info,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
      message: `Only ${todayAttendance.length} member${todayAttendance.length !== 1 ? 's' : ''} checked in so far today`,
      sub: null,
      action: null,
    })

    return list.sort((a, b) => a.priority - b.priority)
  }, [expiredToday, birthdayMembers, inactiveMembers, todayPayments, todayAttendance])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Today&apos;s alerts</h3>
        {alerts.length > 0 && (
          <span className="badge-red">{alerts.length}</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <CheckCircle2 size={28} className="text-success" />
          <p className="text-sm font-medium text-success-dark">All good today! No urgent alerts.</p>
        </div>
      ) : (
        <div>
          {alerts.map((alert, i) => {
            const Icon = alert.Icon
            return (
              <div key={alert.key}>
                <div className="flex items-start gap-2.5 py-2.5">
                  <div className={`w-7 h-7 rounded-btn flex items-center justify-center shrink-0 ${alert.iconBg}`}>
                    <Icon size={14} className={alert.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 leading-snug">{alert.message}</p>
                    {alert.sub && <p className="text-[11px] text-gray-400 mt-0.5">{alert.sub}</p>}
                  </div>
                  {alert.action && (
                    <button
                      onClick={alert.onAction}
                      className="text-xs text-primary hover:text-primary-dark font-medium shrink-0"
                    >
                      {alert.action}
                    </button>
                  )}
                </div>
                {i < alerts.length - 1 && <div className="divider" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
