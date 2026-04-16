import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Briefcase, Dumbbell, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleSend() {
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      toast.error('Could not send reset email. Check the address and try again.')
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Reset password</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        {sent ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center mx-auto mb-3">
              <span className="text-success text-xl">✓</span>
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">Email sent!</p>
            <p className="text-xs text-gray-500">Check your inbox for the password reset link.</p>
            <button onClick={onClose} className="mt-4 btn-primary w-full justify-center">Done</button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">Enter your staff email and we'll send a reset link.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@mlcgym.com"
              className="input mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        )}
      </div>
    </>
  )
}

// ─── Staff Login Card ─────────────────────────────────────────────────────────
function StaffLoginCard() {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [forgotOpen,  setForgotOpen]  = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }

    if (!supabaseReady) {
      toast.error('Supabase not configured — check .env file.')
      return
    }

    setLoading(true)

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authErr) {
      setLoading(false)
      if (authErr.message.toLowerCase().includes('invalid')) {
        setError('Incorrect password. Please try again.')
      } else if (authErr.message.toLowerCase().includes('not found')) {
        setError('No account found with this email.')
      } else {
        setError(authErr.message || 'Connection error. Please check your internet.')
      }
      return
    }

    // Fetch role
    const { data: roleData, error: roleErr } = await supabase
      .from('user_roles')
      .select('role, gym_id, name')
      .eq('user_id', authData.user.id)
      .single()

    setLoading(false)

    if (roleErr || !roleData) {
      await supabase.auth.signOut()
      setError('You do not have staff access. Contact Archit Chhatwal.')
      return
    }

    useGymStore.getState().setUserRole(roleData.role, roleData.gym_id, roleData.name)
    toast.success(`Welcome back, ${roleData.name || 'Staff'}!`)
    navigate('/')
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-hero border border-purple-100 p-6 flex flex-col gap-5 h-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-primary-dark" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Staff Login
            </h2>
            <p className="text-xs text-gray-500">For gym owners and co-owners only</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@mlcgym.com"
              className="input"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-1 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Login as Staff'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-xs text-primary hover:underline self-start -mt-2"
        >
          Forgot password? Contact Archit Chhatwal
        </button>
      </div>

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </>
  )
}

// ─── Member Login Card ────────────────────────────────────────────────────────
function MemberLoginCard() {
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Enter a valid 10-digit phone number.'); return }
    if (!password)             { setError('Please enter your password.'); return }

    if (!supabaseReady) {
      toast.error('Supabase not configured.')
      return
    }

    setLoading(true)

    // Members login with phone@mlcgym.member email format
    const email = `${digits}@mlcgym.member`
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authErr) {
      setError('Invalid phone or password. Contact your trainer.')
      return
    }

    toast.success('Welcome back!')
    navigate('/member-portal')
  }

  return (
    <div className="bg-white rounded-2xl shadow-hero border border-teal-100 p-6 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center shrink-0">
          <Dumbbell size={18} className="text-success-dark" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Member Login
          </h2>
          <p className="text-xs text-gray-500">For gym members to view their profile</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        <div>
          <label className="label">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            maxLength={10}
            className="input"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full justify-center mt-1 disabled:opacity-60 px-4 py-2.5 rounded-btn text-sm font-semibold text-white transition-colors"
          style={{ background: loading ? '#1D9E75cc' : '#1D9E75' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking…
            </span>
          ) : 'Login as Member'}
        </button>
      </form>

      <p className="text-xs text-gray-400 -mt-2">
        New member? Your trainer will set up your account.
      </p>
    </div>
  )
}

// ─── Dev Hints ────────────────────────────────────────────────────────────────
function DevHints() {
  const [open, setOpen] = useState(false)
  if (!import.meta.env.DEV) return null

  const hints = [
    { label: 'Main Admin',  email: 'archit@mlcgym.com',      pwd: 'Archit@MLC123'   },
    { label: 'New Shimla',  email: 'newshimla@mlcgym.com',   pwd: 'NewShimla@123'   },
    { label: 'Chakkar',     email: 'chakkar@mlcgym.com',     pwd: 'Chakkar@123'     },
    { label: 'Mall Road',   email: 'mallroad@mlcgym.com',    pwd: 'MallRoad@123'    },
  ]

  return (
    <div className="mt-4 border border-dashed border-primary/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-primary bg-primary-light/50 hover:bg-primary-light transition-colors"
      >
        <span>🛠 Dev hints — staff logins</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-white divide-y divide-gray-50">
          {hints.map((h) => (
            <div key={h.email} className="py-1.5 flex items-center justify-between gap-4">
              <span className="text-[11px] font-medium text-gray-600 w-24 shrink-0">{h.label}</span>
              <span className="text-[11px] text-gray-500 font-mono truncate">{h.email}</span>
              <span className="text-[11px] text-gray-400 font-mono shrink-0">{h.pwd}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
const LOCATIONS = [
  { name: 'MLC Gym New Shimla', color: 'bg-gym2-light text-gym2-dark' },
  { name: 'MLC Gym Chakkar',    color: 'bg-gym3-light text-gym3-dark' },
  { name: 'MLC Gym Mall Road',  color: 'bg-gym1-light text-gym1-dark' },
]

export default function Login() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 page-enter"
      style={{ background: 'linear-gradient(135deg, #F8F7FF 0%, #EEEDFE 50%, #F8F7FF 100%)' }}
    >
      <div className="w-full max-w-3xl">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3"
            style={{ boxShadow: '0 8px 24px rgba(83,74,183,0.35)' }}
          >
            <span className="text-white font-bold text-2xl" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>F</span>
          </div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            MLC Gym — FitBook
          </h1>
          <p className="text-sm text-gray-500 mt-1">All-in-one gym management system</p>
        </div>

        {/* Two login cards */}
        <div className="grid md:grid-cols-2 gap-4 items-stretch">
          <StaffLoginCard />
          <MemberLoginCard />
        </div>

        {/* Dev hints */}
        <DevHints />

        {/* Location pills */}
        <div className="mt-6 flex items-center gap-2 justify-center flex-wrap">
          {LOCATIONS.map((loc) => (
            <span
              key={loc.name}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${loc.color}`}
            >
              <MapPin size={10} />
              {loc.name}
            </span>
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">Powered by FitBook</p>
      </div>
    </div>
  )
}
