import clsx from 'clsx'

const MODES = [
  {
    value:   'upi',
    label:   'UPI',
    icon:    '📱',
    subtext: 'GPay / PhonePe',
  },
  {
    value:   'cash',
    label:   'Cash',
    icon:    '💵',
    subtext: 'Physical cash',
  },
  {
    value:   'online',
    label:   'Transfer',
    icon:    '🏦',
    subtext: 'NEFT / IMPS',
  },
]

export default function PaymentModeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {MODES.map((mode) => {
        const selected = value === mode.value
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={clsx(
              'flex flex-col items-center gap-1.5 py-4 px-3 rounded-card border-2 transition-all focus:outline-none',
              selected
                ? 'border-primary bg-primary-light shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-300'
            )}
          >
            <span className="text-2xl">{mode.icon}</span>
            <span className={clsx('text-sm font-semibold', selected ? 'text-primary' : 'text-gray-700')}>
              {mode.label}
            </span>
            <span className="text-xs text-gray-400">{mode.subtext}</span>
          </button>
        )
      })}
    </div>
  )
}
