import { useState } from 'react'
import { X, ExternalLink, ChevronRight, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../ui/Avatar'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { generateWhatsAppLink } from '../../utils/helpers'

function personalise(template, member) {
  return (template || '')
    .replace(/\[Name\]/gi, member.name || 'Member')
    .replace(/\[Gym\]/gi, member.gymName || 'the gym')
}

async function logMessage(gymId, memberId, message, type = 'broadcast') {
  if (!supabaseReady) return
  await supabase.from('message_logs').insert({
    gym_id:    gymId,
    member_id: memberId,
    type,
    message,
    status:    'sent',
    sent_at:   new Date().toISOString(),
  })
}

export default function SendProgress({ members, message, gymId, gymName, onComplete, onCancel }) {
  const [step,    setStep]    = useState(0)   // index into members[]
  const [sent,    setSent]    = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [phase,   setPhase]   = useState('confirm')  // confirm | sending | done

  const total   = members.length
  const current = members[step]

  function personalMsg(m) {
    return personalise(message, { ...m, gymName })
  }

  function openWA(m) {
    const link = generateWhatsAppLink(m.whatsapp || m.phone || '', personalMsg(m))
    window.open(link, '_blank')
  }

  async function handleSent() {
    if (current) {
      await logMessage(gymId, current.id, personalMsg(current))
      setSent((s) => s + 1)
    }
    advance()
  }

  function handleSkip() {
    setSkipped((s) => s + 1)
    advance()
  }

  function advance() {
    if (step + 1 >= total) {
      setPhase('done')
    } else {
      setStep((s) => s + 1)
      // Auto-open next WA
      const next = members[step + 1]
      if (next) {
        const link = generateWhatsAppLink(next.whatsapp || next.phone || '', personalise(message, { ...next, gymName }))
        window.open(link, '_blank')
      }
    }
  }

  // ── Confirm phase ──────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50" onClick={onCancel} />
        <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Confirm broadcast</h3>
          <p className="text-sm text-gray-500 mb-1">
            You are about to send to <span className="font-semibold text-gray-800">{total} members</span>.
          </p>
          <p className="text-sm text-gray-500 mb-5">
            This will open <strong>{total}</strong> WhatsApp chat{total !== 1 ? 's' : ''} one by one.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                setPhase('sending')
                openWA(members[0])
              }}
              className="btn-primary flex-1"
            >
              Start sending
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Done phase ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50" />
        <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Broadcast complete!</h3>
            <p className="text-sm text-gray-500 mb-1">
              Sent to <span className="font-semibold text-success-dark">{sent}</span> of {total} members
            </p>
            {skipped > 0 && (
              <p className="text-xs text-gray-400">{skipped} skipped</p>
            )}
          </div>
          <button onClick={onComplete} className="btn-primary w-full mt-5">Done</button>
        </div>
      </>
    )
  }

  // ── Sending phase ───────────────────────────────────────────────────────────
  const progressPct = Math.round((step / total) * 100)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl p-5 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Sending broadcast</h3>
          <button onClick={onCancel} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{step} of {total} sent</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current member */}
        {current && (
          <div className="mt-4 p-3 bg-gray-50 rounded-btn flex items-center gap-3">
            <Avatar name={current.name} size="md" gymIndex={0} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{current.name}</p>
              <p className="text-xs text-gray-400">{current.phone}</p>
            </div>
          </div>
        )}

        {/* Instruction */}
        <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
          WhatsApp opened for <strong>{current?.name}</strong>.<br />
          Copy the message, send it, then come back.
        </p>

        {/* Re-open WA */}
        <button
          onClick={() => current && openWA(current)}
          className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-success-dark bg-success-light hover:opacity-80 rounded-btn py-2 font-medium transition-opacity"
        >
          <ExternalLink size={14} />
          Re-open WhatsApp for {current?.name}
        </button>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSkip}
            className="btn-secondary flex items-center gap-1 flex-1 justify-center"
          >
            <SkipForward size={14} /> Skip
          </button>
          <button
            onClick={handleSent}
            className="btn-primary flex items-center gap-1 flex-1 justify-center"
          >
            Sent ✓ &amp; Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
