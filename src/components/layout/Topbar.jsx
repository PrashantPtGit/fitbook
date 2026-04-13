import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Menu, Search, X, AlertTriangle, Gift, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GymSwitcher from '../ui/GymSwitcher'
import Avatar from '../ui/Avatar'
import { useGymStore } from '../../store/useGymStore'
import { supabase, supabaseReady } from '../../lib/supabase'
import { todayISO } from '../../utils/helpers'
import { format, parseISO } from 'date-fns'

// ─── Notification bell ────────────────────────────────────────────────────────
function BellDropdown({ gymId }) {
  const [open,   setOpen]   = useState(false)
  const [alerts, setAlerts] = useState([])
  const [count,  setCount]  = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!supabaseReady || !gymId) return
    fetchAlerts()
  }, [gymId])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchAlerts() {
    const today   = todayISO()
    const todayMD = format(new Date(), 'MM-dd')

    const [expToday, expired, membersRes] = await Promise.all([
      supabase.from('memberships').select('id, members(name, member_code)').eq('gym_id', gymId).eq('status', 'active').eq('end_date', today),
      supabase.from('memberships').select('id, end_date, members(name)').eq('gym_id', gymId).eq('status', 'active').lt('end_date', today).limit(5),
      supabase.from('members').select('id, name, date_of_birth').eq('gym_id', gymId).eq('status', 'active'),
    ])

    const list = []

    ;(expToday.data || []).forEach((m) => {
      list.push({ type: 'expiring', icon: CreditCard, color: 'text-danger', bg: 'bg-danger-light', msg: `${m.members?.name || 'Member'} membership expires today`, sub: m.members?.member_code || '' })
    })

    ;(expired.data || []).slice(0, 3).forEach((m) => {
      list.push({ type: 'expired', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light', msg: `${m.members?.name || 'Member'} membership expired`, sub: m.end_date ? format(parseISO(m.end_date), 'd MMM') : '' })
    })

    ;(membersRes.data || []).forEach((m) => {
      if (!m.date_of_birth) return
      try { if (format(parseISO(m.date_of_birth), 'MM-dd') === todayMD) list.push({ type: 'birthday', icon: Gift, color: 'text-success', bg: 'bg-success-light', msg: `Happy birthday, ${m.name}! 🎂`, sub: 'Today' }) }
      catch {}
    })

    setAlerts(list)
    setCount(list.length)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-btn text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors relative"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center px-0.5">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">Alerts</p>
            {count > 0 && <span className="badge-red">{count}</span>}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">All good — no alerts today</p>
            ) : alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${a.bg}`}>
                  <a.icon size={13} className={a.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-snug">{a.msg}</p>
                  {a.sub && <p className="text-[10px] text-gray-400 mt-0.5">{a.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Global search ────────────────────────────────────────────────────────────
function GlobalSearch({ gymId }) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)
  const timer    = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', handler)
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('mousedown', handler) }
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || !supabaseReady) { setResults([]); setLoading(false); return }
    setLoading(true)
    let query = supabase.from('members').select('id, name, phone, member_code, gym_id').or(`name.ilike.%${q}%,phone.ilike.%${q}%`).limit(6)
    if (gymId) query = query.eq('gym_id', gymId)
    const { data } = await query
    setResults(data || [])
    setLoading(false)
  }, [gymId])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => doSearch(val), 300)
  }

  function handleSelect(member) {
    navigate(`/members/${member.id}`)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      {!open ? (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="p-1.5 rounded-btn text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Search size={16} />
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-btn px-2 py-1">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search members…"
            className="text-sm bg-transparent outline-none w-44 placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {open && (query.length > 0) && (
        <div className="absolute right-0 top-9 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-4">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No members found</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {results.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0 text-xs font-semibold text-primary-dark">
                    {m.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400">{m.member_code} · {m.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Topbar ──────────────────────────────────────────────────────────────
export default function Topbar({ pageTitle = '', pageSubtitle = '' }) {
  const setSidebarOpen = useGymStore((s) => s.setSidebarOpen)
  const activeGymId    = useGymStore((s) => s.activeGymId)

  return (
    <header className="h-14 flex items-center px-3 md:px-5 bg-white border-b border-gray-100 shrink-0 gap-2">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-1.5 rounded-btn text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Left: page title — desktop only */}
      <div className="hidden md:block min-w-0 flex-1">
        <p className="page-title">{pageTitle}</p>
        {pageSubtitle && <p className="page-sub">{pageSubtitle}</p>}
      </div>

      {/* Center: gym switcher — grows on mobile */}
      <div className="flex-1 md:flex-none flex justify-center md:justify-start">
        <GymSwitcher />
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-1 shrink-0">
        <GlobalSearch gymId={activeGymId} />
        <BellDropdown gymId={activeGymId} />
        <Avatar name="Ramesh Kumar" size="sm" gymIndex={0} />
      </div>
    </header>
  )
}
