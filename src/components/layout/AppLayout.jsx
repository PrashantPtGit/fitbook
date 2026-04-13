import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar        from './Sidebar'
import Topbar         from './Topbar'
import BottomNav      from './BottomNav'
import Spinner        from '../ui/Spinner'
import ErrorBoundary  from '../ui/ErrorBoundary'
import { useGymsData }  from '../../hooks/useGymsData'
import { seedDatabase } from '../../data/seedData'

let seedAttempted = false

export default function AppLayout({ children, pageTitle = '', pageSubtitle = '' }) {
  const { loading } = useGymsData()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!seedAttempted) {
      seedAttempted = true
      seedDatabase().catch(console.error)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar pageTitle={pageTitle} pageSubtitle={pageSubtitle} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 pb-20 md:pb-5">
          <ErrorBoundary>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
              </div>
            ) : (
              <div key={pathname} className="page-enter">
                {children}
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
