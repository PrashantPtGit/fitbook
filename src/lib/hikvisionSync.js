export const syncMemberToHikvision = async (supabase, memberId, gymId, action, endDate) => {
  const { data: devices } = await supabase
    .from('fingerprint_devices')
    .select('*')
    .eq('gym_id', gymId)
    .eq('is_active', true)
    .limit(1)

  const device = devices?.[0]

  if (!device) return { error: 'No device found for this gym' }

  const { data: member } = await supabase
    .from('members')
    .select('fingerprint_id, name')
    .eq('id', memberId)
    .single()

  if (!member?.fingerprint_id) return { error: 'Member has no fingerprint ID' }

  if (device.connection_type === 'direct') {
    const { disableMember, enableMember } = await import('./hikvision')

    if (action === 'disable') {
      const ok = await disableMember(device, member.fingerprint_id)
      return ok ? { success: true } : { error: 'ISAPI call failed' }
    } else {
      const ok = await enableMember(device, member.fingerprint_id, endDate)
      return ok ? { success: true } : { error: 'ISAPI call failed' }
    }
  } else {
    // Queue for sync.js (Chakkar/Jio gym)
    const { error } = await supabase
      .from('hikvision_commands')
      .insert({
        gym_id: gymId,
        member_id: memberId,
        command_type: action === 'disable' ? 'disable_user' : 'enable_user',
        payload: {
          employeeNo: member.fingerprint_id,
          endDate: endDate,
          enable: action !== 'disable',
        },
        status: 'pending',
      })

    return error ? { error: error.message } : { success: true, method: 'queued' }
  }
}
