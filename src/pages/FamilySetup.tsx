import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, UserPlus } from 'lucide-react'

const DEFAULT_CHAPTERS = [
  { title: 'Childhood', sort_order: 0 },
  { title: 'Cultural Heritage', sort_order: 1 },
  { title: 'Family & Traditions', sort_order: 2 },
  { title: 'Recent Memories', sort_order: 3 },
]

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function FamilySetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If user already has a family, go straight to library
  // But only do this check once, not in a loop
  useEffect(() => {
    if (!user) return
    // Don't redirect if we came from library (prevents loop)
    const fromLibrary = document.referrer.includes('/library')
    if (fromLibrary) return
    supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate('/library', { replace: true })
      })
  }, [user])

  const getPendingProfile = () => {
    const raw = localStorage.getItem('pending_profile')
    if (!raw) return null
    return JSON.parse(raw) as { display_name: string; native_language: string; photo_url: string | null }
  }

  const createFamily = async () => {
    if (!user) return
    if (!familyName.trim()) { setError('Please enter a family name.'); return }

    setError('')
    setLoading(true)

    try {
      const profile = getPendingProfile()
      if (!profile) {
        navigate('/profile-setup', { replace: true })
        return
      }

      // Generate group ID client-side so we don't need to read it back
      // (SELECT RLS blocks reading before we're a member)
      const groupId = crypto.randomUUID()
      const code = generateInviteCode()

      // 1. Create family group
      const { error: groupError } = await supabase
        .from('family_groups')
        .insert({ id: groupId, name: familyName.trim(), invite_code: code, created_by: user.id })
      if (groupError) throw new Error(groupError.message)

      // 2. Insert family member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          family_group_id: groupId,
          display_name: profile.display_name,
          native_language: profile.native_language,
          photo_url: profile.photo_url,
        })
      if (memberError) throw new Error(memberError.message)

      // 3. Create default chapters
      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(DEFAULT_CHAPTERS.map(ch => ({
          ...ch,
          family_group_id: groupId,
          created_by: user.id,
        })))
      if (chaptersError) throw new Error(chaptersError.message)

      localStorage.removeItem('pending_profile')
      navigate('/library')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const joinFamily = async () => {
    if (!user) return
    const code = inviteCode.trim().toUpperCase()
    if (code.length !== 6) { setError('Please enter a 6-character invite code.'); return }

    setError('')
    setLoading(true)

    try {
      const profile = getPendingProfile()
      if (!profile) {
        navigate('/profile-setup', { replace: true })
        return
      }

      // Look up family group
      const { data: group, error: groupError } = await supabase
        .from('family_groups')
        .select()
        .eq('invite_code', code)
        .single()
      if (groupError || !group) throw new Error('No family found with that invite code. Please check and try again.')

      // Insert family member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          family_group_id: group.id,
          display_name: profile.display_name,
          native_language: profile.native_language,
          photo_url: profile.photo_url,
        })
      if (memberError) {
        if (memberError.code === '23505') throw new Error('You are already a member of this family group.')
        throw memberError
      }

      localStorage.removeItem('pending_profile')
      navigate('/library')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader title="Your family" subtitle="Step 2 of 2" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">

          {/* Choose mode */}
          {mode === 'choose' && (
            <div className="text-center">
              <div className="text-5xl mb-6">🏡</div>
              <h2 className="text-3xl font-bold text-[#F5E9E0] mb-3">Your family space</h2>
              <p className="text-[#D5D9EC]/60 mb-10">Create a new space for your family, or join one that already exists.</p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setMode('create')}
                  className="bg-[#F5E9E0] border-2 border-transparent rounded-2xl p-6 text-left hover:border-[#D95D39]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D95D39] rounded-xl flex items-center justify-center group-hover:bg-[#B84A2A] transition-colors">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-[#3B2B3A] text-lg">Create a family</div>
                      <div className="text-[#3B2B3A]/50 text-sm">Start a new space and invite others</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="bg-[#F5E9E0] border-2 border-transparent rounded-2xl p-6 text-left hover:border-[#D95D39]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#3B3B58] rounded-xl flex items-center justify-center group-hover:bg-[#D95D39] transition-colors">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-[#3B2B3A] text-lg">Join a family</div>
                      <div className="text-[#3B2B3A]/50 text-sm">Enter an invite code from a family member</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Create family */}
          {mode === 'create' && (
            <div className="bg-[#F5E9E0] rounded-2xl shadow-lg p-8">
              <button onClick={() => { setMode('choose'); setError('') }} className="text-[#D95D39] text-sm mb-4 hover:underline">← Back</button>
              <h2 className="text-2xl font-bold text-[#3B2B3A] mb-2">Name your family</h2>
              <p className="text-[#3B2B3A]/50 mb-6">Choose something warm and recognisable — like "The Garcia Family" or "Nana's Stories".</p>

              <div className="space-y-2 mb-6">
                <Label htmlFor="familyName" className="text-[#3B2B3A]">Family name</Label>
                <Input
                  id="familyName"
                  placeholder='e.g. "The Martinez Family"'
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createFamily()}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full text-lg" onClick={createFamily} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating your family...
                  </span>
                ) : 'Create family →'}
              </Button>
            </div>
          )}

          {/* Join family */}
          {mode === 'join' && (
            <div className="bg-[#F5E9E0] rounded-2xl shadow-lg p-8">
              <button onClick={() => { setMode('choose'); setError('') }} className="text-[#D95D39] text-sm mb-4 hover:underline">← Back</button>
              <h2 className="text-2xl font-bold text-[#3B2B3A] mb-2">Join your family</h2>
              <p className="text-[#3B2B3A]/50 mb-6">Ask a family member for their 6-character invite code and enter it below.</p>

              <div className="space-y-2 mb-6">
                <Label htmlFor="inviteCode" className="text-[#3B2B3A]">Invite code</Label>
                <Input
                  id="inviteCode"
                  placeholder="e.g. AB3X7K"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="tracking-widest text-center text-xl font-mono uppercase"
                  onKeyDown={e => e.key === 'Enter' && joinFamily()}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full text-lg" onClick={joinFamily} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : 'Join family →'}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
