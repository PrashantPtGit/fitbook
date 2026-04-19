import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

function YtIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
    </svg>
  )
}
import { getYouTubeSearchUrl, getProxiedGifUrl } from '../../lib/exerciseDB'

const MUSCLE_COLORS = {
  chest:        { bg: '#FEE2E2', text: '#991B1B' },
  back:         { bg: '#DBEAFE', text: '#1E40AF' },
  shoulders:    { bg: '#FEF3C7', text: '#92400E' },
  'upper arms': { bg: '#EDE9FE', text: '#5B21B6' },
  'lower arms': { bg: '#F3E8FF', text: '#6B21A8' },
  'upper legs': { bg: '#D1FAE5', text: '#065F46' },
  'lower legs': { bg: '#DCFCE7', text: '#14532D' },
  waist:        { bg: '#FFF7ED', text: '#92400E' },
  cardio:       { bg: '#FCE7F3', text: '#831843' },
}

const EQUIP_ICONS = {
  'body weight': '🤸',
  barbell:       '🏋️',
  dumbbell:      '💪',
  cable:         '🔗',
  machine:       '⚙️',
  rope:          '🪢',
  default:       '🏅',
}

export default function ExerciseCard({
  exercise,
  onAdd,
  onRemove,
  showAddButton = true,
  sets,
  reps,
  rest,
  compact = false,
}) {
  const proxiedGifUrl = getProxiedGifUrl(exercise.gifUrl)
  const [imgError, setImgError]   = useState(!proxiedGifUrl)
  const [expanded, setExpanded]   = useState(false)

  const muscle  = (exercise.bodyPart || '').toLowerCase()
  const colors  = MUSCLE_COLORS[muscle] || { bg: '#F3F4F6', text: '#374151' }
  const equip   = exercise.equipment?.toLowerCase() || ''
  const equipIcon = EQUIP_ICONS[equip] || EQUIP_ICONS.default

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
        {/* Tiny GIF / placeholder */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
          {!imgError ? (
            <img
              src={proxiedGifUrl}
              alt={exercise.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-lg">{equipIcon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{exercise.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: colors.bg, color: colors.text }}>
              {muscle}
            </span>
            {sets && reps && (
              <span className="text-[10px] text-gray-500">{sets} × {reps}</span>
            )}
            {rest > 0 && (
              <span className="text-[10px] text-gray-400">{rest}s rest</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={getYouTubeSearchUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            title="Watch on YouTube"
          >
            <YtIcon size={12} />
          </a>
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
              <Trash2 size={12} className="text-red-400" />
            </button>
          )}
          {showAddButton && onAdd && (
            <button onClick={onAdd} className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <Plus size={14} className="text-green-600" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
      {/* GIF area */}
      <div className="relative w-full bg-gray-50" style={{ paddingTop: '66%' }}>
        {!imgError ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
            <span className="text-3xl">{equipIcon}</span>
            <p className="text-xs text-gray-400 text-center px-2">{exercise.name}</p>
          </div>
        )}
        {/* Body part badge overlay */}
        <span
          className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm"
          style={{ background: colors.bg, color: colors.text }}
        >
          {muscle}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold text-gray-800 leading-tight">{exercise.name}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
            {equipIcon} {exercise.equipment || 'equipment'}
          </span>
          {exercise.target && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              🎯 {exercise.target}
            </span>
          )}
        </div>

        {sets && reps && (
          <p className="text-xs font-medium text-gray-600">
            {sets} sets × {reps} {rest ? `· ${rest}s rest` : ''}
          </p>
        )}

        {/* Expand/collapse for notes */}
        {exercise.notes && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Notes
          </button>
        )}
        {expanded && exercise.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{exercise.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <a
            href={getYouTubeSearchUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <YtIcon size={10} /> YouTube
          </a>
          {onRemove && (
            <button
              onClick={onRemove}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-auto"
            >
              <Trash2 size={10} /> Remove
            </button>
          )}
          {showAddButton && onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-white transition-colors ml-auto"
              style={{ background: '#1D9E75' }}
            >
              <Plus size={10} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
