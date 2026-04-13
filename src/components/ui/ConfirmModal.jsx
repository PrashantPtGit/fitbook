import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmText = 'Confirm',
  danger      = false,
}) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onCancel} />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex gap-4 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? 'bg-danger-light' : 'bg-warning-light'
          }`}>
            <AlertTriangle size={18} className={danger ? 'text-danger' : 'text-warning'} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-btn text-sm font-medium text-white transition-colors cursor-pointer ${
              danger ? 'bg-danger hover:bg-danger-dark' : 'bg-warning hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  )
}
