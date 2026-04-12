import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useGymsData } from '../../hooks/useGymsData'
import { seedDatabase } from '../../data/seedData'

let seedAttempted = false

export default function AppLayout({ children, pageTitle = '', pageSubtitle = '' }) {
  useGymsData()

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
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
