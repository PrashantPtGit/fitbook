import clsx from 'clsx'
import Spinner from './Spinner'

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  danger: 'btn-danger',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        variantMap[variant],
        size === 'sm' && sizeMap.sm,
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        'inline-flex items-center gap-2',
        className
      )}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
