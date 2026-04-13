import { useState, useEffect, useMemo } from 'react'
import { X, Search, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../ui/Avatar'
import { SkeletonRow } from '../ui/Skeleton'
import { supabase, supabaseReady } from '../../lib/supabase'
import { useGymStore } from '../../store/useGymStore'
import { markAttendance } from '../../hooks/useAttendance'

export default function ManualCheckin({ onClose, todayAttendance }) {
  const activeGymId = useGymStore((s) => s.activeGymId)

  const [members,  setMembers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [checking, setChecking] = useState(null)   // memberId currently being submitted

  // Load active members for this gym
  useEffect(() => {
    if (!supabaseReady || !activeGymId) return
    supabase
      .from('members')
      .select('id, name, member_code, phone, memberships(end_date, plans(name))')
      .eq('gym_id', activeGymId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setMembers(data || [])
        setLoading(false)
      })
  }, [activeGymId])

  const checkedInIds = useMemo(
    () => new Set(todayAttendance.map((a) => a.member_id)),
    [todayAttendance]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? members.filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.member_code?.toLowerCase().includes(q)
        )
      : members
  }, [members, search])

  async function handleCheckin(member) {
    if (checkedInIds.has(member.id) || checking) return
    setChecking(member.id)
    const { error } = await markAttendance(member.id, activeGymId)
    setChecking(null)

    if (error === 'Already checked in today') {
      toast(`${member.name} already checked in today`, { icon: '⚠️' })
    } else if (error) {
      toast.error('Failed to check in. Try again.')
    } else {
      toast.success(`${member.name} checked in ✓`)
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal — bottom sheet on mobile, centred card on desktop */}
      <div
        className={[
          'fixed z-50 bg-white flex flex-col',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-2xl max-h-[88vh]',
          // Desktop: centred modal
          'md:bottom-auto md:left-1/2 md:top-1/2',
          'md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-md md:rounded-xl md:max-h-[80vh]',
        ].join(' ')}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-800">Manual check-in</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-btn text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by name or ID..."
              className="input pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No members found</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((m, i) => {
                const alreadyIn  = checkedInIds.has(m.id)
                const isChecking = checking === m.id

                return (
                  <div
                    key={m.id}
                    onClick={() => !alreadyIn && !isChecking && handleCheckin(m)}
                    className={[
                      'flex items-center gap-3 py-2.5 rounded-btn px-1 transition-colors',
                      alreadyIn
                        ? 'opacity-60 cursor-not-allowed'
                        : isChecking
                          ? 'opacity-60 cursor-wait'
                          : 'cursor-pointer hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <Avatar name={m.name} size="sm" gymIndex={i % 3} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.member_code}</p>
                    </div>

                    {alreadyIn ? (
                      <div className="flex items-center gap-1 text-success-dark">
                        <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                        <span className="text-xs font-medium">Checked in</span>
                      </div>
                    ) : isChecking ? (
                      <span className="text-xs text-gray-400">Checking in…</span>
                    ) : (
                      <span className="text-xs text-primary font-medium">Check in →</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-4 py-2.5 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            {filtered.length} member{filtered.length !== 1 ? 's' : ''} shown
            · {checkedInIds.size} already checked in
          </p>
        </div>
      </div>
    </>
  )
}
