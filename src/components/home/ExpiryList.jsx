import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { addDays } from 'date-fns'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { getMembershipStatus, formatCurrency, todayISO, dateISO } from '../../utils/helpers'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { SkeletonRow } from '../ui/Skeleton'

export default function ExpiryList() {
  const [expiring, setExpiring] = useState([])
  const [loading,  setLoading]  = useState(true)
  const activeGymId = useGymStore((s) => s.activeGymId)
  const navigate    = useNavigate()

  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoading(false); return }

    async function fetch() {
      setLoading(true)
      const today = todayISO()
      const in14  = dateISO(addDays(new Date(), 14))

      const { data } = await supabase
        .from('memberships')
        .select('*, members(id, name, phone, member_code), plans(name, price)')
        .eq('gym_id', activeGymId)
        .eq('status', 'active')
        .gte('end_date', today)
        .lte('end_date', in14)
        .order('end_date', { ascending: true })
        .limit(5)

      setExpiring(data || [])
      setLoading(false)
    }

    fetch()
  }, [activeGymId])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Expiring soon — act now</h3>
        <button
          onClick={() => navigate('/fees')}
          className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
        >
          Collect fees →
        </button>
      </div>

      {loading ? (
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : expiring.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <CheckCircle size={28} className="text-success" />
          <p className="text-sm font-medium text-success-dark">All members are up to date ✓</p>
        </div>
      ) : (
        <div>
          {expiring.map((m, i) => {
            const st = getMembershipStatus(m.end_date)
            return (
              <div
                key={m.id}
                onClick={() => navigate(`/fees/collect/${m.members?.id}`)}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 rounded-btn -mx-1 px-1 transition-colors"
              >
                <Avatar name={m.members?.name || '?'} size="sm" gymIndex={0} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.members?.name}</p>
                  <p className="text-xs text-gray-400">
                    {m.plans?.name}
                    {m.plans?.price && (
                      <span className="hidden sm:inline">{` · ${formatCurrency(m.plans.price)} due`}</span>
                    )}
                  </p>
                </div>
                <Badge variant={st.badgeVariant}>{st.label}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
