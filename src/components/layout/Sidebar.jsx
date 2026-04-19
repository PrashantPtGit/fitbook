import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck,
  MessageSquare, Activity, Salad, BarChart2, Settings, X, LogOut, Dumbbell,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import ConfirmModal from '../ui/ConfirmModal'
import { useGymStore } from '../../store/useGymStore'
import { useRole } from '../../hooks/useRole'
import { supabase } from '../../lib/supabase'

// Each nav item has a unique accent color dot per design spec
const DAILY = [
  { to: '/',           label: 'Home',       icon: LayoutDashboard, dot: 'bg-primary'  },
  { to: '/members',    label: 'Members',    icon: Users,           dot: 'bg-electric' },
  { to: '/fees',       label: 'Fees',       icon: CreditCard,      dot: 'bg-warning'  },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck,   dot: 'bg-info'     },
]

const TOOLS = [
  { to: '/messages',  label: 'Messages',  icon: MessageSquare, dot: 'bg-[#EC4899]'   },
  { to: '/health',    label: 'Health',    icon: Activity,      dot: 'bg-fire'        },
  { to: '/diet',      label: 'Diet',      icon: Salad,         dot: 'bg-success'     },
  { to: '/workouts',  label: 'Workouts',  icon: Dumbbell,      dot: 'bg-[#D85A30]'   },
  { to: '/reports',   label: 'Reports',   icon: BarChart2,     dot: 'bg-ink-muted'   },
  { to: '/settings',  label: 'Settings',  icon: Settings,      dot: 'bg-gray-400'    },
]

function NavItem({ to, label, icon: Icon, dot, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
    >
      {({ isActive }) => (
        <>
          {/* Colored dot indicator */}
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? dot : 'bg-surface-border'} transition-colors duration-150`} />
          <Icon size={15} className="shrink-0" />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const sidebarOpen    = useGymStore((s) => s.sidebarOpen)
  const setSidebarOpen = useGymStore((s) => s.setSidebarOpen)
  const close          = () => setSidebarOpen(false)
  const navigate       = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { userName, userRole } = useRole()

  async function handleLogout() {
    await supabase.auth.signOut()
    useGymStore.getState().resetStore()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={close} />
      )}

      <aside
        className={[
          'fixed md:sticky top-0 h-screen z-50 md:z-auto',
          'w-[200px] flex flex-col bg-white border-r border-surface-border shrink-0',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ boxShadow: sidebarOpen ? '4px 0 24px rgba(83,74,183,0.08)' : 'none' }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <div
              className="text-[18px] font-bold text-ink leading-none"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              FitBook
            </div>
            <div className="text-[11px] text-primary font-semibold mt-0.5 tracking-wide">
              Gym Manager
            </div>
          </div>
          <button
            onClick={close}
            className="md:hidden p-1 rounded-btn text-ink-muted hover:text-ink hover:bg-surface-app transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="section-title">Daily Use</p>
          {DAILY.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={close} />
          ))}

          <div className="mx-3 my-2 h-px bg-surface-border" />

          <p className="section-title">Tools</p>
          {TOOLS.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={close} />
          ))}
        </nav>

        {/* Owner profile */}
        <div className="border-t border-surface-border">
          <div className="px-3 py-3 flex items-center gap-2.5">
            <Avatar name={userName || 'Owner'} size="sm" gymIndex={0} />
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold text-ink truncate leading-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {userName || 'Owner'}
              </p>
              <p className="text-[11px] text-ink-muted">
                {userRole === 'main_admin' ? 'Main Admin' : 'Co-owner'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Log out?"
        message="You will be signed out of FitBook."
        confirmText="Log out"
        danger
      />
    </>
  )
}
