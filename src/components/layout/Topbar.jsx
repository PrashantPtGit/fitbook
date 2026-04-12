import { Bell, Menu } from 'lucide-react'
import GymSwitcher from '../ui/GymSwitcher'
import Avatar from '../ui/Avatar'
import { useGymStore } from '../../store/useGymStore'

export default function Topbar({ pageTitle = '', pageSubtitle = '' }) {
  const setSidebarOpen = useGymStore((s) => s.setSidebarOpen)

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

      {/* Center: gym switcher — grows on mobile to fill space */}
      <div className="flex-1 md:flex-none flex justify-center md:justify-start">
        <GymSwitcher />
      </div>

      {/* Right: bell + avatar — always visible */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button className="p-1.5 rounded-btn text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <Bell size={18} />
          </button>
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-danger" />
        </div>

        <Avatar name="Ramesh Kumar" size="sm" gymIndex={0} />
      </div>
    </header>
  )
}
