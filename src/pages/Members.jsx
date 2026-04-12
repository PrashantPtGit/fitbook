import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import MemberTable from '../components/members/MemberTable'
import MemberStats from '../components/members/MemberStats'
import { useMembersHook } from '../hooks/useMembers'
import { exportMembersCSV, daysFromNow } from '../utils/helpers'

const PAGE_SIZE = 10

export default function Members() {
  const navigate               = useNavigate()
  const { members, loading }   = useMembersHook()

  const [search,       setSearch]       = useState('')
  const [planFilter,   setPlanFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [batchFilter,  setBatchFilter]  = useState('all')
  const [sort,         setSort]         = useState({ column: 'joined', dir: 'desc' })
  const [page,         setPage]         = useState(0)

  // Unique values for filter dropdowns
  const planOptions = useMemo(() =>
    [...new Set(members.map((m) => m.memberships?.[0]?.plans?.name).filter(Boolean))].sort()
  , [members])

  const batchOptions = useMemo(() =>
    [...new Set(members.map((m) => m.batch_timing).filter(Boolean))].sort()
  , [members])

  // Client-side filter + search + sort
  const filtered = useMemo(() => {
    let list = [...members]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((m) =>
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.member_code?.toLowerCase().includes(q)
      )
    }

    if (planFilter !== 'all') {
      list = list.filter((m) => m.memberships?.[0]?.plans?.name === planFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter((m) => {
        const ms   = m.memberships?.[0]
        const days = ms ? daysFromNow(ms.end_date) : -1
        if (statusFilter === 'active')   return days > 7
        if (statusFilter === 'expiring') return days >= 0 && days <= 7
        if (statusFilter === 'expired')  return days < 0
        return true
      })
    }

    if (batchFilter !== 'all') {
      list = list.filter((m) => m.batch_timing === batchFilter)
    }

    list.sort((a, b) => {
      const asc = sort.dir === 'asc' ? 1 : -1
      if (sort.column === 'name') {
        return asc * (a.name || '').localeCompare(b.name || '')
      }
      if (sort.column === 'joined') {
        return asc * ((a.created_at || '') > (b.created_at || '') ? 1 : -1)
      }
      if (sort.column === 'expires') {
        const ae = a.memberships?.[0]?.end_date || ''
        const be = b.memberships?.[0]?.end_date || ''
        return asc * (ae > be ? 1 : -1)
      }
      return 0
    })

    return list
  }, [members, search, planFilter, statusFilter, batchFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSort(column) {
    setSort((s) => ({ column, dir: s.column === column && s.dir === 'asc' ? 'desc' : 'asc' }))
    setPage(0)
  }

  function resetPage() { setPage(0) }

  return (
    <AppLayout pageTitle="My Members" pageSubtitle={`${members.length} members across all batches`}>

      {/* Top row: stats + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <MemberStats members={members} />
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => exportMembersCSV(members)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={14} />
            Export list
          </button>
          <button
            onClick={() => navigate('/members/add')}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={14} />
            Add member
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              placeholder="Search by name, phone or member ID..."
              className="input pl-8"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); resetPage() }}
            className="input w-auto"
          >
            <option value="all">All Plans</option>
            {planOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage() }}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); resetPage() }}
            className="input w-auto"
          >
            <option value="all">All Batches</option>
            {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          <span className="text-xs text-gray-400 ml-auto">
            Showing {paginated.length} of {filtered.length} members
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <MemberTable
          members={paginated}
          loading={loading}
          sort={sort}
          onSort={handleSort}
        />

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
