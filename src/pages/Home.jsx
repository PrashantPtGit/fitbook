import { format } from 'date-fns'
import AppLayout          from '../components/layout/AppLayout'
import WelcomeBanner      from '../components/home/WelcomeBanner'
import SingleGymDashboard from '../components/home/SingleGymDashboard'
import AllGymsDashboard   from '../components/home/AllGymsDashboard'
import { useActiveGym }   from '../store/useGymStore'
import { useRole }        from '../hooks/useRole'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { activeGymId, activeGym } = useActiveGym()
  const { userName } = useRole()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const firstName = userName ? userName.split(' ')[0] : 'there'

  return (
    <AppLayout
      pageTitle={activeGym ? activeGym.name : 'All Gyms Overview'}
      pageSubtitle={today}
    >
      {/* Hero greeting */}
      <div className="mb-5">
        <WelcomeBanner />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p
            className="text-lg font-semibold text-ink"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {getGreeting()}, {firstName} 👋
          </p>
          <p className="text-sm text-ink-muted">{today}</p>
        </div>
      </div>

      {activeGymId
        ? <SingleGymDashboard gymId={activeGymId} gymName={activeGym?.name || ''} />
        : <AllGymsDashboard />
      }
    </AppLayout>
  )
}
