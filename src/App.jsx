import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Spinner from './components/ui/Spinner'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useRole } from './hooks/useRole'
import { supabase, supabaseReady } from './lib/supabase'
import { useGymStore } from './store/useGymStore'

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
const Settings           = lazy(() => import('./pages/Settings'))
const Workouts           = lazy(() => import('./pages/Workouts'))
const CreateWorkoutPlan  = lazy(() => import('./pages/CreateWorkoutPlan'))
const NotFound           = lazy(() => import('./pages/NotFound'))

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

// ── Restores Supabase session on page refresh before any route renders.
// Without this, roleLoading stays true forever because useGymsData (which sets
// the role) lives inside AppLayout → inside Home → gated by StaffRoute itself.
function AuthInit({ children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabaseReady) {
      // No real credentials — dev mode. Set a stub role so StaffRoute lets through;
      // useGymsData inside AppLayout will overwrite with full mock setup.
      useGymStore.getState().setUserRole('main_admin', null, 'Dev User')
      setReady(true)
      return
    }

    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, gym_id, name')
          .eq('user_id', session.user.id)
          .single()

        if (roleData) {
          console.log('[AuthInit] role=%s gym_id=%s name=%s', roleData.role, roleData.gym_id, roleData.name)
          useGymStore.getState().setUserRole(roleData.role, roleData.gym_id, roleData.name)
          console.log('[AuthInit] store activeGymId after setUserRole:', useGymStore.getState().activeGymId)
        } else {
          // Session exists but not in user_roles → treat as member
          useGymStore.getState().setUserRole('member', null, session.user.email?.split('@')[0] || '')
        }
      } else {
        // No active session — mark check done so StaffRoute can redirect to /login
        useGymStore.getState().setUserRole(null, null, null)
      }

      setReady(true)
    }

    initSession()

    // Handle future auth events (sign-out from any tab, token expiry, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useGymStore.getState().resetStore()
        // resetStore leaves roleLoading: true — clear it so StaffRoute can redirect
        useGymStore.getState().setUserRole(null, null, null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!ready) return <PageLoader />
  return children
}

// ── Staff-only route: redirects to /login if not authenticated
function StaffRoute({ children }) {
  const { userRole, roleLoading } = useRole()
  if (roleLoading) return <PageLoader />
  if (!userRole) return <Navigate to="/login" replace />
  if (userRole === 'member') return <Navigate to="/member-portal" replace />
  return children
}

// ── Member-only route: checks session directly so page refreshes don't hang
function MemberRoute({ children }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus('denied')
        navigate('/login', { replace: true })
      } else {
        setStatus('allowed')
      }
    })
  }, [])

  if (status === 'checking') return <PageLoader />
  if (status === 'denied') return null
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
      <AuthInit>
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
          <Route path="/settings"             element={<StaffRoute><Settings /></StaffRoute>} />
          <Route path="/workouts"             element={<StaffRoute><Workouts /></StaffRoute>} />
          <Route path="/workouts/create"      element={<StaffRoute><CreateWorkoutPlan /></StaffRoute>} />

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
      </AuthInit>
    </ErrorBoundary>
  )
}
