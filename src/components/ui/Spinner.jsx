export default function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sz} animate-spin rounded-full border-2 border-primary-light border-t-primary`}
      />
    </div>
  )
}
