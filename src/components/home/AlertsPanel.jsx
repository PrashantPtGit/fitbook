import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Gift, Clock, CheckCircle2, Info, ChevronRight } from 'lucide-react'
import { format, parseISO, isValid, subDays } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { formatCurrency, generateWhatsAppLink, buildBirthdayMessage, todayISO } from '../../utils/helpers'

export default function AlertsPanel() {
  const navigate    = useNavigate()
  const activeGymId = useGymStore((s) => s.activeGymId)
  const activeGym   = useGymStore((s) => s.activeGym)

  const [expiredToday,         setExpiredToday]         = useState([])
  const [inactiveMembers,      setInactiveMembers]      = useState([])
  const [todayPayments,        setTodayPayments]        = useState([])
  const [birthdayMembers,      setBirthdayMembers]      = useState([])
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0)

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    const today   = todayISO()
    const cutoff  = format(subDays(new Date(), 10), 'yyyy-MM-dd')
    const todayMD = format(new Date(), 'MM-dd')

    async function loadAlerts() {
      const [expRes, attRes, payRes, membRes, allRes] = await Promise.all([
        supabase.from('memberships').select('*, members(id, name, phone, whatsapp), plans(name, price)').eq('gym_id',activeGymId).eq('end_date',today).eq('status','active'),
        supabase.from('attendance').select('*',{count:'exact',head:true}).eq('gym_id',activeGymId).eq('date',today),
        supabase.from('payments').select('amount, payment_mode').eq('gym_id',activeGymId).eq('payment_date',today),
        supabase.from('members').select('id, name, phone, whatsapp').eq('gym_id',activeGymId).eq('status','active'),
        supabase.from('members').select('id, name, phone, whatsapp, date_of_birth').eq('gym_id',activeGymId).eq('status','active').not('date_of_birth','is',null),
      ])

      setExpiredToday(expRes.data || [])
      setTodayAttendanceCount(attRes.count || 0)
      setTodayPayments(payRes.data || [])

      if (membRes.data?.length) {
        const { data: recentAtt } = await supabase.from('attendance').select('member_id').eq('gym_id',activeGymId).gte('date',cutoff)
        const recentIds = new Set((recentAtt||[]).map(r=>r.member_id))
        setInactiveMembers(membRes.data.filter(m=>!recentIds.has(m.id)))
      }

      const bdays = (allRes.data||[]).filter(m => {
        try { const d=parseISO(m.date_of_birth); return isValid(d) && format(d,'MM-dd')===todayMD }
        catch { return false }
      })
      setBirthdayMembers(bdays)
    }

    loadAlerts()
  }, [activeGymId])

  const todayRevenue = todayPayments.reduce((s,p) => s+(p.amount||0), 0)
  const upiCount     = todayPayments.filter(p=>p.payment_mode==='upi').length
  const cashCount    = todayPayments.filter(p=>p.payment_mode==='cash').length

  const alerts = useMemo(() => {
    const list = []

    expiredToday.forEach(m => list.push({
      key:      `exp-${m.id}`,
      priority: 1,
      accent:   'border-l-[3px] border-l-[#FF6B35]',
      iconBg:   'bg-[#FFF0EA]',
      iconColor:'text-[#FF6B35]',
      Icon:     AlertCircle,
      message:  `${m.members?.name}'s membership expired today`,
      sub:      m.plans?.price ? `${formatCurrency(m.plans.price)} due · ${m.plans?.name}` : null,
      action:   { label: 'Collect', variant: 'success', onClick: () => navigate(`/fees/collect/${m.members?.id}`) },
    }))

    birthdayMembers.forEach(m => list.push({
      key:      `bday-${m.id}`,
      priority: 2,
      accent:   'border-l-[3px] border-l-primary',
      iconBg:   'bg-primary-light',
      iconColor:'text-primary-dark',
      Icon:     Gift,
      message:  `Birthday today — ${m.name} 🎂`,
      sub:      'Send a WhatsApp wish',
      action:   {
        label: 'Send wish', variant: 'primary',
        onClick: () => window.open(generateWhatsAppLink(m.whatsapp||m.phone, buildBirthdayMessage(m.name, activeGym?.name||'the gym')),'_blank'),
      },
    }))

    if (inactiveMembers.length > 0) list.push({
      key:      'inactive',
      priority: 3,
      accent:   'border-l-[3px] border-l-warning',
      iconBg:   'bg-warning-light',
      iconColor:'text-warning-dark',
      Icon:     Clock,
      message:  `${inactiveMembers.length} member${inactiveMembers.length>1?'s':''} inactive for 10+ days`,
      sub:      'Send a nudge to bring them back',
      action:   { label: 'Send nudge', variant: 'warning', onClick: () => navigate('/messages') },
    })

    if (todayPayments.length > 0) list.push({
      key:      'payments',
      priority: 4,
      accent:   '',
      iconBg:   'bg-success-light',
      iconColor:'text-success-dark',
      Icon:     CheckCircle2,
      message:  `${formatCurrency(todayRevenue)} collected today`,
      sub:      `${todayPayments.length} payment${todayPayments.length>1?'s':''} · UPI: ${upiCount} · Cash: ${cashCount}`,
      action:   null,
    })

    if (list.length === 0 && todayAttendanceCount < 5) list.push({
      key:      'low-att',
      priority: 5,
      accent:   '',
      iconBg:   'bg-info-light',
      iconColor:'text-info-dark',
      Icon:     Info,
      message:  `${todayAttendanceCount} member${todayAttendanceCount!==1?'s':''} checked in so far today`,
      sub:      'Attendance is lower than usual',
      action:   null,
    })

    return list.sort((a,b) => a.priority - b.priority)
  }, [expiredToday, birthdayMembers, inactiveMembers, todayPayments, todayAttendanceCount])

  const ACTION_STYLES = {
    success: 'bg-success text-white hover:bg-success-dark',
    primary: 'bg-primary text-white hover:bg-primary-dark',
    warning: 'bg-warning-light text-warning-dark hover:bg-warning/20 border border-warning-dark/20',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3
          className="text-[15px] font-semibold text-ink"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Today&apos;s alerts
        </h3>
        {alerts.length > 0 && (
          <span className="badge-red">{alerts.length}</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
            <CheckCircle2 size={24} className="text-success" />
          </div>
          <p className="text-sm font-semibold text-success-dark" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            All good — no urgent alerts
          </p>
          <p className="text-xs text-ink-muted">Gym is running smoothly today ✓</p>
        </div>
      ) : (
        <div>
          {alerts.map(alert => {
            const Icon = alert.Icon
            return (
              <div key={alert.key} className={`flex items-start gap-3 py-3 border-b border-surface-border last:border-0 pl-2 ${alert.accent} -ml-2 transition-all`}>
                <div className={`alert-icon ${alert.iconBg}`}>
                  <Icon size={15} className={alert.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink leading-snug">{alert.message}</p>
                  {alert.sub && <p className="text-[11px] text-ink-muted mt-0.5">{alert.sub}</p>}
                </div>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${ACTION_STYLES[alert.action.variant]}`}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
