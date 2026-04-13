import clsx from 'clsx'

// Gradient backgrounds per gym — matches design spec
const GYM_GRADIENTS = [
  'linear-gradient(135deg, #534AB7 0%, #7B6FF0 100%)',  // Gym 1 — purple
  'linear-gradient(135deg, #1D9E75 0%, #4ECDC4 100%)',  // Gym 2 — teal
  'linear-gradient(135deg, #BA7517 0%, #EF9F27 100%)',  // Gym 3 — amber
]

const SIZE_MAP = {
  xs: { cls: 'h-6 w-6',   font: '9px'  },
  sm: { cls: 'h-8 w-8',   font: '11px' },
  md: { cls: 'h-10 w-10', font: '14px' },
  lg: { cls: 'h-14 w-14', font: '20px' },
  xl: { cls: 'h-20 w-20', font: '28px' },
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return (parts[0][0] + (parts[0][1] || parts[0][0])).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name = '', size = 'md', gymIndex = 0, online = false }) {
  const { cls, font } = SIZE_MAP[size] || SIZE_MAP.md
  const gradient = GYM_GRADIENTS[gymIndex % GYM_GRADIENTS.length]

  return (
    <div className="relative shrink-0">
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-semibold text-white select-none',
          cls,
        )}
        style={{
          background: gradient,
          fontSize: font,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          letterSpacing: '0.02em',
        }}
      >
        {getInitials(name)}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-white animate-badge-pulse" />
      )}
    </div>
  )
}
