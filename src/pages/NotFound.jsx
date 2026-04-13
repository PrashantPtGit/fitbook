import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-8xl font-bold text-primary-light leading-none mb-1">404</p>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h1>
      <p className="text-sm text-gray-400 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2">
        <Home size={15} />
        Go to dashboard
      </button>
    </div>
  )
}
