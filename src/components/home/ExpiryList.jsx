import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react'
import { addDays } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { getMembershipStatus, formatCurrency, todayISO, dateISO } from '../../utils/helpers'
import Avatar from '../ui/Avatar'
import { SkeletonRow } from '../ui/Skeleton'

const URGENCY_BORDER = {
  critical: 'border-l-[3px] border-l-[#FF6B35]',
  warning:  'border-l-[3px] border-l-warning',
  active:   '',
  expired:  'border-l-[3px] border-l-danger',
}

export default function ExpiryList() {
  const [expiring, setExpiring] = useState([])
  const [loading,  setLoading]  = useState(true)
  const activeGymId = useGymStore((s) => s.activeGymId)
  const navigate    = useNavigate()

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('memberships')
      .select('*, members(id, name, phone, member_code), plans(name, price)')
      .eq('gym_id', activeGymId)
      .eq('status', 'active')
      .gte('end_date', todayISO())
      .lte('end_date', dateISO(addDays(new Date(), 14)))
      .order('end_date', { ascending: true })
      .limit(6)
      .then(({ data }) => { setExpiring(data || []); setLoading(false) })
  }, [activeGymId])

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FFF0EA] flex items-center justify-center">
            <Zap size={13} className="text-[#FF6B35]" />
          </div>
          <h3
            className="text-[15px] font-semibold text-ink"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Expiring soon
          </h3>
        </div>
        <button
          onClick={() => navigate('/fees')}
          className="text-xs text-primary hover:text-primary-dark font-semibold transition-colors flex items-center gap-0.5"
        >
          Collect fees <ChevronRight size={13} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-surface-border">
          {[1,2,3].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : expiring.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
            <CheckCircle2 size={22} className="text-success" />
          </div>
          <p className="text-sm font-semibold text-success-dark" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            All members up to date
          </p>
          <p className="text-xs text-ink-muted">No renewals due in the next 14 days</p>
        </div>
      ) : (
        <div>
          {expiring.map(m => {
            const st = getMembershipStatus(m.end_date)
            return (
              <div
                key={m.id}
                onClick={() => navigate(`/fees/collect/${m.members?.id}`)}
                className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-btn cursor-pointer hover:bg-surface-app transition-all duration-150 ${URGENCY_BORDER[st.status] || ''}`}
              >
                <Avatar name={m.members?.name || '?'} size="sm" gymIndex={0} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{m.members?.name}</p>
                  <p className="text-[11px] text-ink-muted">
                    {m.plans?.name}
                    {m.plans?.price && <span className="hidden sm:inline"> · {formatCurrency(m.plans.price)} due</span>}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                  st.status === 'critical' ? 'bg-[#FFF0EA] text-[#FF6B35]' :
                  st.status === 'warning'  ? 'bg-warning-light text-warning-dark' :
                  st.status === 'expired'  ? 'bg-danger-light text-danger-dark' :
                  'bg-success-light text-success-dark'
                }`}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
