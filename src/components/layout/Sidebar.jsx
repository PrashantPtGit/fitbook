import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck,
  MessageSquare, Heart, Salad, BarChart2
} from 'lucide-react'
import Avatar from '../ui/Avatar'

const daily = [
  { to: '/',           label: 'Home',       icon: LayoutDashboard },
  { to: '/members',    label: 'Members',    icon: Users },
  { to: '/fees',       label: 'Fees',       icon: CreditCard },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
]

const tools = [
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/health',   label: 'Health',   icon: Heart },
  { to: '/diet',     label: 'Diet',     icon: Salad },
  { to: '/reports',  label: 'Reports',  icon: BarChart2 },
]

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-48 h-screen flex flex-col bg-white border-r border-gray-100 shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="text-base font-semibold text-gray-900">FitBook</div>
        <div className="text-xs text-primary font-medium">Gym Manager</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="section-title">Daily Use</p>
        {daily.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <p className="section-title">Tools</p>
        {tools.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Owner */}
      <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2.5">
        <Avatar name="Ramesh Kumar" size="sm" gymIndex={0} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">Ramesh Kumar</p>
          <p className="text-xs text-gray-400">Owner</p>
        </div>
      </div>
    </aside>
  )
}
