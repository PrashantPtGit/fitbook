import { useMemo } from 'react'
import clsx from 'clsx'
import { daysFromNow } from '../../utils/helpers'

export default function MemberStats({ members }) {
  const stats = useMemo(() => {
    let active = 0, expiring = 0, expired = 0
    members.forEach((m) => {
      const ms   = m.memberships?.[0]
      if (!ms) { expired++; return }
      const days = daysFromNow(ms.end_date)
      if (days < 0)      expired++
      else if (days <= 7) expiring++
      else                active++
    })
    return { total: members.length, active, expiring, expired }
  }, [members])

  const pills = [
    { label: 'Total',             value: stats.total,    cls: 'bg-gray-100 text-gray-600' },
    { label: 'Active',            value: stats.active,   cls: 'bg-primary-light text-primary-dark' },
    { label: 'Expiring this week',value: stats.expiring, cls: 'bg-warning-light text-warning-dark' },
    { label: 'Expired',           value: stats.expired,  cls: 'bg-danger-light text-danger-dark' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map(({ label, value, cls }) => (
        <span key={label} className={clsx('rounded-full px-3 py-1 text-xs font-medium', cls)}>
          {label}: <strong>{value}</strong>
        </span>
      ))}
    </div>
  )
}
