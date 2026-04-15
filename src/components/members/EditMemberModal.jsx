import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'

const schema = z.object({
  name:              z.string().min(2, 'Minimum 2 characters'),
  phone:             z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number'),
  date_of_birth:     z.string().optional(),
  gender:            z.string().optional(),
  address:           z.string().optional(),
  emergency_contact: z.string().optional(),
  health_notes:      z.string().optional(),
  batch_timing:      z.string().optional(),
  trainer_id:        z.string().optional(),
})

const BATCHES = ['6-8 AM', '7-9 AM', '10-12 PM', '5-7 PM', '7-9 PM']

function Field({ label, error, children }) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-xs text-danger mt-0.5">{error.message}</p>}
    </div>
  )
}

export default function EditMemberModal({ member, onClose, onSaved }) {
  const [saving,   setSaving]   = useState(false)
  const [trainers, setTrainers] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:              member.name              || '',
      phone:             member.phone             || '',
      date_of_birth:     member.date_of_birth     || '',
      gender:            member.gender            || '',
      address:           member.address           || '',
      emergency_contact: member.emergency_contact || '',
      health_notes:      member.health_notes      || '',
      batch_timing:      member.batch_timing      || '',
      trainer_id:        member.trainer_id        || '',
    },
  })

  useEffect(() => {
    if (!supabaseReady || !member.gym_id) return
    supabase
      .from('trainers')
      .select('id, name')
      .eq('gym_id', member.gym_id)
      .then(({ data }) => setTrainers(data || []))
  }, [member.gym_id])

  async function onSubmit(data) {
    if (!supabaseReady) { toast.error('Database not connected'); return }
    setSaving(true)
    const { error } = await supabase
      .from('members')
      .update({
        name:              data.name,
        phone:             data.phone,
        whatsapp:          data.phone,
        date_of_birth:     data.date_of_birth     || null,
        gender:            data.gender            || null,
        address:           data.address           || null,
        emergency_contact: data.emergency_contact || null,
        health_notes:      data.health_notes      || null,
        batch_timing:      data.batch_timing      || null,
        trainer_id:        data.trainer_id        || null,
      })
      .eq('id', member.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Member updated')
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl w-full max-w-lg left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Edit member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Full name *" error={errors.name}>
              <input {...register('name')} className="input" />
            </Field>

            <Field label="Phone / WhatsApp *" error={errors.phone}>
              <div className="flex">
                <span className="input w-14 text-center text-gray-500 bg-gray-100 shrink-0" style={{ borderRadius: '8px 0 0 8px', borderRight: 0 }}>+91</span>
                <input {...register('phone')} className="input flex-1" style={{ borderRadius: '0 8px 8px 0' }} maxLength={10} />
              </div>
            </Field>

            <Field label="Date of birth" error={errors.date_of_birth}>
              <input {...register('date_of_birth')} type="date" className="input" />
            </Field>

            <Field label="Gender" error={errors.gender}>
              <select {...register('gender')} className="input">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address}>
                <input {...register('address')} className="input" />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Emergency contact" error={errors.emergency_contact}>
                <input {...register('emergency_contact')} placeholder="Name · Phone" className="input" />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Health notes" error={errors.health_notes}>
                <textarea {...register('health_notes')} rows={2} className="input resize-none" />
              </Field>
            </div>

            <Field label="Batch timing" error={errors.batch_timing}>
              <select {...register('batch_timing')} className="input">
                <option value="">Select batch</option>
                {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Trainer" error={errors.trainer_id}>
              <select {...register('trainer_id')} className="input">
                <option value="">No trainer</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 justify-center flex-1 disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
