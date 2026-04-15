import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Spinner from './components/ui/Spinner'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Lazy-loaded pages — reduces initial bundle size
const Login        = lazy(() => import('./pages/Login'))
const Home         = lazy(() => import('./pages/Home'))
const Members      = lazy(() => import('./pages/Members'))
const AddMember    = lazy(() => import('./pages/AddMember'))
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
const Fees         = lazy(() => import('./pages/Fees'))
const CollectFee   = lazy(() => import('./pages/CollectFee'))
const Attendance   = lazy(() => import('./pages/Attendance'))
const Messages     = lazy(() => import('./pages/Messages'))
const Health       = lazy(() => import('./pages/Health'))
const Diet         = lazy(() => import('./pages/Diet'))
const Reports      = lazy(() => import('./pages/Reports'))
const Settings     = lazy(() => import('./pages/Settings'))
const NotFound     = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spinner size="lg" />
  </div>
)

// DEV MODE: auth bypassed — swap to real ProtectedRoute when Supabase auth is ready
function ProtectedRoute({ children }) {
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
          <Route path="/login" element={<Login />} />

          <Route path="/"           element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/members"    element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/members/add" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
          <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/fees"        element={<ProtectedRoute><Fees /></ProtectedRoute>} />
          <Route path="/fees/collect/:id" element={<ProtectedRoute><CollectFee /></ProtectedRoute>} />
          <Route path="/attendance"  element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/messages"    element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/health"      element={<ProtectedRoute><Health /></ProtectedRoute>} />
          <Route path="/diet"        element={<ProtectedRoute><Diet /></ProtectedRoute>} />
          <Route path="/reports"     element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/404"         element={<NotFound />} />
          <Route path="*"            element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
