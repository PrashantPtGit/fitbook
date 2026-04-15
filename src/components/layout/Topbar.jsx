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
    ;(expToday.data || []).forEach(m => list.push({ type: 'expiring', icon: CreditCard, iconBg: 'bg-[#FFF0EA]', iconColor: 'text-[#FF6B35]', msg: `${m.members?.name} — membership expires today`, sub: m.members?.member_code }))
    ;(expired.data  || []).slice(0,3).forEach(m => list.push({ type: 'expired', icon: AlertTriangle, iconBg: 'bg-danger-light', iconColor: 'text-danger', msg: `${m.members?.name} — expired`, sub: m.end_date ? format(parseISO(m.end_date), 'd MMM') : '' }))
    ;(membersRes.data || []).forEach(m => {
      if (!m.date_of_birth) return
      try { if (format(parseISO(m.date_of_birth), 'MM-dd') === todayMD) list.push({ type: 'birthday', icon: Gift, iconBg: 'bg-primary-light', iconColor: 'text-primary-dark', msg: `Birthday today — ${m.name} 🎂`, sub: 'Send a WhatsApp wish' }) }
      catch {}
    })
    setAlerts(list)
    setCount(list.length)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-btn text-ink-secondary hover:text-ink hover:bg-surface-app transition-colors"
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white border border-surface-border rounded-xl shadow-float z-50 overflow-hidden animate-slide-in-top">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-xs font-semibold text-ink" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Alerts</p>
            {count > 0 && <span className="badge-red">{count}</span>}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
            {alerts.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-6">All good — no alerts today</p>
            ) : alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-app">
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${a.iconBg}`}>
                  <a.icon size={13} className={a.iconColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink leading-snug">{a.msg}</p>
                  {a.sub && <p className="text-[10px] text-ink-muted mt-0.5">{a.sub}</p>}
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
  const [busy,    setBusy]    = useState(false)
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
    if (!q.trim() || !supabaseReady) { setResults([]); setBusy(false); return }
    setBusy(true)
    let qb = supabase.from('members').select('id, name, phone, member_code, gym_id').or(`name.ilike.%${q}%,phone.ilike.%${q}%`).neq('status', 'deleted').limit(6)
    if (gymId) qb = qb.eq('gym_id', gymId)
    const { data } = await qb
    setResults(data || [])
    setBusy(false)
  }, [gymId])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => doSearch(val), 300)
  }

  function handleSelect(member) {
    navigate(`/members/${member.id}`)
    setOpen(false); setQuery(''); setResults([])
  }

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      {!open ? (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="p-2 rounded-btn text-ink-secondary hover:text-ink hover:bg-surface-app transition-colors"
        >
          <Search size={16} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 bg-surface-app border border-primary rounded-btn px-2.5 py-1.5 shadow-focus">
          <Search size={13} className="text-ink-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search members…"
            className="text-sm bg-transparent outline-none w-44 placeholder:text-ink-muted text-ink"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} className="text-ink-muted hover:text-ink">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {open && query.length > 0 && (
        <div className="absolute right-0 top-10 w-64 bg-white border border-surface-border rounded-xl shadow-float z-50 overflow-hidden animate-slide-in-top">
          {busy ? (
            <p className="text-xs text-ink-muted text-center py-4">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-4">No members found for "{query}"</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {results.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-app text-left transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #534AB7 0%, #7B6FF0 100%)', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    {m.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                    <p className="text-[10px] text-ink-muted">{m.member_code} · {m.phone}</p>
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

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar({ pageTitle = '', pageSubtitle = '' }) {
  const setSidebarOpen = useGymStore((s) => s.setSidebarOpen)
  const activeGymId    = useGymStore((s) => s.activeGymId)

  return (
    <header
      className="h-14 flex items-center px-3 md:px-5 bg-white border-b border-surface-border shrink-0 gap-2"
      style={{ boxShadow: '0 1px 0 rgba(83,74,183,0.06)' }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 rounded-btn text-ink-secondary hover:text-ink hover:bg-surface-app transition-colors shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Page title — desktop only */}
      <div className="hidden md:block min-w-0 flex-1">
        <p className="page-title">{pageTitle}</p>
        {pageSubtitle && <p className="page-sub">{pageSubtitle}</p>}
      </div>

      {/* Gym switcher — center on mobile */}
      <div className="flex-1 md:flex-none flex justify-center md:justify-start">
        <GymSwitcher />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <GlobalSearch gymId={activeGymId} />
        <BellDropdown gymId={activeGymId} />
        <Avatar name="Ramesh Kumar" size="sm" gymIndex={0} />
      </div>
    </header>
  )
}
