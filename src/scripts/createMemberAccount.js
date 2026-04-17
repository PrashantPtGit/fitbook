import { supabase } from '../lib/supabase'

/**
 * Creates a Supabase auth account for a member via Edge Function (server-side).
 * The admin.createUser() call must run server-side with the service role key —
 * calling it from the browser returns "User not allowed".
 *
 * Login credentials for the member:
 *   Email:    <phone>@mlcgym.member
 *   Password: <password>
 */
export async function createMemberAccount(memberId, phone, password) {
  const digits = phone.replace(/\D/g, '')

  // Fetch gym_id from the member record
  const { data: memberData, error: memberErr } = await supabase
    .from('members')
    .select('gym_id')
    .eq('id', memberId)
    .single()
  if (memberErr) return { error: memberErr.message }

  // Get current session token to authenticate the edge function call
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const response = await fetch(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/create-member-account',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({
        memberId,
        phone: digits,
        password,
        gymId: memberData.gym_id,
      }),
    }
  )

  const result = await response.json()
  if (result.error) return { error: result.error }
  return { success: true }
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
