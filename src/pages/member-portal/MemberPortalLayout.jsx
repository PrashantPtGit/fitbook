import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Home, User, Calendar, Heart, Grid, LogOut, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { useRole } from '../../hooks/useRole'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/member-portal',            label: 'Home',       icon: Home       },
  { to: '/member-portal/attendance', label: 'Attendance', icon: Calendar   },
  { to: '/member-portal/payments',   label: 'Payments',   icon: CreditCard },
  { to: '/member-portal/health',     label: 'Health',     icon: Heart      },
  { to: '/member-portal/more',       label: 'More',       icon: Grid       },
]

const GREEN = '#1D9E75'

function Initials({ name }) {
  const parts   = (name || 'M').trim().split(' ')
  const initials = parts.length > 1
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0][0] || 'M')
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: GREEN }}
    >
      {initials.toUpperCase()}
    </div>
  )
}

export default function MemberPortalLayout({ children, title = 'MLC Gym' }) {
  const { userName } = useRole()
  const navigate     = useNavigate()

  useEffect(() => {
    document.title = `${title} — FitBook`
  }, [title])

  async function handleLogout() {
    await supabase.auth.signOut()
    useGymStore.getState().resetStore()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0FDF8' }}>

      {/* ── Top header ── */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 shrink-0 z-20"
        style={{ boxShadow: '0 1px 0 rgba(29,158,117,0.08)' }}
      >
        {/* Logo */}
        <div className="flex-1 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: GREEN }}
          >
            F
          </div>
          <span className="font-bold text-gray-900 text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            FitBook
          </span>
        </div>

        {/* Page title center */}
        <p className="text-sm font-semibold text-gray-700 absolute left-1/2 -translate-x-1/2">
          {title}
        </p>

        {/* Avatar right */}
        <div className="flex-1 flex justify-end">
          <Initials name={userName} />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-44 bg-white border-r border-gray-100 shrink-0">
          <nav className="flex-1 py-4 space-y-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/member-portal'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`
                }
                style={({ isActive }) => isActive ? { background: GREEN, borderRadius: '0 8px 8px 0' } : {}}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Member info + logout */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Initials name={userName} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userName || 'Member'}</p>
                <p className="text-[10px] text-gray-400">Member</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-btn transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto p-4">
            {children}
          </div>
        </main>
      </div>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex"
        style={{ boxShadow: '0 -1px 0 rgba(29,158,117,0.08)' }}
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/member-portal'}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-400 transition-colors"
            style={({ isActive }) => isActive ? { color: GREEN } : {}}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
