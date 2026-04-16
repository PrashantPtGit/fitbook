import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Spinner from './components/ui/Spinner'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useRole } from './hooks/useRole'

// ── Staff pages ───────────────────────────────────────────────────────────────
const Login         = lazy(() => import('./pages/Login'))
const Home          = lazy(() => import('./pages/Home'))
const Members       = lazy(() => import('./pages/Members'))
const AddMember     = lazy(() => import('./pages/AddMember'))
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
const Fees          = lazy(() => import('./pages/Fees'))
const CollectFee    = lazy(() => import('./pages/CollectFee'))
const Attendance    = lazy(() => import('./pages/Attendance'))
const Messages      = lazy(() => import('./pages/Messages'))
const Health        = lazy(() => import('./pages/Health'))
const Diet          = lazy(() => import('./pages/Diet'))
const Reports       = lazy(() => import('./pages/Reports'))
const Settings      = lazy(() => import('./pages/Settings'))
const NotFound      = lazy(() => import('./pages/NotFound'))

// ── Member portal pages ───────────────────────────────────────────────────────
const MemberHome       = lazy(() => import('./pages/member-portal/MemberHome'))
const MemberProfileMP  = lazy(() => import('./pages/member-portal/MemberProfile'))
const MemberAttendance = lazy(() => import('./pages/member-portal/MemberAttendance'))
const MemberPayments   = lazy(() => import('./pages/member-portal/MemberPayments'))
const MemberHealth     = lazy(() => import('./pages/member-portal/MemberHealth'))
const MemberMore       = lazy(() => import('./pages/member-portal/MemberMore'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spinner size="lg" />
  </div>
)

// ── Staff-only route: members/co-owners only, redirect members to /member-portal
function StaffRoute({ children }) {
  const { userRole, roleLoading } = useRole()
  if (roleLoading) return <PageLoader />
  if (userRole === 'member') return <Navigate to="/member-portal" replace />
  if (userRole === 'main_admin' || userRole === 'co_owner') return children
  // No role yet (supabase not ready / dev mode) — allow through
  return children
}

// ── Member-only route: members only, redirect staff to /
function MemberRoute({ children }) {
  const { userRole, roleLoading } = useRole()
  if (roleLoading) return <PageLoader />
  if (userRole === 'main_admin' || userRole === 'co_owner') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: { duration: 3000 },
          error:   { duration: 5000 },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* ── Staff dashboard ── */}
          <Route path="/"                    element={<StaffRoute><Home /></StaffRoute>} />
          <Route path="/members"             element={<StaffRoute><Members /></StaffRoute>} />
          <Route path="/members/add"         element={<StaffRoute><AddMember /></StaffRoute>} />
          <Route path="/members/:id"         element={<StaffRoute><MemberProfile /></StaffRoute>} />
          <Route path="/fees"                element={<StaffRoute><Fees /></StaffRoute>} />
          <Route path="/fees/collect/:id"    element={<StaffRoute><CollectFee /></StaffRoute>} />
          <Route path="/attendance"          element={<StaffRoute><Attendance /></StaffRoute>} />
          <Route path="/messages"            element={<StaffRoute><Messages /></StaffRoute>} />
          <Route path="/health"              element={<StaffRoute><Health /></StaffRoute>} />
          <Route path="/diet"                element={<StaffRoute><Diet /></StaffRoute>} />
          <Route path="/reports"             element={<StaffRoute><Reports /></StaffRoute>} />
          <Route path="/settings"            element={<StaffRoute><Settings /></StaffRoute>} />

          {/* ── Member portal ── */}
          <Route path="/member-portal"            element={<MemberRoute><MemberHome /></MemberRoute>} />
          <Route path="/member-portal/profile"    element={<MemberRoute><MemberProfileMP /></MemberRoute>} />
          <Route path="/member-portal/attendance" element={<MemberRoute><MemberAttendance /></MemberRoute>} />
          <Route path="/member-portal/payments"   element={<MemberRoute><MemberPayments /></MemberRoute>} />
          <Route path="/member-portal/health"     element={<MemberRoute><MemberHealth /></MemberRoute>} />
          <Route path="/member-portal/more"       element={<MemberRoute><MemberMore /></MemberRoute>} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*"    element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
