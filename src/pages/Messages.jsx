import { useState, useEffect, useRef, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Send } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import AutoToggles    from '../components/messages/AutoToggles'
import BroadcastForm  from '../components/messages/BroadcastForm'
import TemplateLibrary from '../components/messages/TemplateLibrary'
import MessageHistory  from '../components/messages/MessageHistory'
import { useSettings, MSG_KEYS } from '../hooks/useSettings'
import { useGymStore }  from '../store/useGymStore'
import { supabase, supabaseReady } from '../lib/supabase'
import { todayISO }     from '../utils/helpers'

function SectionCard({ id, title, subtitle, children }) {
  return (
    <div id={id} className="card mb-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Messages() {
  const activeGymId = useGymStore((s) => s.activeGymId)
  const activeGym   = useGymStore((s) => s.activeGym)
  const { settings, loading: settingsLoading, updateSetting } = useSettings()

  const broadcastRef = useRef(null)

  // ── Counts for toggle labels ───────────────────────────────────────────────
  const [counts, setCounts] = useState({
    expiring7d: 0,
    expiring1d: 0,
    birthdays:  0,
    inactive:   0,
  })

  useEffect(() => {
    if (!supabaseReady || !activeGymId) return

    async function loadCounts() {
      const today    = todayISO()
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      const in7      = new Date(); in7.setDate(in7.getDate() + 7)
      const in7str   = in7.toISOString().split('T')[0]
      const cutoff   = new Date(); cutoff.setDate(cutoff.getDate() - 10)
      const cutoffStr = cutoff.toISOString().split('T')[0]
      const todayMD  = format(new Date(), 'MM-dd')

      const [exp7, exp1, recentAtt, allActive] = await Promise.all([
        supabase.from('memberships').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId).eq('status', 'active')
          .gte('end_date', today).lte('end_date', in7str),
        supabase.from('memberships').select('*', { count: 'exact', head: true })
          .eq('gym_id', activeGymId).eq('status', 'active')
          .eq('end_date', tomorrowStr),
        supabase.from('attendance').select('member_id').eq('gym_id', activeGymId).gte('date', cutoffStr),
        supabase.from('members').select('id, date_of_birth').eq('gym_id', activeGymId).eq('status', 'active'),
      ])

      const recentIds = new Set((recentAtt.data || []).map((r) => r.member_id))
      const inactive  = (allActive.data || []).filter((m) => !recentIds.has(m.id)).length
      const birthdays = (allActive.data || []).filter((m) => {
        if (!m.date_of_birth) return false
        try { return format(parseISO(m.date_of_birth), 'MM-dd') === todayMD }
        catch { return false }
      }).length

      setCounts({
        expiring7d: exp7.count || 0,
        expiring1d: exp1.count || 0,
        birthdays,
        inactive,
      })
    }

    loadCounts()
  }, [activeGymId])

  function scrollToBroadcast() {
    document.getElementById('broadcast-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleTemplateSelect(text) {
    scrollToBroadcast()
    setTimeout(() => broadcastRef.current?.setMessage(text), 350)
  }

  return (
    <AppLayout
      pageTitle="Auto Messages"
      pageSubtitle="Set once — runs automatically on WhatsApp"
    >
      {/* Top action */}
      <div className="flex justify-end mb-5">
        <button
          onClick={scrollToBroadcast}
          className="btn-primary flex items-center gap-2"
        >
          <Send size={15} />
          + Send broadcast
        </button>
      </div>

      {/* ── Section 1: Auto triggers ── */}
      <SectionCard
        id="auto-section"
        title="Automatic triggers"
        subtitle="These messages send themselves — zero effort from you"
      >
        {settingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-11 h-6 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-48 animate-pulse" />
                  <div className="h-2.5 bg-gray-100 rounded w-64 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AutoToggles
            settings={settings}
            onToggle={updateSetting}
            counts={counts}
          />
        )}
      </SectionCard>

      {/* ── Section 2: Broadcast ── */}
      <SectionCard
        id="broadcast-section"
        title="Send broadcast message"
        subtitle="Send to a group of members right now"
      >
        <BroadcastForm
          ref={broadcastRef}
          gymId={activeGymId}
          gymName={activeGym?.name || 'the gym'}
        />
      </SectionCard>

      {/* ── Section 3: Templates ── */}
      <SectionCard
        id="templates-section"
        title="Ready-made templates"
        subtitle="Click any template to copy it into the broadcast form"
      >
        <TemplateLibrary onSelectTemplate={handleTemplateSelect} />
      </SectionCard>

      {/* ── Section 4: History ── */}
      <SectionCard
        id="history-section"
        title="Recent messages sent"
        subtitle="Last 20 messages logged"
      >
        <MessageHistory />
      </SectionCard>
    </AppLayout>
  )
}
