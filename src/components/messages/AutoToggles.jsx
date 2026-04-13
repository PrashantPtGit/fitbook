import { useState } from 'react'
import { Edit2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { MSG_KEYS } from '../../hooks/useSettings'

const TOGGLES = [
  {
    key:     MSG_KEYS.renewal7d,
    title:   'Fee due reminder — 7 days before',
    preview: 'Hi [Name]! Your [Plan] membership at [Gym] expires in 7 days. Please renew to continue your fitness journey. Amount: ₹[amount].',
    countKey: 'expiring7d',
    countLabel: (n) => `${n} member${n !== 1 ? 's' : ''} expiring this week`,
  },
  {
    key:     MSG_KEYS.renewal1d,
    title:   'Fee due reminder — day before expiry',
    preview: 'Hi [Name]! Your membership expires TOMORROW. Renew now for ₹[amount] to keep your streak going.',
    countKey: 'expiring1d',
    countLabel: (n) => `${n} member${n !== 1 ? 's' : ''} expiring tomorrow`,
  },
  {
    key:     MSG_KEYS.welcome,
    title:   'Welcome message on joining',
    preview: '🏋️ Welcome to [Gym], [Name]! Your [Plan] plan starts today. See you at the gym! 💪',
    countKey: null,
    countLabel: () => 'Sends automatically when a new member is added',
  },
  {
    key:     MSG_KEYS.birthday,
    title:   'Birthday wish',
    preview: '🎂 Happy Birthday, [Name]! Wishing you strength and health from all of us at [Gym].',
    countKey: 'birthdays',
    countLabel: (n) => n > 0 ? `${n} member${n !== 1 ? 's have' : ' has'} birthday today` : 'No birthdays today',
  },
  {
    key:     MSG_KEYS.inactive,
    title:   'Re-engagement nudge (after 10 days inactive)',
    preview: 'Hey [Name], we miss you at [Gym]! It has been 10 days since your last visit. Come back strong 💪',
    countKey: 'inactive',
    countLabel: (n) => `${n} member${n !== 1 ? 's' : ''} inactive 10+ days`,
  },
]

function Toggle({ on, onChange, saving }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={saving}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none',
        on ? 'bg-success' : 'bg-gray-200',
        saving ? 'opacity-60 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
      aria-checked={on}
      role="switch"
    >
      <span
        className={[
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200',
          on ? 'translate-x-5' : 'translate-x-1',
        ].join(' ')}
        style={{ width: 18, height: 18 }}
      />
    </button>
  )
}

export default function AutoToggles({ settings, onToggle, counts = {} }) {
  const [saving, setSaving] = useState(null)  // key currently saving

  async function handleToggle(key, currentValue) {
    setSaving(key)
    await onToggle(key, !currentValue)
    setSaving(null)
    toast.success(`${!currentValue ? 'Enabled' : 'Disabled'} — saved`)
  }

  return (
    <div className="divide-y divide-gray-50">
      {TOGGLES.map((t) => {
        const isOn   = settings[t.key] !== false   // default ON
        const isSave = saving === t.key
        const count  = t.countKey != null ? (counts[t.countKey] ?? 0) : null

        return (
          <div
            key={t.key}
            className={[
              'flex items-start gap-4 py-4 px-1 rounded-btn transition-colors',
              isOn ? 'bg-success-light/30' : '',
            ].join(' ')}
          >
            {/* Toggle */}
            <div className="pt-0.5 shrink-0">
              {isSave ? (
                <Loader2 size={20} className="text-gray-400 animate-spin mt-0.5" />
              ) : (
                <Toggle on={isOn} onChange={() => handleToggle(t.key, isOn)} saving={isSave} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isOn ? 'text-gray-800' : 'text-gray-400'}`}>
                {t.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{t.preview}</p>
              <p className={`text-xs mt-1 font-medium ${isOn ? 'text-success-dark' : 'text-gray-400'}`}>
                {count !== null ? t.countLabel(count) : t.countLabel(0)}
              </p>
            </div>

            {/* Edit button */}
            <button
              className="shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors pt-0.5"
              onClick={() => toast('Template editor coming soon')}
            >
              <Edit2 size={12} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
