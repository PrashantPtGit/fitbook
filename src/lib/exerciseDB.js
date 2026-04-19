const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const BASE_URL     = 'https://exercisedb.p.rapidapi.com'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const headers = {
  'X-RapidAPI-Key':  RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

const hasKey = () => RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here'

// ExerciseDB v2 removed gifUrl from API responses.
// Construct it from the exercise id — served via their image CDN.
const buildGifUrl = (id) => `https://v2.exercisedb.io/image/${id}`

// Normalize a raw API exercise to match our app's shape (adds gifUrl)
function normalize(ex) {
  return {
    ...ex,
    gifUrl: ex.gifUrl || buildGifUrl(ex.id),
  }
}

export const getExercisesByBodyPart = async (bodyPart, limit = 10) => {
  try {
    const res = await fetch(
      SUPABASE_URL + '/functions/v1/get-exercises?bodyPart=' + encodeURIComponent(bodyPart) + '&limit=' + limit
    )
    if (!res.ok) throw new Error('API failed')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data
    return getFallbackExercises(bodyPart)
  } catch (err) {
    console.log('Using fallback exercises:', err.message)
    return getFallbackExercises(bodyPart)
  }
}

export async function getBodyParts() {
  if (!hasKey()) return [
    'chest', 'back', 'shoulders', 'upper arms', 'lower arms',
    'upper legs', 'lower legs', 'waist', 'cardio',
  ]
  try {
    const res = await fetch(`${BASE_URL}/exercises/bodyPartList`, { headers })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export const searchExercises = async (query, limit = 20) => {
  try {
    const res = await fetch(
      SUPABASE_URL + '/functions/v1/get-exercises?search=' + encodeURIComponent(query) + '&limit=' + limit
    )
    if (!res.ok) throw new Error('API failed')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data
    return getFallbackExercises('chest').filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase())
    )
  } catch (err) {
    return getFallbackExercises('chest')
  }
}

export const getProxiedGifUrl = (gifUrl) => {
  if (!gifUrl) return null
  const id = gifUrl.split('/').pop()
  return import.meta.env.VITE_SUPABASE_URL + '/functions/v1/exercise-gif?id=' + id
}

export function getYouTubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' exercise tutorial how to')}`
}

// ── Fallback exercises with YouTube thumbnail images ──────────────────────────
// YouTube thumbnails (mqdefault = 320×180, always available, CDN-hosted)
const yt = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`

const FALLBACK = {
  chest: [
    { id: 'chest1', name: 'Push Up',          bodyPart: 'chest',      equipment: 'body weight', gifUrl: yt('IODxDxX7oi4'), target: 'pectorals'   },
    { id: 'chest2', name: 'Bench Press',       bodyPart: 'chest',      equipment: 'barbell',     gifUrl: yt('gRVjAtPip0Y'), target: 'pectorals'   },
    { id: 'chest3', name: 'Dumbbell Flyes',    bodyPart: 'chest',      equipment: 'dumbbell',    gifUrl: yt('eozdVDA78K0'), target: 'pectorals'   },
    { id: 'chest4', name: 'Incline Press',     bodyPart: 'chest',      equipment: 'barbell',     gifUrl: yt('IP4oeKh1Sd4'), target: 'upper chest' },
    { id: 'chest5', name: 'Cable Crossover',   bodyPart: 'chest',      equipment: 'cable',       gifUrl: yt('taI4XduLpTk'), target: 'pectorals'   },
    { id: 'chest6', name: 'Dips',              bodyPart: 'chest',      equipment: 'body weight', gifUrl: yt('2z8JmcrW-As'), target: 'triceps'     },
  ],
  back: [
    { id: 'back1', name: 'Pull Up',            bodyPart: 'back',       equipment: 'body weight', gifUrl: yt('eGo4IYlbE5g'), target: 'lats'        },
    { id: 'back2', name: 'Bent Over Row',      bodyPart: 'back',       equipment: 'barbell',     gifUrl: yt('kBWAon7ItDw'), target: 'upper back'  },
    { id: 'back3', name: 'Lat Pulldown',       bodyPart: 'back',       equipment: 'cable',       gifUrl: yt('CAwf7n6Luuc'), target: 'lats'        },
    { id: 'back4', name: 'Seated Cable Row',   bodyPart: 'back',       equipment: 'cable',       gifUrl: yt('GZbfZ033f74'), target: 'upper back'  },
    { id: 'back5', name: 'Deadlift',           bodyPart: 'back',       equipment: 'barbell',     gifUrl: yt('op9kVnSso6Q'), target: 'lower back'  },
    { id: 'back6', name: 'Face Pull',          bodyPart: 'back',       equipment: 'cable',       gifUrl: yt('V8dZ3x_4CNE'), target: 'rear delts'  },
  ],
  shoulders: [
    { id: 'sh1', name: 'Overhead Press',       bodyPart: 'shoulders',  equipment: 'barbell',     gifUrl: yt('CnBmiBqp-AI'), target: 'delts'       },
    { id: 'sh2', name: 'Lateral Raise',        bodyPart: 'shoulders',  equipment: 'dumbbell',    gifUrl: yt('FeRxGEMDaAo'), target: 'delts'       },
    { id: 'sh3', name: 'Front Raise',          bodyPart: 'shoulders',  equipment: 'dumbbell',    gifUrl: yt('k4GJQFrPXsY'), target: 'front delts' },
    { id: 'sh4', name: 'Arnold Press',         bodyPart: 'shoulders',  equipment: 'dumbbell',    gifUrl: yt('6Z15_WdXmVw'), target: 'delts'       },
  ],
  'upper arms': [
    { id: 'arm1', name: 'Bicep Curl',          bodyPart: 'upper arms', equipment: 'dumbbell',    gifUrl: yt('ykJmrZ5v0Oo'), target: 'biceps'      },
    { id: 'arm2', name: 'Tricep Pushdown',     bodyPart: 'upper arms', equipment: 'cable',       gifUrl: yt('2-LAMcpzOgg'), target: 'triceps'     },
    { id: 'arm3', name: 'Hammer Curl',         bodyPart: 'upper arms', equipment: 'dumbbell',    gifUrl: yt('zC3nDR7hYQM'), target: 'biceps'      },
    { id: 'arm4', name: 'Skull Crushers',      bodyPart: 'upper arms', equipment: 'barbell',     gifUrl: yt('d_KZxkY_0cM'), target: 'triceps'     },
    { id: 'arm5', name: 'Preacher Curl',       bodyPart: 'upper arms', equipment: 'barbell',     gifUrl: yt('fIWP-FRFNU0'), target: 'biceps'      },
  ],
  'lower arms': [
    { id: 'larm1', name: 'Wrist Curl',         bodyPart: 'lower arms', equipment: 'dumbbell',    gifUrl: yt('oLwGMHBVN4o'), target: 'forearms'    },
    { id: 'larm2', name: 'Reverse Curl',       bodyPart: 'lower arms', equipment: 'barbell',     gifUrl: yt('vLpMlA4CQTM'), target: 'forearms'    },
  ],
  'upper legs': [
    { id: 'leg1', name: 'Barbell Squat',       bodyPart: 'upper legs', equipment: 'barbell',     gifUrl: yt('ultWZbUMPL8'), target: 'quads'       },
    { id: 'leg2', name: 'Leg Press',           bodyPart: 'upper legs', equipment: 'machine',     gifUrl: yt('IZxyjW7MPJQ'), target: 'quads'       },
    { id: 'leg3', name: 'Lunges',              bodyPart: 'upper legs', equipment: 'body weight', gifUrl: yt('L8fvypPrzzs'), target: 'quads'       },
    { id: 'leg4', name: 'Romanian Deadlift',   bodyPart: 'upper legs', equipment: 'barbell',     gifUrl: yt('JCXUYuzwNrM'), target: 'hamstrings'  },
    { id: 'leg5', name: 'Leg Curl',            bodyPart: 'upper legs', equipment: 'machine',     gifUrl: yt('ELOCsoDSmrg'), target: 'hamstrings'  },
    { id: 'leg6', name: 'Leg Extension',       bodyPart: 'upper legs', equipment: 'machine',     gifUrl: yt('YyvSfVjQeL0'), target: 'quads'       },
  ],
  'lower legs': [
    { id: 'calf1', name: 'Calf Raise',         bodyPart: 'lower legs', equipment: 'body weight', gifUrl: yt('gwLzBv3AKKc'), target: 'calves'      },
    { id: 'calf2', name: 'Seated Calf Raise',  bodyPart: 'lower legs', equipment: 'machine',     gifUrl: yt('L5Y3ndWUGVk'), target: 'calves'      },
  ],
  waist: [
    { id: 'abs1', name: 'Crunches',            bodyPart: 'waist',      equipment: 'body weight', gifUrl: yt('Xyd_fa5zoEU'), target: 'abs'         },
    { id: 'abs2', name: 'Plank',               bodyPart: 'waist',      equipment: 'body weight', gifUrl: yt('ASdvN_XEl_c'), target: 'abs'         },
    { id: 'abs3', name: 'Russian Twist',       bodyPart: 'waist',      equipment: 'body weight', gifUrl: yt('wkD8rjkodUI'), target: 'abs'         },
    { id: 'abs4', name: 'Leg Raises',          bodyPart: 'waist',      equipment: 'body weight', gifUrl: yt('l4kQd9eWclE'), target: 'lower abs'   },
    { id: 'abs5', name: 'Mountain Climbers',   bodyPart: 'waist',      equipment: 'body weight', gifUrl: yt('nmwgirgXLYM'), target: 'abs'         },
  ],
  cardio: [
    { id: 'c1', name: 'Treadmill Run',         bodyPart: 'cardio',     equipment: 'machine',     gifUrl: yt('n6cOzmVhpaY'), target: 'cardiovascular system' },
    { id: 'c2', name: 'Jumping Jacks',         bodyPart: 'cardio',     equipment: 'body weight', gifUrl: yt('UpH7rm0cFm0'), target: 'cardiovascular system' },
    { id: 'c3', name: 'Burpees',               bodyPart: 'cardio',     equipment: 'body weight', gifUrl: yt('dZgVxmf6jkA'), target: 'cardiovascular system' },
    { id: 'c4', name: 'Jump Rope',             bodyPart: 'cardio',     equipment: 'rope',        gifUrl: yt('1BZM2oKQ3vU'), target: 'cardiovascular system' },
    { id: 'c5', name: 'Box Jumps',             bodyPart: 'cardio',     equipment: 'box',         gifUrl: yt('NBY9-kTuHMs'), target: 'cardiovascular system' },
  ],
}

function getFallbackExercises(bodyPart) {
  return FALLBACK[bodyPart] || FALLBACK['chest']
}

// Debug helper — call testAPI() from browser console to verify the key works
export async function testAPI() {
  const res = await fetch(
    `${BASE_URL}/exercises/bodyPart/chest?limit=3`,
    { headers }
  )
  const data = await res.json()
  console.log('ExerciseDB test response:', data)
  console.log('gifUrl present in first result:', !!data[0]?.gifUrl)
  console.log('Constructed gifUrl:', data[0] ? buildGifUrl(data[0].id) : 'N/A')
  return data
}

export { FALLBACK as ALL_EXERCISES }
