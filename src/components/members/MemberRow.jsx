import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { getMembershipStatus, formatDateShort, daysFromNow } from '../../utils/helpers'

function formatPhone(phone = '') {
  const d = phone.replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : phone
}

export default function MemberRow({ member, gymIndex = 0 }) {
  const navigate   = useNavigate()
  const ms         = member.memberships?.[0]
  const st         = ms
    ? getMembershipStatus(ms.end_date)
    : { status: 'unknown', label: '—', badgeVariant: 'gray' }
  const needsCollect = ['expired', 'critical', 'warning'].includes(st.status)
  const expiresRed   = ms && daysFromNow(ms.end_date) <= 7

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/members/${member.id}`)}
    >
      {/* Member */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="sm" gymIndex={gymIndex} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
            <p className="text-xs text-gray-400">{member.member_code || '—'}</p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatPhone(member.phone)}
      </td>

      {/* Plan */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {ms?.plans?.name || '—'}
      </td>

      {/* Batch */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {member.batch_timing || '—'}
      </td>

      {/* Joined */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDateShort(member.created_at)}
      </td>

      {/* Expires */}
      <td className={`px-4 py-3 text-sm whitespace-nowrap font-medium ${expiresRed ? 'text-danger' : 'text-gray-600'}`}>
        {formatDateShort(ms?.end_date)}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={st.badgeVariant}>{st.label}</Badge>
      </td>

      {/* Actions */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/members/${member.id}`)}
            className="text-xs text-primary hover:text-primary-dark font-medium"
          >
            View
          </button>
          {needsCollect && (
            <button
              onClick={() => navigate(`/fees/collect/${member.id}`)}
              className="text-xs text-danger hover:opacity-80 font-medium"
            >
              Collect
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
