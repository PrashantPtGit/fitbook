import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  )

  const results = []

  try {
    const { data: devices, error: devicesError } = await supabase
      .from('fingerprint_devices')
      .select('*')
      .eq('is_active', true)

    if (devicesError) throw devicesError

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active devices found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const device of devices) {
      try {
        const deviceIp = device.device_ip || device.ip_address
        const devicePort = device.device_port || device.port || 80
        const username = device.username || 'admin'
        const password = device.password || '12345'
        const gymId = device.gym_id
        const deviceId = device.id

        const baseUrl = `http://${deviceIp}:${devicePort}`
        const auth = btoa(`${username}:${password}`)

        const startTime = device.last_event_time
          ? new Date(device.last_event_time).toISOString().replace('.000Z', '+00:00')
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '+00:00')

        const endTime = new Date().toISOString().replace('.000Z', '+00:00')

        const searchBody = JSON.stringify({
          AcsEventCond: {
            searchID: '1',
            searchResultPosition: 0,
            maxResults: 100,
            major: 0,
            minor: 0,
            startTime: startTime,
            endTime: endTime
          }
        })

        const response = await fetch(
          `${baseUrl}/ISAPI/AccessControl/AcsEvent?format=json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${auth}`
            },
            body: searchBody,
            signal: AbortSignal.timeout(10000)
          }
        )

        if (!response.ok) {
          results.push({ device: device.device_name, error: `Device returned ${response.status}` })
          continue
        }

        const data = await response.json()
        const events = data?.AcsEvent?.InfoList || []

        if (events.length === 0) {
          await supabase
            .from('fingerprint_devices')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', deviceId)
          results.push({ device: device.device_name, synced: 0, message: 'No new events' })
          continue
        }

        const { data: members } = await supabase
          .from('members')
          .select('id, name, fingerprint_id')
          .eq('gym_id', gymId)
          .not('fingerprint_id', 'is', null)

        const fingerprintMap: Record<number, string> = {}
        members?.forEach((m: any) => {
          fingerprintMap[parseInt(m.fingerprint_id)] = m.id
        })

        let savedCount = 0
        const attendanceRecords = []
        const logRecords = []
        const seen = new Set()

        for (const event of events) {
          const machineUserId = event.employeeNoString || event.cardNo
          const punchTime = event.time
          if (!machineUserId || !punchTime) continue

          const date = punchTime.split('T')[0]
          const memberId = fingerprintMap[parseInt(machineUserId)] || null
          const key = `${memberId}_${date}`

          logRecords.push({
            gym_id: gymId,
            device_id: deviceId,
            machine_user_id: parseInt(machineUserId),
            member_id: memberId,
            punch_time: punchTime,
            sync_status: memberId ? 'matched' : 'unmatched'
          })

          if (memberId && !seen.has(key)) {
            seen.add(key)
            attendanceRecords.push({
              gym_id: gymId,
              member_id: memberId,
              checked_in_at: punchTime,
              date: date,
              source: 'fingerprint'
            })
            savedCount++
          }
        }

        if (logRecords.length > 0) {
          await supabase.from('fingerprint_logs').insert(logRecords)
        }

        if (attendanceRecords.length > 0) {
          await supabase
            .from('attendance')
            .upsert(attendanceRecords, { onConflict: 'gym_id,member_id,date' })
        }

        await supabase
          .from('fingerprint_devices')
          .update({
            last_synced_at: new Date().toISOString(),
            last_event_time: events[events.length - 1]?.time
          })
          .eq('id', deviceId)

        results.push({ device: device.device_name, synced: savedCount, total_events: events.length })

      } catch (err) {
        results.push({ device: device.device_name, error: err.message })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
