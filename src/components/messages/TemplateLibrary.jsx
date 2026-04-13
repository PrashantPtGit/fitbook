import { Copy } from 'lucide-react'

const TEMPLATES = [
  {
    id:      'holiday',
    title:   'Gym closed notice',
    preview: '[Gym] will be closed on [date] for [holiday]. We will reopen the next day. Thank you for your understanding. - FitBook Team',
    tag:     'Announcement',
    tagCls:  'bg-blue-50 text-blue-700',
    border:  'hover:border-blue-300',
  },
  {
    id:      'new-batch',
    title:   'New batch announcement',
    preview: 'We are starting a new batch from [date]! Limited spots available. Reply to book your slot. 🏋️ - [Gym]',
    tag:     'Announcement',
    tagCls:  'bg-primary-light text-primary-dark',
    border:  'hover:border-primary',
  },
  {
    id:      'offer',
    title:   'Membership offer',
    preview: 'Special offer at [Gym]! Quarterly plan at just ₹2,500 (original ₹3,600). Valid this month only. Limited spots! Contact us now. - FitBook',
    tag:     'Offer',
    tagCls:  'bg-success-light text-success-dark',
    border:  'hover:border-success',
  },
  {
    id:      'motivational',
    title:   'Motivational Monday',
    preview: 'Happy Monday, [Name]! 💪 Remember: every rep counts. Every day you show up is a win. See you at the gym today! - [Gym]',
    tag:     'Engagement',
    tagCls:  'bg-warning-light text-warning-dark',
    border:  'hover:border-warning',
  },
  {
    id:      'fee-reminder',
    title:   'Custom fee reminder',
    preview: 'Hi [Name], your membership fees are due. Please renew at the earliest to continue your fitness journey at [Gym]. - FitBook',
    tag:     'Reminder',
    tagCls:  'bg-danger-light text-danger-dark',
    border:  'hover:border-danger',
  },
]

export default function TemplateLibrary({ onSelectTemplate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TEMPLATES.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelectTemplate(t.preview)}
          className={[
            'relative group card cursor-pointer border-2 border-transparent transition-all duration-150',
            'hover:-translate-y-0.5 hover:shadow-md',
            t.border,
          ].join(' ')}
        >
          {/* Tag badge */}
          <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.tagCls}`}>
            {t.tag}
          </span>

          <p className="text-sm font-semibold text-gray-800 pr-16 mb-2">{t.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{t.preview}</p>

          {/* Use template button — appears on hover */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <Copy size={11} />
            Use this template
          </div>
        </div>
      ))}
    </div>
  )
}
