import { format } from 'date-fns'
import AppLayout          from '../components/layout/AppLayout'
import WelcomeBanner      from '../components/home/WelcomeBanner'
import SingleGymDashboard from '../components/home/SingleGymDashboard'
import AllGymsDashboard   from '../components/home/AllGymsDashboard'
import { useActiveGym }   from '../store/useGymStore'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { activeGymId, activeGym } = useActiveGym()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')

  return (
    <AppLayout
      pageTitle={activeGym ? activeGym.name : 'All Gyms Overview'}
      pageSubtitle={today}
    >
      <WelcomeBanner />
      <p className="text-sm text-gray-500 mb-4">{getGreeting()}, Ramesh 👋</p>

      {activeGymId
        ? <SingleGymDashboard gymId={activeGymId} gymName={activeGym?.name || ''} />
        : <AllGymsDashboard />
      }
    </AppLayout>
  )
}
