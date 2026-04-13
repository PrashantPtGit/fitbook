import { useState } from 'react'
import { format } from 'date-fns'
import { UserCheck } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import QRDisplay       from '../components/attendance/QRDisplay'
import TodayStats      from '../components/attendance/TodayStats'
import WeeklyGrid      from '../components/attendance/WeeklyGrid'
import TodayList       from '../components/attendance/TodayList'
import ManualCheckin   from '../components/attendance/ManualCheckin'
import DeviceStatus    from '../components/attendance/DeviceStatus'
import { useAttendance } from '../hooks/useAttendance'

export default function Attendance() {
  const { todayAttendance, weeklyData, loading, isConnected } = useAttendance()
  const [showManual, setShowManual] = useState(false)

  const today    = format(new Date(), 'EEEE, d MMMM')
  const subtitle = `${todayAttendance.length} checked in today · ${today}`

  return (
    <AppLayout pageTitle="Attendance" pageSubtitle={subtitle}>

      {/* Page-level header row */}
      <div className="flex items-center justify-between mb-5">
        {/* Real-time indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
              isConnected ? 'bg-success animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live updates' : 'Connecting…'}
          </span>
        </div>

        {/* Manual check-in button */}
        <button
          onClick={() => setShowManual(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserCheck size={15} />
          + Manual check-in
        </button>
      </div>

      {/* ── Top section: QR (1/3) + Stats (2/3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-1">
          <QRDisplay />
        </div>
        <div className="md:col-span-2">
          <TodayStats todayAttendance={todayAttendance} loading={loading} />
        </div>
      </div>

      {/* ── Bottom section: Weekly grid (2/3) + Today list (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <WeeklyGrid weeklyData={weeklyData} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <TodayList
            todayAttendance={todayAttendance}
            loading={loading}
            isConnected={isConnected}
          />
        </div>
      </div>

      {/* ── Device status ── */}
      <DeviceStatus />

      {/* ── Manual check-in modal ── */}
      {showManual && (
        <ManualCheckin
          onClose={() => setShowManual(false)}
          todayAttendance={todayAttendance}
        />
      )}
    </AppLayout>
  )
}
