#!/usr/bin/env node
// Chakkar gym sync script — runs on gym computer every minute via cron or Task Scheduler
// Cron: * * * * * node /path/to/sync.js >> /var/log/fitbook-sync.log 2>&1

const http = require('http')

// ─── Config (edit these) ─────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://dzaqmtaxqatbwvonqycz.supabase.co'
const SUPABASE_KEY  = process.env.SUPABASE_KEY  || 'YOUR_SERVICE_ROLE_KEY'
const GYM_ID        = process.env.GYM_ID        || 'YOUR_CHAKKAR_GYM_ID'
const HIKVISION_IP  = process.env.HIKVISION_IP  || '192.168.1.100'
const HIKVISION_PORT = parseInt(process.env.HIKVISION_PORT || '80')
const HIKVISION_USER = process.env.HIKVISION_USER || 'admin'
const HIKVISION_PASS = process.env.HIKVISION_PASS || '12345'
// ─────────────────────────────────────────────────────────────────────────────

async function supabaseGet(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
  })
  return res.json()
}

async function supabasePatch(path, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.ok
}

async function supabasePost(path, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  return res.ok
}

function hikvisionRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(HIKVISION_USER + ':' + HIKVISION_PASS).toString('base64')
    const bodyStr = body ? JSON.stringify(body) : ''
    const options = {
      hostname: HIKVISION_IP,
      port: HIKVISION_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(new Error('timeout')) })
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// ─── Attendance sync ──────────────────────────────────────────────────────────
async function syncAttendance(device) {
  const startTime = device.last_event_time
    ? new Date(device.last_event_time).toISOString().replace('.000Z', '+00:00')
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '+00:00')
  const endTime = new Date().toISOString().replace('.000Z', '+00:00')

  const result = await hikvisionRequest(
    '/ISAPI/AccessControl/AcsEvent?format=json',
    'POST',
    { AcsEventCond: { searchID: '1', searchResultPosition: 0, maxResults: 100, major: 0, minor: 0, startTime, endTime } }
  )

  const data = JSON.parse(result.body)
  const events = data?.AcsEvent?.InfoList || []
  if (events.length === 0) {
    console.log('[attendance] No new events')
    return
  }

  const members = await supabaseGet(`members?gym_id=eq.${GYM_ID}&fingerprint_id=not.is.null&select=id,fingerprint_id`)
  const fpMap = {}
  members.forEach((m) => { fpMap[parseInt(m.fingerprint_id)] = m.id })

  const attendanceRecords = []
  const logRecords = []
  const seen = new Set()

  for (const event of events) {
    const machineUserId = event.employeeNoString || event.cardNo
    const punchTime = event.time
    if (!machineUserId || !punchTime) continue

    const date = punchTime.split('T')[0]
    const memberId = fpMap[parseInt(machineUserId)] || null
    const key = `${memberId}_${date}`

    logRecords.push({
      gym_id: GYM_ID,
      device_id: device.id,
      machine_user_id: parseInt(machineUserId),
      member_id: memberId,
      punch_time: punchTime,
      sync_status: memberId ? 'matched' : 'unmatched',
    })

    if (memberId && !seen.has(key)) {
      seen.add(key)
      attendanceRecords.push({
        gym_id: GYM_ID,
        member_id: memberId,
        checked_in_at: punchTime,
        date,
        source: 'fingerprint',
      })
    }
  }

  if (logRecords.length > 0) await supabasePost('fingerprint_logs', logRecords)
  if (attendanceRecords.length > 0) {
    await fetch(SUPABASE_URL + '/rest/v1/attendance', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(attendanceRecords),
    })
  }

  await supabasePatch(`fingerprint_devices?id=eq.${device.id}`, {
    last_synced_at: new Date().toISOString(),
    last_event_time: events[events.length - 1]?.time,
  })

  console.log(`[attendance] Synced ${attendanceRecords.length} records from ${events.length} events`)
}

// ─── Command processing ───────────────────────────────────────────────────────
async function processCommands() {
  const commands = await supabaseGet(
    `hikvision_commands?status=eq.pending&gym_id=eq.${GYM_ID}&order=created_at.asc`
  )

  if (!Array.isArray(commands) || commands.length === 0) {
    console.log('[commands] No pending commands')
    return
  }

  for (const cmd of commands) {
    try {
      const { employeeNo, endDate, enable } = cmd.payload
      const startDate = new Date().toISOString().split('T')[0]

      const result = await hikvisionRequest(
        '/ISAPI/AccessControl/UserInfo/Modify?format=json',
        'PUT',
        {
          UserInfo: {
            employeeNo: String(employeeNo),
            Valid: {
              enable: enable,
              startTime: startDate + ' 00:00:00',
              endTime: (endDate || '2026-12-31') + ' 23:59:59',
            },
          },
        }
      )

      if (result.status >= 200 && result.status < 300) {
        await supabasePatch(`hikvision_commands?id=eq.${cmd.id}`, {
          status: 'done',
          executed_at: new Date().toISOString(),
        })
        console.log(`[commands] Done: ${cmd.command_type} for employee ${employeeNo}`)
      } else {
        throw new Error(`Device returned HTTP ${result.status}: ${result.body}`)
      }
    } catch (err) {
      await supabasePatch(`hikvision_commands?id=eq.${cmd.id}`, {
        status: 'failed',
        error_message: err.message,
      })
      console.error(`[commands] Failed: ${err.message}`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Starting sync`)

  try {
    const devices = await supabaseGet(
      `fingerprint_devices?gym_id=eq.${GYM_ID}&is_active=eq.true&limit=1`
    )
    const device = Array.isArray(devices) ? devices[0] : null

    if (device) {
      await syncAttendance(device)
    } else {
      console.log('[attendance] No active device for this gym')
    }
  } catch (err) {
    console.error('[attendance] Error:', err.message)
  }

  try {
    await processCommands()
  } catch (err) {
    console.error('[commands] Error:', err.message)
  }

  console.log(`[${new Date().toISOString()}] Sync complete`)
}

main()
