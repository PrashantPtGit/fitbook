import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { format } from 'date-fns'
import { Download, MapPin } from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'

export default function QRDisplay() {
  const activeGym   = useGymStore((s) => s.activeGym)
  const activeGymId = useGymStore((s) => s.activeGymId)
  const containerRef = useRef(null)

  const today    = format(new Date(), 'yyyy-MM-dd')
  const qrValue  = `FITBOOK-CHECKIN-${activeGymId}-${today}`
  const dateLabel = format(new Date(), 'd MMMM yyyy')

  function handleDownload() {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a   = document.createElement('a')
    a.href     = url
    a.download = `fitbook-qr-${activeGym?.name?.replace(/\s+/g, '-') || 'gym'}-${today}.png`
    a.click()
  }

  return (
    <div className="card flex flex-col items-center gap-4 h-full">
      {/* Title */}
      <div className="text-center w-full">
        <h3 className="text-sm font-semibold text-gray-800">Gym entry QR code</h3>
        <p className="text-xs text-gray-400 mt-0.5">Members scan this at the entrance</p>
      </div>

      {/* QR code */}
      <div
        ref={containerRef}
        className="p-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm"
      >
        {/* Mobile: 200px, desktop: 160px via wrapper sizing */}
        <QRCodeCanvas
          value={qrValue || 'FITBOOK-CHECKIN'}
          size={160}
          bgColor="#ffffff"
          fgColor="#534AB7"
          level="M"
          className="block md:hidden"
          style={{ width: 200, height: 200 }}
        />
        <QRCodeCanvas
          value={qrValue || 'FITBOOK-CHECKIN'}
          size={160}
          bgColor="#ffffff"
          fgColor="#534AB7"
          level="M"
          className="hidden md:block"
        />
      </div>

      {/* Gym info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{activeGym?.name || 'Gym'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{dateLabel}</p>
        <p className="text-xs text-gray-300 mt-1">Valid for today only</p>
      </div>

      {/* Location pill */}
      {activeGym?.location && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-light rounded-full">
          <MapPin size={11} className="text-primary" />
          <span className="text-xs text-primary-dark font-medium">{activeGym.location}</span>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="btn-secondary flex items-center gap-2 w-full justify-center mt-auto"
      >
        <Download size={14} />
        Download QR
      </button>
    </div>
  )
}
