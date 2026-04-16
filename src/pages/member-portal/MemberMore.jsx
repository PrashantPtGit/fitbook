import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, MessageCircle, Clock, BookOpen, LogOut, Download, ChevronRight } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import MemberPortalLayout from './MemberPortalLayout'
import { useMemberPortal } from '../../hooks/useMemberPortal'
import { generateWhatsAppLink } from '../../utils/helpers'
import { supabase } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'

const TIMINGS = [
  { batch: 'Morning',   time: '6:00 AM – 10:00 AM',  days: 'Mon – Sat' },
  { batch: 'Evening',   time: '5:00 PM – 9:00 PM',   days: 'Mon – Sat' },
  { batch: 'Closed',    time: '—',                    days: 'Sundays & public holidays' },
]

const RULES = [
  'Carry your own water bottle.',
  'Wear proper gym shoes at all times.',
  'Return equipment to its place after use.',
  'No loud music without earphones.',
  'Maintain personal hygiene.',
  'Respect fellow members and staff.',
  'Inform trainer before starting a new exercise.',
  'No food inside the gym floor.',
]

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  )
}

function MenuItem({ icon: Icon, label, sub, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${danger ? 'text-red-500' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
        <Icon size={15} className={danger ? 'text-red-500' : 'text-gray-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <ChevronRight size={14} className="text-gray-300 shrink-0" />
    </button>
  )
}

export default function MemberMore() {
  const { member, loading } = useMemberPortal()
  const navigate            = useNavigate()
  const [showQR,   setShowQR]   = useState(false)
  const [showRules, setShowRules] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    useGymStore.getState().resetStore()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const trainerPhone = member?.trainers?.phone
  const waLink = trainerPhone
    ? generateWhatsAppLink(trainerPhone, `Hi, I need some help. - ${member?.name || 'Member'}`)
    : null

  const qrValue = member ? `FITBOOK:MEMBER:${member.id}:${member.member_code}` : ''

  if (loading) {
    return (
      <MemberPortalLayout title="More">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl h-32" />)}
        </div>
      </MemberPortalLayout>
    )
  }

  return (
    <MemberPortalLayout title="More">

      {/* QR Code card */}
      <Section title="My Check-In QR Code">
        {!showQR ? (
          <div className="px-4 py-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              <QrCode size={28} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Personal QR Code</p>
              <p className="text-xs text-gray-400 mb-3">Show to trainer for check-in</p>
              <button
                onClick={() => setShowQR(true)}
                className="text-xs font-semibold text-white px-3 py-1.5 rounded-btn transition-colors"
                style={{ background: '#1D9E75' }}
              >
                Show QR Code
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <QRCodeSVG
                value={qrValue}
                size={180}
                fgColor="#1D9E75"
                includeMargin={false}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-mono font-semibold text-gray-700">{member?.member_code}</p>
              <p className="text-xs text-gray-400">{member?.name}</p>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Show this QR code to your trainer for manual check-in
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Hide QR
            </button>
          </div>
        )}
      </Section>

      {/* Quick actions */}
      <Section title="Quick Actions">
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MenuItem
              icon={MessageCircle}
              label="Contact Trainer"
              sub={member?.trainers?.name || 'WhatsApp'}
            />
          </a>
        )}
        <MenuItem
          icon={Clock}
          label="Gym Timings"
          sub="Morning & evening batches"
          onClick={() => {
            const el = document.getElementById('gym-timings')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
        <MenuItem
          icon={BookOpen}
          label="Rules & Guidelines"
          sub="Gym etiquette"
          onClick={() => setShowRules((v) => !v)}
        />
      </Section>

      {/* Gym timings */}
      <div id="gym-timings">
        <Section title="Gym Timings">
          <div className="divide-y divide-gray-50">
            {TIMINGS.map(({ batch, time, days }) => (
              <div key={batch} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{batch}</p>
                  <p className="text-xs text-gray-400">{days}</p>
                </div>
                <p className="text-sm text-gray-600 font-mono">{time}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Rules & Guidelines (collapsible) */}
      {showRules && (
        <Section title="Rules & Guidelines">
          <div className="px-4 py-3 space-y-2">
            {RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 text-xs mt-0.5 shrink-0">✓</span>
                <p className="text-sm text-gray-700">{rule}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Account */}
      <Section title="Account">
        <MenuItem
          icon={LogOut}
          label="Logout"
          sub="Sign out of FitBook"
          onClick={handleLogout}
          danger
        />
      </Section>

      <p className="text-center text-[11px] text-gray-400 mt-2 mb-6">
        FitBook · {member?.gyms?.name}
      </p>
    </MemberPortalLayout>
  )
}
