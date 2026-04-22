import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } }
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured for account deletion.' })
  }

  // Verify the user's session token
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const userId = userData.user.id

  try {
    // 1. Remove from all family groups (stories stay — they belong to the family)
    await supabaseAdmin.from('family_members').delete().eq('user_id', userId)

    // 2. Delete the auth user — this is permanent
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[api/delete-account] Error:', err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return res.status(500).json({ error: message })
  }
}
