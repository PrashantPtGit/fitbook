import clsx from 'clsx'

const colorMap = [
  { bg: 'bg-primary-light', text: 'text-primary-dark' },
  { bg: 'bg-success-light', text: 'text-success-dark' },
  { bg: 'bg-warning-light', text: 'text-warning-dark' },
]

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name = '', size = 'md', gymIndex = 0 }) {
  const color = colorMap[gymIndex % colorMap.length]
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-medium shrink-0',
        sizeMap[size] || sizeMap.md,
        color.bg,
        color.text
      )}
    >
      {getInitials(name)}
    </div>
  )
}
