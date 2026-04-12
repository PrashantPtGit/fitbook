import { Routes, Route, Navigate } from 'react-router-dom'
import { Component } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import Spinner from './components/ui/Spinner'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>App crashed — error details:</h2>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

import Login from './pages/Login'
import Home from './pages/Home'
import Members from './pages/Members'
import AddMember from './pages/AddMember'
import MemberProfile from './pages/MemberProfile'
import Fees from './pages/Fees'
import CollectFee from './pages/CollectFee'
import Attendance from './pages/Attendance'
import Messages from './pages/Messages'
import Health from './pages/Health'
import Diet from './pages/Diet'
import Reports from './pages/Reports'

// DEV MODE: auth bypassed — remove this line and uncomment the real check when Supabase is ready
function ProtectedRoute({ children }) {
  return children
}

// function ProtectedRoute({ children }) {
//   const { session, loading } = useAuth()
//   if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
//   if (!session) return <Navigate to="/login" replace />
//   return children
// }

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/members/add" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
        <Route path="/fees/collect/:id" element={<ProtectedRoute><CollectFee /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
        <Route path="/diet" element={<ProtectedRoute><Diet /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
