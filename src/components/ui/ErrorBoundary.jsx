import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
