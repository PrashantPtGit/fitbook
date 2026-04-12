import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, UserPlus } from 'lucide-react'
import MemberRow from './MemberRow'
import { SkeletonRow } from '../ui/Skeleton'

const COLS = [
  { key: 'name',    label: 'Member',  sortable: true },
  { key: 'phone',   label: 'Phone',   sortable: false },
  { key: 'plan',    label: 'Plan',    sortable: false },
  { key: 'batch',   label: 'Batch',   sortable: false },
  { key: 'joined',  label: 'Joined',  sortable: true },
  { key: 'expires', label: 'Expires', sortable: true },
  { key: 'status',  label: 'Status',  sortable: false },
  { key: 'actions', label: '',        sortable: false },
]

function SortIcon({ col, sort }) {
  if (!col.sortable) return null
  if (sort.column !== col.key) return <ChevronUp size={11} className="text-gray-300 ml-0.5 inline" />
  return sort.dir === 'asc'
    ? <ChevronUp   size={11} className="text-primary ml-0.5 inline" />
    : <ChevronDown size={11} className="text-primary ml-0.5 inline" />
}

export default function MemberTable({ members, loading, sort, onSort }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="divide-y divide-gray-50 px-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <UserPlus size={22} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600">No members found</p>
        <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
        <button
          onClick={() => navigate('/members/add')}
          className="btn-primary text-xs px-3 py-1.5 mt-1"
        >
          Add your first member
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100">
            {COLS.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort(col.key)}
                className={`px-4 py-2.5 text-xs text-gray-400 font-medium whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:text-gray-600' : ''}`}
              >
                {col.label}
                <SortIcon col={col} sort={sort} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((m, i) => (
            <MemberRow key={m.id} member={m} gymIndex={i % 3} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
