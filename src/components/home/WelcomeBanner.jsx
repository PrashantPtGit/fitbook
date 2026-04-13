import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'

const TODAY_KEY = `fitbook_banner_${new Date().toISOString().slice(0, 10)}`

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false)
  const gyms = useGymStore((s) => s.gyms)

  useEffect(() => {
    if (!localStorage.getItem(TODAY_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(TODAY_KEY, '1')
    setVisible(false)
  }

  if (!visible || !gyms.length) return null

  return (
    <div className="bg-primary-light border border-primary-mid rounded-card p-3 mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-primary-dark">
          Welcome back, Ramesh! Here&apos;s your gym summary for today.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {gyms.map((gym) => (
            <span
              key={gym.id}
              className="text-[10px] bg-white border border-primary-mid text-primary-dark px-2 py-0.5 rounded-full font-medium"
            >
              {gym.location || gym.name}
            </span>
          ))}
        </div>
      </div>
      <button onClick={dismiss} className="text-primary-mid hover:text-primary-dark mt-0.5 shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
