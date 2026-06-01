import { useState, useEffect } from 'react'
import { Building2, CreditCard, User, Lock, Save, Plus, Check, Cpu, X as XIcon, Pencil, Trash2, Users } from 'lucide-react'
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

// ─── Smart day default based on plan name ────────────────────────────────────
function smartDays(name) {
  const n = name.toLowerCase()
  if (/daily|(?<!\w)day(?!\w)/.test(n))            return 1
  if (/weekly|(?<!\w)week(?!\w)/.test(n))           return 7
  if (/monthly|(?<!\w)month(?!\w)/.test(n))         return 30
  if (/quarterly|(?<!\w)quarter(?!\w)/.test(n))     return 90
  if (/half|6\s*month/.test(n))                     return 180
  if (/yearly|annual|(?<!\w)year(?!\w)/.test(n))    return 365
  return ''
}

// ─── Section 2: Plan management ───────────────────────────────────────────────
function PlansSection() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gyms        = useGymStore((s) => s.gyms)

  const [plans,          setPlans]         = useState([])
  const [editingId,      setEditingId]     = useState(null)
  const [editForm,       setEditForm]      = useState({})
  const [savingId,       setSavingId]      = useState(null)
  const [deleteConfirm,  setDeleteConfirm] = useState(null) // plan id awaiting confirm
  const [adding,         setAdding]        = useState(false)
  const [newPlan,        setNewPlan]       = useState({ name: '', duration_days: '', price: '' })

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase.from('plans').select('*').eq('gym_id', activeGymId).eq('is_active', true).order('duration_days')
      .then(({ data }) => setPlans(data || []))
  }, [activeGymId])

  // ── Edit existing plan ──────────────────────────────────────────────────────
  function startEdit(plan) {
    setEditingId(plan.id)
    setEditForm({ name: plan.name, price: plan.price, duration_days: plan.duration_days })
    setDeleteConfirm(null)
  }

  function cancelEdit() { setEditingId(null); setEditForm({}) }

  async function saveEdit() {
    setSavingId(editingId)
    const { error } = await supabase.from('plans').update({
      name:          editForm.name,
      price:         Number(editForm.price),
      duration_days: Number(editForm.duration_days),
    }).eq('id', editingId)
    setSavingId(null)
    if (error) { toast.error(error.message); return }
    setPlans(ps => ps.map(p =>
      p.id === editingId
        ? { ...p, name: editForm.name, price: Number(editForm.price), duration_days: Number(editForm.duration_days) }
        : p
    ))
    setEditingId(null)
    setEditForm({})
    toast.success('Plan updated')
  }

  // ── Delete plan ─────────────────────────────────────────────────────────────
  async function confirmDelete(id) {
    const { error } = await supabase.from('plans').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setPlans(ps => ps.filter(p => p.id !== id))
    setDeleteConfirm(null)
    toast.success('Plan deleted')
  }

  // ── Add new plan ────────────────────────────────────────────────────────────
  async function addPlan() {
    if (!newPlan.name || !newPlan.duration_days || !activeGymId) return
    setAdding(true)
    const { data, error } = await supabase.from('plans').insert({
      gym_id:        activeGymId,
      name:          newPlan.name,
      duration_days: Number(newPlan.duration_days),
      price:         Number(newPlan.price) || 0,
      is_active:     true,
    }).select().single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setPlans(ps => [...ps, data].sort((a, b) => a.duration_days - b.duration_days))
    setNewPlan({ name: '', duration_days: '', price: '' })
    toast.success('Plan added')
  }

  function handleNewNameChange(name) {
    const days = smartDays(name)
    setNewPlan(p => ({ ...p, name, ...(days !== '' ? { duration_days: days } : {}) }))
  }

  const gymName = gyms.find(g => g.id === activeGymId)?.location || gyms.find(g => g.id === activeGymId)?.name || ''

  return (
    <Section icon={CreditCard} title="Membership plans" subtitle={`Plans for ${gymName || 'active gym'}`}>

      {/* ── Existing plans list ── */}
      {plans.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No plans found for this gym.</p>
      ) : (
        <div className="space-y-1">
          {plans.map((plan) => {
            /* Delete confirmation row */
            if (deleteConfirm === plan.id) {
              return (
                <div key={plan.id} className="flex items-center justify-between gap-3 p-3 bg-danger-light rounded-lg border border-danger/20">
                  <p className="text-xs text-danger font-medium leading-snug">
                    Delete <strong>"{plan.name}"</strong>? Members currently on this plan will not be affected.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => confirmDelete(plan.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-danger text-white rounded-btn hover:opacity-90 transition-opacity"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white text-gray-600 rounded-btn border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            /* Inline edit row */
            if (editingId === plan.id) {
              return (
                <div key={plan.id} className="flex items-center gap-2 p-2 bg-primary-light/30 rounded-lg border border-primary/20">
                  <input
                    className="input flex-1 min-w-0 text-sm py-1.5"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Plan name"
                  />
                  <input
                    type="number"
                    className="input w-20 text-sm py-1.5 text-center shrink-0"
                    value={editForm.price}
                    onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="₹"
                    title="Amount (₹)"
                  />
                  <input
                    type="number"
                    className="input w-16 text-sm py-1.5 text-center shrink-0"
                    value={editForm.duration_days}
                    onChange={e => setEditForm(f => ({ ...f, duration_days: e.target.value }))}
                    placeholder="Days"
                    title="Duration (Days)"
                  />
                  <button
                    onClick={saveEdit}
                    disabled={savingId === plan.id}
                    className="shrink-0 w-7 h-7 rounded-btn bg-success text-white hover:opacity-80 transition-opacity flex items-center justify-center disabled:opacity-50"
                    title="Save"
                  >
                    {savingId === plan.id
                      ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Check size={13} />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="shrink-0 w-7 h-7 rounded-btn bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
                    title="Cancel"
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              )
            }

            /* Normal display row */
            return (
              <div key={plan.id} className="flex items-center gap-3 px-1 py-2.5 border-b border-gray-50 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{plan.name}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 w-20 text-right shrink-0">
                  ₹{Number(plan.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-400 w-14 shrink-0 text-center">{plan.duration_days}d</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { startEdit(plan) }}
                    className="w-7 h-7 rounded-btn text-gray-400 hover:text-primary hover:bg-primary-light transition-colors flex items-center justify-center"
                    title="Edit plan"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(plan.id); setEditingId(null) }}
                    className="w-7 h-7 rounded-btn text-gray-400 hover:text-danger hover:bg-danger-light transition-colors flex items-center justify-center"
                    title="Delete plan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add new plan ── */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-3">Add new plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-800 mb-1">Plan Name</label>
            <input
              className="input"
              placeholder="e.g. Monthly Premium"
              value={newPlan.name}
              onChange={e => handleNewNameChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Amount (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 1500"
              value={newPlan.price}
              onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Duration (Days)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 30"
              value={newPlan.duration_days}
              onChange={e => setNewPlan(p => ({ ...p, duration_days: e.target.value }))}
            />
          </div>
        </div>
        <button
          onClick={addPlan}
          disabled={adding || !newPlan.name || !newPlan.duration_days}
          className="btn-primary flex items-center gap-1.5 disabled:opacity-60"
        >
          <Plus size={14} />
          {adding ? 'Adding…' : 'Add plan'}
        </button>
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
  const [newDev,   setNewDev]   = useState({ deviceName: '', ipAddress: '', port: '8080', device_type: 'hikvision' })

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase.from('fingerprint_devices').select('*').eq('gym_id', activeGymId).order('created_at')
      .then(({ data }) => setDevices(data || []))
  }, [activeGymId])

  async function addDevice() {
    if (!newDev.deviceName || !newDev.ipAddress || !activeGymId) return
    setAdding(true)
    const { data, error } = await supabase.from('fingerprint_devices').insert({
      gym_id:      activeGymId,
      device_name: newDev.deviceName,
      device_ip:   newDev.ipAddress,
      device_port: parseInt(newDev.port) || 80,
      device_type: newDev.device_type,
      is_active:   true,
    }).select().single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    setDevices(d => [...d, data])
    setNewDev({ deviceName: '', ipAddress: '', port: '8080', device_type: 'hikvision' })
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
                <p className="text-sm font-semibold text-gray-800 truncate">{dev.device_name}</p>
                <p className="text-xs text-gray-400">{dev.device_ip}:{dev.device_port} · {dev.device_type}</p>
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
              <input className="input" placeholder="e.g. Main Entrance" value={newDev.deviceName}
                onChange={e => setNewDev(d => ({ ...d, deviceName: e.target.value }))} />
            </Field>
            <Field label="IP address">
              <input className="input" placeholder="e.g. 192.168.1.100" value={newDev.ipAddress}
                onChange={e => setNewDev(d => ({ ...d, ipAddress: e.target.value }))} />
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
              disabled={adding || !newDev.deviceName || !newDev.ipAddress}
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

// ─── Section 4: Trainers ─────────────────────────────────────────────────────
function TrainersSection() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const gyms        = useGymStore((s) => s.gyms)
  const userRole    = useGymStore((s) => s.userRole)
  const userGymId   = useGymStore((s) => s.userGymId)

  const isRestricted  = userRole === 'co_owner' || userRole === 'staff'
  const effectiveGymId = isRestricted ? userGymId : activeGymId

  const [trainers,      setTrainers]      = useState([])
  const [editingId,     setEditingId]     = useState(null)
  const [editForm,      setEditForm]      = useState({})
  const [savingId,      setSavingId]      = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [newTrainer,    setNewTrainer]    = useState({ name: '', title: '', phone: '', gym_id: '' })
  const [adding,        setAdding]        = useState(false)

  useEffect(() => {
    if (!supabaseReady || !effectiveGymId) return
    async function fetchTrainers() {
      let { data, error } = await supabase.from('trainers').select('id, name, title, phone, gym_id')
        .eq('gym_id', effectiveGymId).order('name')
      if (error) {
        // title column may not exist yet — retry without it
        ;({ data } = await supabase.from('trainers').select('id, name, phone, gym_id')
          .eq('gym_id', effectiveGymId).order('name'))
      }
      setTrainers((data || []).map((t) => ({ title: '', ...t })))
    }
    fetchTrainers()
  }, [effectiveGymId])

  useEffect(() => {
    setNewTrainer((t) => ({ ...t, gym_id: effectiveGymId || '' }))
  }, [effectiveGymId])

  function trainerInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function startEdit(trainer) {
    setEditingId(trainer.id)
    setEditForm({ name: trainer.name || '', title: trainer.title || '', phone: trainer.phone || '' })
    setDeleteConfirm(null)
  }
  function cancelEdit() { setEditingId(null); setEditForm({}) }

  async function saveEdit() {
    if (!editForm.name.trim()) { toast.error('Name is required'); return }
    setSavingId(editingId)
    const { error } = await supabase.from('trainers').update({
      name:  editForm.name.trim(),
      title: editForm.title.trim() || null,
      phone: editForm.phone.trim() || null,
    }).eq('id', editingId)
    setSavingId(null)
    if (error) { toast.error(error.message); return }
    setTrainers((ts) => ts.map((t) =>
      t.id === editingId
        ? { ...t, name: editForm.name.trim(), title: editForm.title.trim() || null, phone: editForm.phone.trim() || null }
        : t
    ))
    setEditingId(null)
    setEditForm({})
    toast.success('Trainer updated')
  }

  async function confirmDelete(trainer) {
    await supabase.from('members').update({ trainer_id: null }).eq('trainer_id', trainer.id)
    const { error } = await supabase.from('trainers').delete().eq('id', trainer.id)
    if (error) { toast.error(error.message); return }
    setTrainers((ts) => ts.filter((t) => t.id !== trainer.id))
    setDeleteConfirm(null)
    toast.success(`${trainer.name} removed as trainer`)
  }

  async function addTrainer() {
    if (!newTrainer.name.trim()) { toast.error('Name is required'); return }
    const gymId = isRestricted ? userGymId : (newTrainer.gym_id || activeGymId)
    if (!gymId) { toast.error('Select a gym'); return }
    setAdding(true)
    const { data, error } = await supabase.from('trainers').insert({
      name:   newTrainer.name.trim(),
      title:  newTrainer.title.trim() || null,
      phone:  newTrainer.phone.trim() || null,
      gym_id: gymId,
    }).select().single()
    setAdding(false)
    if (error) { toast.error(error.message); return }
    if (gymId === effectiveGymId) {
      setTrainers((ts) => [...ts, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setNewTrainer((t) => ({ ...t, name: '', title: '', phone: '' }))
    toast.success(`${data.name} added as trainer`)
  }

  const gymName = gyms.find((g) => g.id === effectiveGymId)?.location
    || gyms.find((g) => g.id === effectiveGymId)?.name || ''

  return (
    <Section icon={Users} title="Trainers" subtitle={`Manage trainers for ${gymName || 'active gym'}`}>

      {/* ── Trainer list ── */}
      {trainers.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No trainers added yet. Add your first trainer below.</p>
      ) : (
        <div className="space-y-1">
          {trainers.map((trainer) => {

            /* Delete confirmation row */
            if (deleteConfirm === trainer.id) {
              return (
                <div key={trainer.id} className="flex items-center justify-between gap-3 p-3 bg-danger-light rounded-lg border border-danger/20">
                  <p className="text-xs text-danger font-medium leading-snug">
                    Remove <strong>"{trainer.name}"</strong> as trainer? Members assigned to them will have their trainer set to None.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => confirmDelete(trainer)}
                      className="px-2.5 py-1 text-xs font-semibold bg-danger text-white rounded-btn hover:opacity-90 transition-opacity"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white text-gray-600 rounded-btn border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            /* Inline edit row */
            if (editingId === trainer.id) {
              return (
                <div key={trainer.id} className="flex items-center gap-2 p-2 bg-primary-light/30 rounded-lg border border-primary/20">
                  <input
                    className="input flex-1 min-w-0 text-sm py-1.5"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    autoFocus
                  />
                  <input
                    className="input flex-1 min-w-0 text-sm py-1.5"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Title / Certification"
                  />
                  <input
                    className="input w-28 text-sm py-1.5 shrink-0"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone"
                    maxLength={10}
                  />
                  <button
                    onClick={saveEdit}
                    disabled={savingId === trainer.id}
                    className="shrink-0 w-7 h-7 rounded-btn bg-success text-white hover:opacity-80 transition-opacity flex items-center justify-center disabled:opacity-50"
                    title="Save"
                  >
                    {savingId === trainer.id
                      ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Check size={13} />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="shrink-0 w-7 h-7 rounded-btn bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
                    title="Cancel"
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              )
            }

            /* Normal display row */
            return (
              <div key={trainer.id} className="flex items-center gap-3 px-1 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{trainerInitials(trainer.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{trainer.name}</p>
                  {trainer.title && <p className="text-xs text-gray-500 truncate">{trainer.title}</p>}
                </div>
                <span className="text-xs text-gray-400 w-24 text-right shrink-0 truncate">{trainer.phone || '—'}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(trainer)}
                    className="w-7 h-7 rounded-btn text-gray-400 hover:text-primary hover:bg-primary-light transition-colors flex items-center justify-center"
                    title="Edit trainer"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(trainer.id); setEditingId(null) }}
                    className="w-7 h-7 rounded-btn text-gray-400 hover:text-danger hover:bg-danger-light transition-colors flex items-center justify-center"
                    title="Remove trainer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add new trainer ── */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-3">Add new trainer</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Full Name</label>
            <input
              className="input"
              placeholder="e.g. Aryan Thakur"
              value={newTrainer.name}
              onChange={(e) => setNewTrainer((t) => ({ ...t, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Title / Certification</label>
            <input
              className="input"
              placeholder="e.g. NASM Certified, Professional Bodybuilder"
              value={newTrainer.title}
              onChange={(e) => setNewTrainer((t) => ({ ...t, title: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-0.5">This will show under their name on member profiles</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Phone Number</label>
            <div className="flex">
              <span className="input w-14 text-center text-gray-500 bg-gray-100 shrink-0" style={{ borderRadius: '8px 0 0 8px', borderRight: 0 }}>+91</span>
              <input
                className="input flex-1"
                style={{ borderRadius: '0 8px 8px 0' }}
                placeholder="9876543210"
                value={newTrainer.phone}
                onChange={(e) => setNewTrainer((t) => ({ ...t, phone: e.target.value }))}
                maxLength={10}
              />
            </div>
          </div>
          {!isRestricted && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Gym</label>
              <select
                className="input"
                value={newTrainer.gym_id}
                onChange={(e) => setNewTrainer((t) => ({ ...t, gym_id: e.target.value }))}
              >
                <option value="">Select gym</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>{g.location || g.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          onClick={addTrainer}
          disabled={adding || !newTrainer.name.trim()}
          className="btn-primary flex items-center gap-1.5 disabled:opacity-60"
        >
          <Plus size={14} />
          {adding ? 'Adding…' : '+ Add Trainer'}
        </button>
      </div>
    </Section>
  )
}

// ─── Section 5: Owner profile + password ─────────────────────────────────────
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
        <TrainersSection />
        <OwnerSection />
      </div>
    </AppLayout>
  )
}
