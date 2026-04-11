import clsx from 'clsx'

const variantMap = {
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  purple: 'badge-purple',
  gray: 'badge-gray',
}

export default function Badge({ variant = 'gray', children }) {
  return (
    <span className={clsx(variantMap[variant] || variantMap.gray)}>
      {children}
    </span>
  )
}
