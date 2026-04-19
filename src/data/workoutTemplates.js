export const WORKOUT_TEMPLATES = [
  {
    id: 'beginner-full-body',
    name: 'Beginner Full Body',
    goal: 'General Fitness',
    level: 'beginner',
    daysPerWeek: 3,
    description: 'Perfect for newcomers. Full body workout 3x/week with rest days in between.',
    days: [
      {
        dayName: 'Day 1 — Full Body A',
        exercises: [
          { bodyPart: 'upper legs', name: 'Barbell Squat',   sets: 3, reps: '10-12', rest: 90  },
          { bodyPart: 'chest',      name: 'Push Up',          sets: 3, reps: '10-15', rest: 60  },
          { bodyPart: 'back',       name: 'Bent Over Row',    sets: 3, reps: '10-12', rest: 90  },
          { bodyPart: 'shoulders',  name: 'Overhead Press',   sets: 3, reps: '10-12', rest: 60  },
          { bodyPart: 'upper arms', name: 'Bicep Curl',       sets: 2, reps: '12-15', rest: 60  },
          { bodyPart: 'waist',      name: 'Plank',            sets: 3, reps: '30 sec', rest: 45 },
        ],
      },
      {
        dayName: 'Day 2 — Full Body B',
        exercises: [
          { bodyPart: 'upper legs', name: 'Lunges',           sets: 3, reps: '10 each', rest: 90 },
          { bodyPart: 'chest',      name: 'Bench Press',      sets: 3, reps: '10-12',   rest: 90 },
          { bodyPart: 'back',       name: 'Lat Pulldown',     sets: 3, reps: '10-12',   rest: 90 },
          { bodyPart: 'shoulders',  name: 'Lateral Raise',    sets: 3, reps: '12-15',   rest: 45 },
          { bodyPart: 'upper arms', name: 'Tricep Pushdown',  sets: 2, reps: '12-15',   rest: 60 },
          { bodyPart: 'waist',      name: 'Crunches',         sets: 3, reps: '15-20',   rest: 45 },
        ],
      },
      {
        dayName: 'Day 3 — Full Body C',
        exercises: [
          { bodyPart: 'upper legs', name: 'Leg Press',        sets: 3, reps: '12-15', rest: 90  },
          { bodyPart: 'chest',      name: 'Dumbbell Flyes',   sets: 3, reps: '12-15', rest: 60  },
          { bodyPart: 'back',       name: 'Pull Up',          sets: 3, reps: '6-10',  rest: 90  },
          { bodyPart: 'shoulders',  name: 'Arnold Press',     sets: 3, reps: '10-12', rest: 60  },
          { bodyPart: 'upper arms', name: 'Hammer Curl',      sets: 2, reps: '12-15', rest: 60  },
          { bodyPart: 'waist',      name: 'Mountain Climbers',sets: 3, reps: '30 sec',rest: 45  },
        ],
      },
    ],
  },

  {
    id: 'intermediate-ppl',
    name: 'Push Pull Legs',
    goal: 'Muscle Gain',
    level: 'intermediate',
    daysPerWeek: 3,
    description: 'Classic PPL split. Each muscle group trained once per week with focused sessions.',
    days: [
      {
        dayName: 'Day 1 — Push (Chest, Shoulders, Triceps)',
        exercises: [
          { bodyPart: 'chest',      name: 'Bench Press',      sets: 4, reps: '8-10',  rest: 90 },
          { bodyPart: 'chest',      name: 'Incline Press',    sets: 3, reps: '10-12', rest: 90 },
          { bodyPart: 'shoulders',  name: 'Overhead Press',   sets: 3, reps: '8-10',  rest: 90 },
          { bodyPart: 'shoulders',  name: 'Lateral Raise',    sets: 3, reps: '12-15', rest: 45 },
          { bodyPart: 'upper arms', name: 'Tricep Pushdown',  sets: 3, reps: '12-15', rest: 60 },
          { bodyPart: 'chest',      name: 'Dips',             sets: 3, reps: '8-12',  rest: 60 },
        ],
      },
      {
        dayName: 'Day 2 — Pull (Back, Biceps)',
        exercises: [
          { bodyPart: 'back',       name: 'Pull Up',          sets: 4, reps: '6-10',  rest: 90 },
          { bodyPart: 'back',       name: 'Bent Over Row',    sets: 4, reps: '8-10',  rest: 90 },
          { bodyPart: 'back',       name: 'Lat Pulldown',     sets: 3, reps: '10-12', rest: 90 },
          { bodyPart: 'back',       name: 'Face Pull',        sets: 3, reps: '15-20', rest: 45 },
          { bodyPart: 'upper arms', name: 'Bicep Curl',       sets: 3, reps: '10-12', rest: 60 },
          { bodyPart: 'upper arms', name: 'Hammer Curl',      sets: 3, reps: '12-15', rest: 60 },
        ],
      },
      {
        dayName: 'Day 3 — Legs',
        exercises: [
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 4, reps: '8-10',    rest: 120 },
          { bodyPart: 'upper legs', name: 'Leg Press',        sets: 3, reps: '12-15',   rest: 90  },
          { bodyPart: 'upper legs', name: 'Romanian Deadlift',sets: 3, reps: '10-12',   rest: 90  },
          { bodyPart: 'upper legs', name: 'Leg Curl',         sets: 3, reps: '12-15',   rest: 60  },
          { bodyPart: 'lower legs', name: 'Calf Raise',       sets: 4, reps: '15-20',   rest: 45  },
          { bodyPart: 'waist',      name: 'Plank',            sets: 3, reps: '45 sec',  rest: 45  },
        ],
      },
    ],
  },

  {
    id: 'weight-loss-circuit',
    name: 'Weight Loss Circuit',
    goal: 'Weight Loss',
    level: 'beginner',
    daysPerWeek: 4,
    description: 'High-intensity circuits with short rest. Burns maximum calories in minimum time.',
    days: [
      {
        dayName: 'Day 1 — Upper Body Circuit',
        exercises: [
          { bodyPart: 'cardio',     name: 'Jumping Jacks',    sets: 3, reps: '30 sec', rest: 30 },
          { bodyPart: 'chest',      name: 'Push Up',          sets: 3, reps: '15-20',  rest: 30 },
          { bodyPart: 'back',       name: 'Bent Over Row',    sets: 3, reps: '15',      rest: 30 },
          { bodyPart: 'shoulders',  name: 'Overhead Press',   sets: 3, reps: '15',      rest: 30 },
          { bodyPart: 'cardio',     name: 'Burpees',          sets: 3, reps: '10',      rest: 30 },
          { bodyPart: 'waist',      name: 'Mountain Climbers',sets: 3, reps: '30 sec',  rest: 30 },
        ],
      },
      {
        dayName: 'Day 2 — Lower Body Circuit',
        exercises: [
          { bodyPart: 'cardio',     name: 'Jump Rope',        sets: 3, reps: '60 sec', rest: 30 },
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 3, reps: '15-20',  rest: 30 },
          { bodyPart: 'upper legs', name: 'Lunges',           sets: 3, reps: '15 each',rest: 30 },
          { bodyPart: 'upper legs', name: 'Leg Press',        sets: 3, reps: '20',      rest: 30 },
          { bodyPart: 'lower legs', name: 'Calf Raise',       sets: 3, reps: '25',      rest: 30 },
          { bodyPart: 'cardio',     name: 'Box Jumps',        sets: 3, reps: '10',      rest: 30 },
        ],
      },
      {
        dayName: 'Day 3 — Full Body HIIT',
        exercises: [
          { bodyPart: 'cardio',     name: 'Burpees',          sets: 4, reps: '10',      rest: 30 },
          { bodyPart: 'chest',      name: 'Push Up',          sets: 3, reps: '20',      rest: 30 },
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 3, reps: '20',      rest: 30 },
          { bodyPart: 'waist',      name: 'Russian Twist',    sets: 3, reps: '20 each', rest: 30 },
          { bodyPart: 'cardio',     name: 'Jumping Jacks',    sets: 3, reps: '45 sec',  rest: 30 },
          { bodyPart: 'waist',      name: 'Plank',            sets: 3, reps: '45 sec',  rest: 30 },
        ],
      },
      {
        dayName: 'Day 4 — Cardio Blast',
        exercises: [
          { bodyPart: 'cardio',     name: 'Treadmill Run',    sets: 1, reps: '20 min',  rest: 0  },
          { bodyPart: 'cardio',     name: 'Jump Rope',        sets: 5, reps: '60 sec',  rest: 30 },
          { bodyPart: 'cardio',     name: 'Box Jumps',        sets: 4, reps: '12',       rest: 30 },
          { bodyPart: 'waist',      name: 'Mountain Climbers',sets: 4, reps: '30 sec',  rest: 30 },
          { bodyPart: 'waist',      name: 'Leg Raises',       sets: 3, reps: '15-20',   rest: 30 },
          { bodyPart: 'waist',      name: 'Crunches',         sets: 3, reps: '25',       rest: 30 },
        ],
      },
    ],
  },

  {
    id: 'muscle-gain-split',
    name: 'Muscle Gain 4-Day Split',
    goal: 'Muscle Gain',
    level: 'intermediate',
    daysPerWeek: 4,
    description: 'Hypertrophy-focused split. Higher volume, progressive overload for maximum muscle growth.',
    days: [
      {
        dayName: 'Day 1 — Chest & Triceps',
        exercises: [
          { bodyPart: 'chest',      name: 'Bench Press',      sets: 4, reps: '8-10',  rest: 90 },
          { bodyPart: 'chest',      name: 'Incline Press',    sets: 3, reps: '10-12', rest: 90 },
          { bodyPart: 'chest',      name: 'Cable Crossover',  sets: 3, reps: '12-15', rest: 60 },
          { bodyPart: 'chest',      name: 'Dips',             sets: 3, reps: '10-12', rest: 60 },
          { bodyPart: 'upper arms', name: 'Tricep Pushdown',  sets: 3, reps: '12-15', rest: 60 },
          { bodyPart: 'upper arms', name: 'Skull Crushers',   sets: 3, reps: '10-12', rest: 60 },
        ],
      },
      {
        dayName: 'Day 2 — Back & Biceps',
        exercises: [
          { bodyPart: 'back',       name: 'Pull Up',          sets: 4, reps: '6-10',  rest: 90 },
          { bodyPart: 'back',       name: 'Bent Over Row',    sets: 4, reps: '8-10',  rest: 90 },
          { bodyPart: 'back',       name: 'Lat Pulldown',     sets: 3, reps: '10-12', rest: 90 },
          { bodyPart: 'back',       name: 'Seated Cable Row', sets: 3, reps: '10-12', rest: 60 },
          { bodyPart: 'upper arms', name: 'Bicep Curl',       sets: 3, reps: '10-12', rest: 60 },
          { bodyPart: 'upper arms', name: 'Preacher Curl',    sets: 3, reps: '10-12', rest: 60 },
        ],
      },
      {
        dayName: 'Day 3 — Legs',
        exercises: [
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 4, reps: '8-10',  rest: 120 },
          { bodyPart: 'upper legs', name: 'Leg Press',        sets: 4, reps: '12-15', rest: 90  },
          { bodyPart: 'upper legs', name: 'Romanian Deadlift',sets: 3, reps: '10-12', rest: 90  },
          { bodyPart: 'upper legs', name: 'Leg Curl',         sets: 3, reps: '12-15', rest: 60  },
          { bodyPart: 'upper legs', name: 'Leg Extension',    sets: 3, reps: '15',     rest: 60  },
          { bodyPart: 'lower legs', name: 'Calf Raise',       sets: 4, reps: '20',     rest: 45  },
        ],
      },
      {
        dayName: 'Day 4 — Shoulders & Abs',
        exercises: [
          { bodyPart: 'shoulders',  name: 'Overhead Press',   sets: 4, reps: '8-10',  rest: 90 },
          { bodyPart: 'shoulders',  name: 'Lateral Raise',    sets: 4, reps: '12-15', rest: 45 },
          { bodyPart: 'shoulders',  name: 'Front Raise',      sets: 3, reps: '12-15', rest: 45 },
          { bodyPart: 'back',       name: 'Face Pull',        sets: 3, reps: '15-20', rest: 45 },
          { bodyPart: 'waist',      name: 'Plank',            sets: 3, reps: '60 sec',rest: 45 },
          { bodyPart: 'waist',      name: 'Crunches',         sets: 4, reps: '20',     rest: 30 },
        ],
      },
    ],
  },

  {
    id: 'home-no-equipment',
    name: 'Home Workout (No Equipment)',
    goal: 'General Fitness',
    level: 'beginner',
    daysPerWeek: 3,
    description: 'Zero equipment needed. Train anywhere, anytime with body weight only.',
    days: [
      {
        dayName: 'Day 1 — Upper Body',
        exercises: [
          { bodyPart: 'chest',      name: 'Push Up',          sets: 4, reps: '15-20', rest: 60 },
          { bodyPart: 'back',       name: 'Pull Up',          sets: 3, reps: '6-10',  rest: 60 },
          { bodyPart: 'chest',      name: 'Dips',             sets: 3, reps: '10-15', rest: 60 },
          { bodyPart: 'upper arms', name: 'Bicep Curl',       sets: 3, reps: '15',     rest: 45 },
          { bodyPart: 'waist',      name: 'Plank',            sets: 3, reps: '45 sec',rest: 30 },
          { bodyPart: 'waist',      name: 'Mountain Climbers',sets: 3, reps: '30 sec',rest: 30 },
        ],
      },
      {
        dayName: 'Day 2 — Lower Body',
        exercises: [
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 4, reps: '20',     rest: 60 },
          { bodyPart: 'upper legs', name: 'Lunges',           sets: 3, reps: '15 each',rest: 60 },
          { bodyPart: 'upper legs', name: 'Leg Extension',    sets: 3, reps: '15',     rest: 45 },
          { bodyPart: 'lower legs', name: 'Calf Raise',       sets: 3, reps: '25',     rest: 30 },
          { bodyPart: 'waist',      name: 'Leg Raises',       sets: 3, reps: '15',     rest: 30 },
          { bodyPart: 'cardio',     name: 'Burpees',          sets: 3, reps: '10',     rest: 45 },
        ],
      },
      {
        dayName: 'Day 3 — Full Body',
        exercises: [
          { bodyPart: 'cardio',     name: 'Jumping Jacks',    sets: 3, reps: '30 sec', rest: 30 },
          { bodyPart: 'chest',      name: 'Push Up',          sets: 3, reps: '15',     rest: 30 },
          { bodyPart: 'upper legs', name: 'Barbell Squat',    sets: 3, reps: '20',     rest: 30 },
          { bodyPart: 'back',       name: 'Pull Up',          sets: 3, reps: '8',      rest: 30 },
          { bodyPart: 'waist',      name: 'Russian Twist',    sets: 3, reps: '20 each',rest: 30 },
          { bodyPart: 'cardio',     name: 'Burpees',          sets: 3, reps: '8',      rest: 30 },
        ],
      },
    ],
  },
]

export const GOALS = [
  { value: 'Weight Loss',     emoji: '🔥', color: '#A32D2D' },
  { value: 'Muscle Gain',     emoji: '💪', color: '#1D9E75' },
  { value: 'Strength',        emoji: '🏋️', color: '#4F46E5' },
  { value: 'Endurance',       emoji: '🏃', color: '#0891B2' },
  { value: 'General Fitness', emoji: '⚡', color: '#D97706' },
]

export const LEVELS = [
  { value: 'beginner',     label: 'Beginner',     color: '#1D9E75' },
  { value: 'intermediate', label: 'Intermediate', color: '#D97706' },
  { value: 'advanced',     label: 'Advanced',     color: '#A32D2D' },
]

export const BODY_PARTS = [
  { key: 'chest',       label: 'Chest',      emoji: '🫀' },
  { key: 'back',        label: 'Back',       emoji: '🔙' },
  { key: 'shoulders',   label: 'Shoulders',  emoji: '🙆' },
  { key: 'upper arms',  label: 'Arms',       emoji: '💪' },
  { key: 'upper legs',  label: 'Legs',       emoji: '🦵' },
  { key: 'waist',       label: 'Abs',        emoji: '⭕' },
  { key: 'cardio',      label: 'Cardio',     emoji: '❤️' },
]
