import { Bell, Search } from 'lucide-react'
import GymSwitcher from '../ui/GymSwitcher'
import Avatar from '../ui/Avatar'

export default function Topbar({ pageTitle = '', pageSubtitle = '' }) {
  return (
    <header className="h-14 flex items-center justify-between px-5 bg-white border-b border-gray-100 shrink-0">
      {/* Left: page title */}
      <div>
        <p className="page-title">{pageTitle}</p>
        {pageSubtitle && <p className="page-sub">{pageSubtitle}</p>}
      </div>

      {/* Center: gym switcher */}
      <GymSwitcher />

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-8 w-44 py-1.5 text-xs"
          />
        </div>

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
