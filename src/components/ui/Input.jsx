import clsx from 'clsx'

export default function Input({
  label,
  name,
  register,
  error,
  placeholder,
  type = 'text',
  className = '',
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="label" htmlFor={name}>
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={clsx('input', error && 'border-danger', className)}
        {...(register ? register(name) : {})}
      />
      {error && (
        <p className="text-xs text-danger mt-0.5">{error.message}</p>
      )}
    </div>
  )
}
