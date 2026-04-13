import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck, MoreHorizontal,
  MessageSquare, Heart, Salad, BarChart2, X,
} from 'lucide-react'

const PRIMARY_TABS = [
  { to: '/',           label: 'Home',       icon: LayoutDashboard, end: true },
  { to: '/members',    label: 'Members',    icon: Users            },
  { to: '/fees',       label: 'Fees',       icon: CreditCard       },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck    },
]

const MORE_ITEMS = [
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/health',   label: 'Health',   icon: Heart         },
  { to: '/diet',     label: 'Diet',     icon: Salad         },
  { to: '/reports',  label: 'Reports',  icon: BarChart2     },
]

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* More drawer backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer */}
      {showMore && (
        <div className="fixed bottom-14 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 rounded-t-2xl shadow-xl px-4 pt-4 pb-6 safe-area-bottom">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">More</p>
            <button onClick={() => setShowMore(false)} className="p-1 text-gray-400">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-3 rounded-btn text-center transition-colors ${
                    isActive ? 'text-primary-dark bg-primary-light' : 'text-gray-500 hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        {PRIMARY_TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary-dark' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* More tab */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            showMore ? 'text-primary-dark' : 'text-gray-400'
          }`}
        >
          <MoreHorizontal size={20} className={showMore ? 'text-primary' : ''} />
          More
        </button>
      </nav>
    </>
  )
}
