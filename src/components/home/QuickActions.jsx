import { useNavigate } from 'react-router-dom'
import { UserPlus, Wallet, CheckSquare, MessageCircle } from 'lucide-react'

const ACTIONS = [
  { icon: UserPlus,      label: 'New member',   sub: 'Add & assign plan',  to: '/members/add'  },
  { icon: Wallet,        label: 'Collect fee',  sub: 'Record payment',     to: '/fees'         },
  { icon: CheckSquare,   label: 'Attendance',   sub: 'QR or manual',       to: '/attendance'   },
  { icon: MessageCircle, label: 'Send message', sub: 'WhatsApp blast',     to: '/messages'     },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500 mb-3">Quick actions</p>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ icon: Icon, label, sub, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="bg-gray-50 hover:bg-primary-light hover:text-primary-dark border border-gray-100 rounded-card p-3 cursor-pointer transition-all text-left"
          >
            <Icon size={18} className="text-primary mb-1.5" />
            <p className="text-xs font-medium text-gray-700 group-hover:text-primary-dark">{label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
