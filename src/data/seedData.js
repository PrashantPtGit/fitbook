import { supabase, supabaseReady } from '../lib/supabase'
import { generateMemberCode } from '../utils/helpers'
import { addDays, subDays, format } from 'date-fns'

function dateStr(d) { return format(d, 'yyyy-MM-dd') }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

const TRAINERS = {
  gym1: [
    { name: 'Suresh Negi',   specialisation: 'Strength & Conditioning' },
    { name: 'Reena Devi',    specialisation: 'Yoga & Zumba'            },
  ],
  gym2: [
    { name: 'Amit Thakur',   specialisation: 'Cardio & Weight Loss'    },
    { name: 'Priti Sharma',  specialisation: 'Aerobics'                },
  ],
  gym3: [
    { name: 'Rakesh Kumar',  specialisation: 'Bodybuilding'            },
    { name: 'Seema Rana',    specialisation: 'Flexibility & Core'      },
  ],
}

const MEMBER_TEMPLATES = [
  // GYM INDEX 0 (MLC Mall)
  { gymIdx: 0, name: 'Arjun Kapoor',  phone: '9876543210', gender: 'male',   batch: '6-8 AM',  planName: 'Monthly',     daysAgo: 25  },
  { gymIdx: 0, name: 'Priya Sharma',  phone: '9765432109', gender: 'female', batch: '7-9 AM',  planName: 'Quarterly',   daysAgo: 60  },
  { gymIdx: 0, name: 'Mohit Verma',   phone: '9654321098', gender: 'male',   batch: '5-7 PM',  planName: 'Half-Yearly', daysAgo: 120 },
  { gymIdx: 0, name: 'Neha Gupta',    phone: '9543210987', gender: 'female', batch: '6-8 AM',  planName: 'Yearly',      daysAgo: 200 },
  { gymIdx: 0, name: 'Ravi Joshi',    phone: '9432109876', gender: 'male',   batch: '7-9 PM',  planName: 'Monthly',     daysAgo: 28  },
  { gymIdx: 0, name: 'Sunita Rawat',  phone: '9321098765', gender: 'female', batch: '6-8 AM',  planName: 'Monthly',     daysAgo: 15  },
  { gymIdx: 0, name: 'Vikram Thakur', phone: '9210987654', gender: 'male',   batch: '5-7 PM',  planName: 'Quarterly',   daysAgo: 45  },
  // GYM INDEX 1 (New Shimla)
  { gymIdx: 1, name: 'Anjali Mehta',  phone: '9109876543', gender: 'female', batch: '6-8 AM',  planName: 'Monthly',     daysAgo: 10  },
  { gymIdx: 1, name: 'Deepak Singh',  phone: '9098765432', gender: 'male',   batch: '7-9 PM',  planName: 'Quarterly',   daysAgo: 55  },
  { gymIdx: 1, name: 'Kavita Rana',   phone: '8987654321', gender: 'female', batch: '5-7 PM',  planName: 'Monthly',     daysAgo: 20  },
  { gymIdx: 1, name: 'Suresh Kumar',  phone: '8876543210', gender: 'male',   batch: '6-8 AM',  planName: 'Half-Yearly', daysAgo: 100 },
  { gymIdx: 1, name: 'Pooja Negi',    phone: '8765432109', gender: 'female', batch: '7-9 AM',  planName: 'Monthly',     daysAgo: 5   },
  { gymIdx: 1, name: 'Amit Chauhan',  phone: '8654321098', gender: 'male',   batch: '5-7 PM',  planName: 'Quarterly',   daysAgo: 80  },
  // GYM INDEX 2 (Location 3)
  { gymIdx: 2, name: 'Rekha Sharma',  phone: '8543210987', gender: 'female', batch: '6-8 AM',  planName: 'Monthly',     daysAgo: 12  },
  { gymIdx: 2, name: 'Naresh Bisht',  phone: '8432109876', gender: 'male',   batch: '7-9 PM',  planName: 'Yearly',      daysAgo: 180 },
  { gymIdx: 2, name: 'Meena Thakur',  phone: '8321098765', gender: 'female', batch: '5-7 PM',  planName: 'Quarterly',   daysAgo: 70  },
  { gymIdx: 2, name: 'Rohit Kashyap', phone: '8210987654', gender: 'male',   batch: '6-8 AM',  planName: 'Monthly',     daysAgo: 8   },
  { gymIdx: 2, name: 'Geeta Verma',   phone: '8109876543', gender: 'female', batch: '7-9 AM',  planName: 'Half-Yearly', daysAgo: 90  },
]

export async function seedDatabase() {
  if (!supabaseReady) return

  // Skip if members already exist
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })

  if (count > 0) {
    console.log('seedDatabase: members already exist, skipping.')
    return
  }

  console.log('seedDatabase: seeding fresh data…')

  // Fetch gyms
  const { data: gyms, error: gymErr } = await supabase
    .from('gyms').select('*').order('created_at')
  if (gymErr || !gyms?.length) { console.error('seedDatabase: no gyms found', gymErr); return }

  // Insert trainers and collect their IDs
  const trainerIdsByGymIdx = {}
  for (let i = 0; i < gyms.length && i < 3; i++) {
    const key  = `gym${i + 1}`
    const tpls = TRAINERS[key] || []
    const rows = tpls.map((t) => ({ ...t, gym_id: gyms[i].id }))
    const { data: inserted } = await supabase.from('trainers').insert(rows).select('id')
    trainerIdsByGymIdx[i] = (inserted || []).map((t) => t.id)
  }

  // Fetch plans for each gym
  const plansByGymIdx = {}
  for (let i = 0; i < gyms.length && i < 3; i++) {
    const { data: plans } = await supabase
      .from('plans').select('*').eq('gym_id', gyms[i].id)
    plansByGymIdx[i] = plans || []
  }

  // Seed members
  let gymMemberCount = [0, 0, 0]

  for (let mi = 0; mi < MEMBER_TEMPLATES.length; mi++) {
    const tmpl   = MEMBER_TEMPLATES[mi]
    const gymIdx = tmpl.gymIdx
    const gym    = gyms[gymIdx]
    if (!gym) continue

    const gymPlans = plansByGymIdx[gymIdx] || []
    const plan = gymPlans.find(
      (p) => p.name.toLowerCase().replace(/[\s-]/g, '') === tmpl.planName.toLowerCase().replace(/[\s-]/g, '')
    ) || gymPlans[0]
    if (!plan) { console.warn(`No plan found for ${tmpl.planName} in ${gym.name}`); continue }

    const startDate = subDays(new Date(), tmpl.daysAgo)
    const endDate   = addDays(startDate, plan.duration_days)
    const isExpired = endDate < new Date()
    const status    = isExpired ? 'expired' : 'active'

    const trainerIds = trainerIdsByGymIdx[gymIdx] || []
    const trainer_id = trainerIds.length ? trainerIds[mi % trainerIds.length] : null

    // Insert member
    const { data: member, error: mErr } = await supabase
      .from('members')
      .insert({
        gym_id: gym.id, name: tmpl.name, phone: tmpl.phone,
        whatsapp: tmpl.phone, gender: tmpl.gender,
        batch_timing: tmpl.batch, trainer_id, status,
      })
      .select().single()

    if (mErr) { console.error('seed member error', mErr); continue }

    // Member code
    gymMemberCount[gymIdx]++
    const member_code = generateMemberCode(gym.name, gymMemberCount[gymIdx] - 1)
    await supabase.from('members').update({ member_code }).eq('id', member.id)

    // Membership
    const { data: membership } = await supabase
      .from('memberships')
      .insert({
        member_id: member.id, gym_id: gym.id, plan_id: plan.id,
        start_date: dateStr(startDate), end_date: dateStr(endDate), status,
      })
      .select().single()

    // Payment
    const payMode = mi % 2 === 0 ? 'cash' : 'upi'
    await supabase.from('payments').insert({
      member_id: member.id, gym_id: gym.id, plan_id: plan.id,
      amount: plan.price, payment_mode: payMode,
      payment_date: dateStr(startDate),
      membership_id: membership?.id,
    })

    // Attendance (3–7 days in the last 20 days for active members)
    if (!isExpired) {
      const attendanceCount = rand(3, 7)
      const usedDays = new Set()
      for (let a = 0; a < attendanceCount; a++) {
        let attempt = 0
        while (attempt < 20) {
          const daysBack = rand(0, 19)
          if (!usedDays.has(daysBack)) {
            usedDays.add(daysBack)
            const d = dateStr(subDays(new Date(), daysBack))
            await supabase.from('attendance').insert({
              member_id: member.id, gym_id: gym.id, date: d,
              checked_in_at: new Date(new Date().setDate(new Date().getDate() - daysBack)).toISOString(),
            })
            break
          }
          attempt++
        }
      }
    }
  }

  console.log('seedDatabase: done ✓')
}
