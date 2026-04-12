import MetricCards    from './MetricCards'
import ExpiryList     from './ExpiryList'
import RevenueChart   from './RevenueChart'
import AlertsPanel    from './AlertsPanel'
import PeakHoursChart from './PeakHoursChart'
import QuickActions   from './QuickActions'

export default function SingleGymDashboard({ gymId, gymName }) {
  return (
    <div className="space-y-4">
      {/* Row 1: 4 metric cards */}
      <MetricCards />

      {/* Row 2: left 3/5 + right 2/5 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <ExpiryList />
          <RevenueChart />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <AlertsPanel />
          <PeakHoursChart />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
