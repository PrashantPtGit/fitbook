import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { todayISO } from '../../utils/helpers'
import MessagePreview from './MessagePreview'
import SendProgress from './SendProgress'

const MAX_CHARS = 320

const BATCH_OPTIONS = ['6-8 AM', '7-9 AM', '5-7 PM', '7-9 PM']

// BroadcastForm accepts a ref so parent can call setMessage() (from template click)
const BroadcastForm = forwardRef(function BroadcastForm({ gymId, gymName }, ref) {
  const activeGymId = useGymStore((s) => s.activeGymId)

  const [allMembers,  setAllMembers]  = useState([])
  const [segment,     setSegment]     = useState('active')
  const [message,     setMessage]     = useState('')
  const [showSend,    setShowSend]    = useState(false)
  const [loadingMems, setLoadingMems] = useState(true)

  // Expose setMessage to parent via ref
  useImperativeHandle(ref, () => ({
    setMessage: (text) => setMessage(text),
  }))

  // Fetch all active members with membership + attendance info
  useEffect(() => {
    if (!supabaseReady || !activeGymId) { setLoadingMems(false); return }

    async function load() {
      setLoadingMems(true)
      const today = todayISO()
      const in7   = new Date(); in7.setDate(in7.getDate() + 7)
      const in7str = in7.toISOString().split('T')[0]
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 10)
      const cutoffStr = cutoff.toISOString().split('T')[0]

      const [membersRes, expiringRes, expiredRes, recentAttRes] = await Promise.all([
        supabase
          .from('members')
          .select('id, name, phone, whatsapp, batch_timing, memberships(end_date, status)')
          .eq('gym_id', activeGymId)
          .eq('status', 'active'),
        supabase
          .from('memberships')
          .select('member_id')
          .eq('gym_id', activeGymId)
          .eq('status', 'active')
          .gte('end_date', today)
          .lte('end_date', in7str),
        supabase
          .from('memberships')
          .select('member_id')
          .eq('gym_id', activeGymId)
          .lt('end_date', today),
        supabase
          .from('attendance')
          .select('member_id')
          .eq('gym_id', activeGymId)
          .gte('date', cutoffStr),
      ])

      const members      = membersRes.data || []
      const expiringIds  = new Set((expiringRes.data || []).map((r) => r.member_id))
      const expiredIds   = new Set((expiredRes.data || []).map((r) => r.member_id))
      const recentIds    = new Set((recentAttRes.data || []).map((r) => r.member_id))

      // Annotate each member
      const annotated = members.map((m) => ({
        ...m,
        isExpiringSoon: expiringIds.has(m.id),
        isExpired:      expiredIds.has(m.id),
        isInactive:     !recentIds.has(m.id),
      }))

      setAllMembers(annotated)
      setLoadingMems(false)
    }

    load()
  }, [activeGymId])

  // Segment definitions
  const segments = useMemo(() => {
    const active    = allMembers
    const expiring  = allMembers.filter((m) => m.isExpiringSoon)
    const expired   = allMembers.filter((m) => m.isExpired)
    const inactive  = allMembers.filter((m) => m.isInactive)

    const batchSegs = BATCH_OPTIONS.map((b) => ({
      value: `batch_${b}`,
      label: `Batch ${b}`,
      members: allMembers.filter((m) => m.batch_timing === b),
    }))

    return [
      { value: 'active',   label: 'All active members',    members: active },
      { value: 'expiring', label: 'Expiring this week',    members: expiring },
      { value: 'expired',  label: 'Expired members',       members: expired },
      { value: 'inactive', label: 'Inactive 10+ days',     members: inactive },
      ...batchSegs,
    ]
  }, [allMembers])

  const currentSegment = segments.find((s) => s.value === segment) || segments[0]
  const recipients     = currentSegment?.members || []
  const firstMember    = recipients[0]
  const chars          = message.length
  const canSend        = message.trim().length > 0 && recipients.length > 0

  return (
    <div className="space-y-4">

      {/* Segment selector */}
      <div className="form-group">
        <label className="label">Send to</label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="input"
        >
          {segments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} ({s.members.length})
            </option>
          ))}
        </select>
      </div>

      {/* Channel */}
      <div className="form-group">
        <label className="label">Channel</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-4 h-4 rounded-full border-2 border-success bg-success flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-sm text-gray-800 font-medium">WhatsApp</span>
          </label>
          <label className="flex items-center gap-2 opacity-40 cursor-not-allowed">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            <span className="text-sm text-gray-500">SMS</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Coming soon</span>
          </label>
        </div>
      </div>

      {/* Message textarea */}
      <div className="form-group">
        <label className="label">
          Message
          <span className={`ml-auto font-normal ${chars > MAX_CHARS ? 'text-danger' : 'text-gray-400'}`}>
            {chars} / {MAX_CHARS}
          </span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={MAX_CHARS + 50}
          placeholder="Type your message… Use [Name] for personalisation"
          className={`input resize-none font-mono text-sm ${chars > MAX_CHARS ? 'border-danger' : ''}`}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Tip: use <span className="font-mono text-primary">[Name]</span> to personalise each message
        </p>
      </div>

      {/* Live preview */}
      {message.trim() && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Live preview</p>
          <MessagePreview
            message={message}
            memberName={firstMember?.name || 'Member'}
            gymName={gymName}
          />
        </div>
      )}

      {/* Send button */}
      <button
        onClick={() => canSend && setShowSend(true)}
        disabled={!canSend || loadingMems}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageCircle size={16} />
        {loadingMems
          ? 'Loading members…'
          : `Send to ${recipients.length} member${recipients.length !== 1 ? 's' : ''} on WhatsApp`}
      </button>

      {/* Send progress modal */}
      {showSend && (
        <SendProgress
          members={recipients}
          message={message}
          gymId={activeGymId}
          gymName={gymName}
          onComplete={() => { setShowSend(false); setMessage(''); toast.success(`Broadcast complete!`) }}
          onCancel={() => setShowSend(false)}
        />
      )}
    </div>
  )
})

export default BroadcastForm
