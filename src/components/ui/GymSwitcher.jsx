import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useActiveGym, useGymStore } from '../../store/useGymStore'
import { useShallow } from 'zustand/react/shallow'
import clsx from 'clsx'

const gymDotColors = ['bg-gym1', 'bg-gym2', 'bg-gym3']
const gymTextColors = ['text-gym1', 'text-gym2', 'text-gym3']

export default function GymSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { gyms, activeGymId, activeGym, setActiveGym } = useActiveGym()
  const userRole = useGymStore(useShallow((s) => s.userRole))

  // Must be above any conditional return — Rules of Hooks
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // co_owner: static locked pill, no dropdown
  if (userRole === 'co_owner') {
    const gymIndex = gyms.findIndex((g) => g.id === activeGymId)
    return (
      <div className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-btn border text-sm',
        'border-primary bg-primary-light text-primary-dark cursor-default select-none'
      )}>
        <span className={clsx('h-2 w-2 rounded-full', gymIndex >= 0 ? ['bg-gym1','bg-gym2','bg-gym3'][gymIndex % 3] : 'bg-gym1')} />
        <span className="font-medium">{activeGym?.name || 'My Gym'}</span>
      </div>
    )
  }

  const label = activeGym ? activeGym.name : 'All Gyms'
  const activeIndex = activeGymId
    ? gyms.findIndex((g) => g.id === activeGymId)
    : -1

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-btn border text-sm transition-colors',
          activeGymId
            ? 'border-primary bg-primary-light text-primary-dark'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        {activeIndex >= 0 && (
          <span className={clsx('h-2 w-2 rounded-full', gymDotColors[activeIndex % 3])} />
        )}
        <span className="font-medium">{label}</span>
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-30 w-48 bg-white border border-gray-100 rounded-card shadow-lg py-1">
          {/* All Gyms */}
          <button
            onClick={() => { setActiveGym(null); setOpen(false) }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-gray-700">All Gyms</span>
            </div>
            {!activeGymId && <Check size={14} className="text-primary" />}
          </button>

          <div className="divider" />

          {gyms.map((gym, i) => (
            <button
              key={gym.id}
              onClick={() => { setActiveGym(gym.id); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={clsx('h-2 w-2 rounded-full', gymDotColors[i % 3])} />
                <span className={clsx(activeGymId === gym.id ? gymTextColors[i % 3] + ' font-medium' : 'text-gray-700')}>
                  {gym.name}
                </span>
              </div>
              {activeGymId === gym.id && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
