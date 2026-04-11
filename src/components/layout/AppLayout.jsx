import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useGyms } from '../../hooks/useGyms'

export default function AppLayout({ children, pageTitle = '', pageSubtitle = '' }) {
  useGyms()

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
