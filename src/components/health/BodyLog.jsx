import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { PlusCircle, Trash2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { todayISO } from '../../utils/helpers'
import { SkeletonRow } from '../ui/Skeleton'

const FIELDS = [
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'chest',  label: 'Chest',  unit: 'cm' },
  { key: 'waist',  label: 'Waist',  unit: 'cm' },
  { key: 'hips',   label: 'Hips',   unit: 'cm' },
  { key: 'arms',   label: 'Arms',   unit: 'cm' },
  { key: 'thighs', label: 'Thighs', unit: 'cm' },
]

const EMPTY_FORM = { weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '', date: todayISO() }

export default function BodyLog({ memberId, memberName }) {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [showing, setShowing] = useState(false)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!supabaseReady || !memberId) { setLoading(false); return }
    fetchLogs()
  }, [memberId])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('gym_id', activeGymId)
      .eq('member_id', memberId)
      .order('date', { ascending: false })
      .limit(30)
    setLogs(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.date) { toast.error('Please set a date'); return }
    setSaving(true)
    const payload = {
      gym_id:    activeGymId,
      member_id: memberId,
      date:      form.date,
      weight:    parseFloat(form.weight) || null,
      chest:     parseFloat(form.chest)  || null,
      waist:     parseFloat(form.waist)  || null,
      hips:      parseFloat(form.hips)   || null,
      arms:      parseFloat(form.arms)   || null,
      thighs:    parseFloat(form.thighs) || null,
    }
    const { error } = await supabase.from('body_measurements').insert(payload)
    if (error) { toast.error('Could not save measurement'); }
    else        { toast.success('Measurement saved'); setForm(EMPTY_FORM); setShowing(false); fetchLogs() }
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('body_measurements').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { toast.success('Deleted'); setLogs((prev) => prev.filter((l) => l.id !== id)) }
  }

  // Chart data — only entries with weight, ordered by date asc
  const chartData = useMemo(() =>
    [...logs].filter((l) => l.weight).reverse().map((l) => ({
      date:   format(parseISO(l.date), 'd MMM'),
      weight: l.weight,
    }))
  , [logs])

  if (!memberId) {
    return <p className="text-sm text-gray-400 text-center py-6">Select a member to view body measurements.</p>
  }

  return (
    <div className="space-y-4">
      {/* Weight chart */}
      {chartData.length >= 2 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Weight trend (kg)</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#534AB7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={32} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              <Area type="monotone" dataKey="weight" stroke="#534AB7" strokeWidth={2} fill="url(#wGrad)" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Showing last {logs.length} entries</p>
        <button onClick={() => setShowing((v) => !v)} className="btn-primary flex items-center gap-1.5 py-1.5 text-xs">
          <PlusCircle size={13} /> Add measurement
        </button>
      </div>

      {/* Add form */}
      {showing && (
        <div className="bg-gray-50 rounded-card p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700">New measurement for {memberName}</p>
          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FIELDS.map(({ key, label, unit }) => (
              <div key={key} className="form-group">
                <label className="label">{label} ({unit})</label>
                <input type="number" min="0" step="0.1" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="input" placeholder="—" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowing(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No measurements yet. Add the first one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 pr-3 text-xs text-gray-400 font-medium whitespace-nowrap">Date</th>
                {FIELDS.map(({ key, label, unit }) => (
                  <th key={key} className="pb-2 px-2 text-xs text-gray-400 font-medium whitespace-nowrap">{label} ({unit})</th>
                ))}
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap text-xs">{format(parseISO(log.date), 'd MMM yyyy')}</td>
                  {FIELDS.map(({ key }) => (
                    <td key={key} className="py-2.5 px-2 text-gray-800 text-center">{log[key] ?? '—'}</td>
                  ))}
                  <td className="py-2.5 pl-2">
                    <button onClick={() => handleDelete(log.id)} className="p-1 text-gray-300 hover:text-danger transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
