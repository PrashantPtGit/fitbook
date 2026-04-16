import { supabase } from '../lib/supabase'

/**
 * Creates a Supabase auth account for a member so they can log into the member portal.
 * Called from staff app: MemberProfile page → "Create Login" button.
 *
 * Login credentials for the member:
 *   Email:    <phone>@mlcgym.member
 *   Password: <password>
 */
export async function createMemberAccount(memberId, phone, password) {
  const digits = phone.replace(/\D/g, '')
  const email  = `${digits}@mlcgym.member`

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'member', phone: digits },
  })
  if (authError) return { error: authError.message }

  const userId = authData.user.id

  // 2. Get gym_id from member record
  const { data: memberData, error: memberErr } = await supabase
    .from('members')
    .select('gym_id, name')
    .eq('id', memberId)
    .single()
  if (memberErr) return { error: memberErr.message }

  // 3. Insert into member_accounts (links auth user ↔ member row)
  const { error: accErr } = await supabase.from('member_accounts').insert({
    user_id:   userId,
    member_id: memberId,
    gym_id:    memberData.gym_id,
  })
  if (accErr) return { error: accErr.message }

  // 4. Insert role so useGymsData knows this is a member
  const { error: roleErr } = await supabase.from('user_roles').insert({
    user_id: userId,
    role:    'member',
    gym_id:  memberData.gym_id,
    name:    memberData.name,
  })
  if (roleErr) return { error: roleErr.message }

  return { success: true, email, userId }
}

/**
 * Checks whether a member already has a portal account.
 */
export async function getMemberAccountStatus(memberId) {
  const { data, error } = await supabase
    .from('member_accounts')
    .select('id, user_id')
    .eq('member_id', memberId)
    .maybeSingle()

  if (error) return { hasAccount: false, error: error.message }
  return { hasAccount: !!data, accountId: data?.id }
}
