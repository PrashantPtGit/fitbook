import { useState, useEffect } from 'react'
import { Building2, CreditCard, User, Lock, Save, Plus, Check, Cpu, X as XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { supabase, supabaseReady } from '../lib/supabase'
import { useGymStore } from '../store/useGymStore'

// ─── Shared primitives ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
          <Icon size={15} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function SaveBtn({ loading, onClick, label = 'Save changes' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="btn-primary flex items-center gap-2 disabled:opacity-60"
    >
      {loading ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
      {loading ? 'Saving…' : label}
    </button>
  )
}

// ─── Section 1: Gym details ───────────────────────────────────────────────────
function GymDetailsSection({ gyms }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const gym = gyms[activeIdx]

  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)

  // Reset form when gym tab changes
  useEffect(() => {
    if (!gym) return
    setForm({
      name:    gym.name    || '',
      location: gym.location || '',
      address: gym.address || '',
      phone:   gym.phone   || '',
      upi_id:  gym.upi_id  || '',
    })
  }, [activeIdx, gym?.id])

  async function save() {
    if (!supabaseReady || !gym) return
    setSaving(true)
    const { error } = await supabase.from('gyms').update({
      name:     form.name,
      location: form.location,
      address:  form.address,
      phone:    form.phone,
      upi_id:   form.upi_id,
    }).eq('id', gym.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    // Update Zustand store
    const updated = gyms.map((g, i) => i === activeIdx ? { ...g, ...form } : g)
    useGymStore.setState({ gyms: updated, activeGym: updated.find(g => g.id === useGymStore.getState().activeGymId) || null })
    toast.success('Gym details saved')
  }

  if (!gym) return <p className="text-sm text-gray-400">No gyms found.</p>

  return (
    <Section icon={Building2} title="Gym details" subtitle="Edit info for each gym location">
      {/* Gym tabs */}
      {gyms.length > 1 && (
        <div className="flex gap-1 mb-4 border-b border-gray-100">
          {gyms.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                i === activeIdx ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {g.location || g.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Gym name">
          <input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Location / area">
          <input className="input" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input className="input" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </Field>
        </div>
        <Field label="Phone number">
          <input className="input" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={10} />
        </Field>
        <Field label="UPI ID">
          <input className="input" placeholder="e.g. gym@upi" value={form.upi_id || ''} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <SaveBtn loading={saving} onClick={save} />
      </div>
    </Section>
  )
}

// ─── Section 2: Plan management ───────────────────────────────────────────────
function PlansSection() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gyms        = useGymStore((s) => s.gyms)

  const [plans,   setPlans]   = useState([])
  const [saving,  setSaving]  = useState(null)   // plan id being saved
  const [adding,  setAdding]  = useState(false)
  const [newPlan, setNewPlan] = useState({ name: '', duration_days: 30, price: 0 })

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase.from('plans').select('*').eq('gym_id', activeGymId).eq('is_active', true).order('duration_days')
      .then(({ data }) => setPlans(data || []))
  }, [activeGymId])

  async function savePlan(plan) {
    setSaving(plan.id)
    const { error } = await supabase.from('plans').update({ name: plan.name, price: plan.price }).eq('id', plan.id)
    setSaving(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${plan.name} updated`)
  }

  async function addPlan() {
    if (!newPlan.name || !activeGymId) return
    setAdding(true)
    const { data, error } = await supabase.from('plans').insert({
      gym_id:        activeGymId,
      name:          newPlan.name,
      duration_days: Number(newPlan.duration_days),
      price:         Number(newPlan.price),
      is_active:     true,
    }).select().single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setPlans(p => [...p, data])
    setNewPlan({ name: '', duration_days: 30, price: 0 })
    toast.success('Plan added')
  }

  const gymName = gyms.find(g => g.id === activeGymId)?.location || gyms.find(g => g.id === activeGymId)?.name || ''

  return (
    <Section icon={CreditCard} title="Membership plans" subtitle={`Plans for ${gymName || 'active gym'}`}>
      {plans.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No plans found for this gym.</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <input
                  className="input text-sm py-1.5"
                  value={plan.name}
                  onChange={e => setPlans(ps => ps.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))}
                />
              </div>
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  className="input text-sm py-1.5 text-center"
                  value={plan.price}
                  onChange={e => setPlans(ps => ps.map(p => p.id === plan.id ? { ...p, price: Number(e.target.value) } : p))}
                />
              </div>
              <span className="text-xs text-gray-400 w-14 shrink-0">{plan.duration_days}d</span>
              <button
                onClick={() => savePlan(plan)}
                disabled={saving === plan.id}
                className="shrink-0 w-7 h-7 rounded-btn bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {saving === plan.id
                  ? <span className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  : <Check size={13} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new plan */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-3">Add custom plan</p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-[120px]"
            placeholder="Plan name"
            value={newPlan.name}
            onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))}
          />
          <input
            type="number"
            className="input w-24"
            placeholder="Days"
            value={newPlan.duration_days}
            onChange={e => setNewPlan(p => ({ ...p, duration_days: e.target.value }))}
          />
          <input
            type="number"
            className="input w-24"
            placeholder="₹ Price"
            value={newPlan.price}
            onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))}
          />
          <button
            onClick={addPlan}
            disabled={adding || !newPlan.name}
            className="btn-primary flex items-center gap-1.5 disabled:opacity-60"
          >
            <Plus size={14} />
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </Section>
  )
}

// ─── Section 3: Attendance devices ───────────────────────────────────────────
function DevicesSection() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [devices,  setDevices]  = useState([])
  const [showAdd,  setShowAdd]  = useState(false)
  const [adding,   setAdding]   = useState(false)
  const [newDev,   setNewDev]   = useState({ name: '', ip_address: '', port: '8080', device_type: 'hikvision' })

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase.from('fingerprint_devices').select('*').eq('gym_id', activeGymId).order('created_at')
      .then(({ data }) => setDevices(data || []))
  }, [activeGymId])

  async function addDevice() {
    if (!newDev.name || !newDev.ip_address || !activeGymId) return
    setAdding(true)
    const { data, error } = await supabase.from('fingerprint_devices').insert({
      gym_id:      activeGymId,
      name:        newDev.name,
      ip_address:  newDev.ip_address,
      port:        Number(newDev.port) || 8080,
      device_type: newDev.device_type,
    }).select().single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setDevices(d => [...d, data])
    setNewDev({ name: '', ip_address: '', port: '8080', device_type: 'hikvision' })
    setShowAdd(false)
    toast.success('Device added')
  }

  async function removeDevice(id) {
    const { error } = await supabase.from('fingerprint_devices').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setDevices(d => d.filter(dev => dev.id !== id))
    toast.success('Device removed')
  }

  return (
    <Section icon={Cpu} title="Attendance devices" subtitle="Manage Hikvision / biometric machines">
      {devices.length > 0 && (
        <div className="space-y-2 mb-4">
          {devices.map(dev => (
            <div key={dev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Cpu size={13} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{dev.name}</p>
                <p className="text-xs text-gray-400">{dev.ip_address}:{dev.port} · {dev.device_type}</p>
              </div>
              <button
                onClick={() => removeDevice(dev.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger-light transition-colors"
              >
                <XIcon size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {devices.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 py-2 mb-3">No devices added yet. Add your Hikvision fingerprint machine below.</p>
      )}

      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} className="btn-secondary flex items-center gap-1.5">
          <Plus size={14} /> Add device
        </button>
      ) : (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">New device</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Device name">
              <input className="input" placeholder="e.g. Main Entrance" value={newDev.name}
                onChange={e => setNewDev(d => ({ ...d, name: e.target.value }))} />
            </Field>
            <Field label="IP address">
              <input className="input" placeholder="e.g. 192.168.1.100" value={newDev.ip_address}
                onChange={e => setNewDev(d => ({ ...d, ip_address: e.target.value }))} />
            </Field>
            <Field label="Port">
              <input type="number" className="input" value={newDev.port}
                onChange={e => setNewDev(d => ({ ...d, port: e.target.value }))} />
            </Field>
            <Field label="Device type">
              <select className="input" value={newDev.device_type}
                onChange={e => setNewDev(d => ({ ...d, device_type: e.target.value }))}>
                <option value="hikvision">Hikvision</option>
                <option value="zkteco">ZKTeco</option>
                <option value="essl">eSSL</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button
              onClick={addDevice}
              disabled={adding || !newDev.name || !newDev.ip_address}
              className="btn-primary flex items-center gap-1.5 flex-1 justify-center disabled:opacity-60"
            >
              <Plus size={14} />
              {adding ? 'Adding…' : 'Add device'}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

// ─── Section 4: Owner profile + password ─────────────────────────────────────
function OwnerSection() {
  const [profile,  setProfile]  = useState({ name: '', phone: '', email: '' })
  const [pwd,      setPwd]      = useState({ current: '', next: '', confirm: '' })
  const [saving,   setSaving]   = useState(false)
  const [pwdSave,  setPwdSave]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  useEffect(() => {
    if (!supabaseReady) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setProfile({
        name:  user.user_metadata?.name  || '',
        phone: user.user_metadata?.phone || '',
        email: user.email || '',
      })
    })
  }, [])

  async function saveProfile() {
    if (!supabaseReady) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { name: profile.name, phone: profile.phone },
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated')
  }

  async function changePassword() {
    if (pwd.next !== pwd.confirm) { toast.error('Passwords do not match'); return }
    if (pwd.next.length < 6)      { toast.error('Password must be at least 6 characters'); return }
    setPwdSave(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.next })
    setPwdSave(false)
    if (error) { toast.error(error.message); return }
    setPwd({ current: '', next: '', confirm: '' })
    toast.success('Password changed')
  }

  return (
    <Section icon={User} title="Owner profile" subtitle="Your account details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Full name">
          <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Phone">
          <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} maxLength={10} />
        </Field>
        <Field label="Email">
          <input className="input bg-gray-100 cursor-not-allowed" value={profile.email} readOnly />
        </Field>
      </div>
      <div className="flex justify-end mb-6">
        <SaveBtn loading={saving} onClick={saveProfile} />
      </div>

      {/* Change password */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={14} className="text-gray-400" />
          <p className="text-xs font-semibold text-gray-600">Change password</p>
          <button
            onClick={() => setShowPwd(v => !v)}
            className="ml-auto text-xs text-primary hover:underline"
          >
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPwd && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="New password">
              <input type="password" className="input" placeholder="Min. 6 characters" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} />
            </Field>
            <Field label="Confirm password">
              <input type="password" className="input" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
            </Field>
            <div className="flex items-end">
              <button
                onClick={changePassword}
                disabled={pwdSave || !pwd.next}
                className="btn-secondary flex items-center gap-2 disabled:opacity-60 w-full justify-center"
              >
                {pwdSave ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Lock size={13} />}
                {pwdSave ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const gyms = useGymStore((s) => s.gyms)

  return (
    <AppLayout pageTitle="Settings" pageSubtitle="Manage gym details, plans, and your account">
      <div className="max-w-2xl">
        <GymDetailsSection gyms={gyms} />
        <PlansSection />
        <DevicesSection />
        <OwnerSection />
      </div>
    </AppLayout>
  )
}
