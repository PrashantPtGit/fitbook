import { format } from 'date-fns'
import { CheckCheck } from 'lucide-react'

function personalise(template, memberName, gymName) {
  return (template || '')
    .replace(/\[Name\]/gi, memberName || 'Member')
    .replace(/\[Gym\]/gi, gymName || 'the gym')
    .replace(/\[Plan\]/gi, 'Monthly')
    .replace(/\[amount\]/gi, '1,200')
    .replace(/\[date\]/gi, format(new Date(), 'd MMM yyyy'))
    .replace(/\[holiday\]/gi, 'public holiday')
    .replace(/\[dayCount\]/gi, '10')
}

export default function MessagePreview({ message, memberName, gymName }) {
  if (!message?.trim()) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400">Start typing to see a preview</p>
      </div>
    )
  }

  const personalised = personalise(message, memberName, gymName)
  const now          = format(new Date(), 'h:mm a')

  return (
    <div className="bg-[#e5ddd5] rounded-xl p-4">
      {/* Chat bubble */}
      <div className="flex justify-end">
        <div className="max-w-xs sm:max-w-sm">
          {/* WhatsApp-style outgoing bubble */}
          <div className="bg-[#dcf8c6] rounded-tl-xl rounded-tr-sm rounded-b-xl px-3 py-2 shadow-sm">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {personalised}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-gray-500">{now}</span>
              <CheckCheck size={14} className="text-blue-500" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            Preview for: <span className="font-medium">{memberName || 'Member'}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
