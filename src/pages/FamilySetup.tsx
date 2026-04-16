import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Users, UserPlus } from 'lucide-react'

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
      if (!profile) throw new Error('Profile data missing. Please go back and try again.')

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
      if (!profile) throw new Error('Profile data missing. Please go back and try again.')

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
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 pt-8 pb-4">
        <BookOpen className="w-7 h-7 text-[#C8860A] mr-2" />
        <span className="text-xl font-bold text-[#5C3D2E]">Roots & Stories</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">

          {/* Choose mode */}
          {mode === 'choose' && (
            <div className="text-center">
              <div className="text-5xl mb-6">🏡</div>
              <h2 className="text-3xl font-bold text-[#5C3D2E] mb-3">Your family space</h2>
              <p className="text-gray-500 mb-10">Create a new space for your family, or join one that already exists.</p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setMode('create')}
                  className="bg-white border-2 border-[#5C3D2E]/20 rounded-2xl p-6 text-left hover:border-[#5C3D2E] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#5C3D2E] rounded-xl flex items-center justify-center group-hover:bg-[#4a3124] transition-colors">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-[#5C3D2E] text-lg">Create a family</div>
                      <div className="text-gray-500 text-sm">Start a new space and invite others</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="bg-white border-2 border-[#5C3D2E]/20 rounded-2xl p-6 text-left hover:border-[#C8860A] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#C8860A] rounded-xl flex items-center justify-center group-hover:bg-[#a36e08] transition-colors">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-[#5C3D2E] text-lg">Join a family</div>
                      <div className="text-gray-500 text-sm">Enter an invite code from a family member</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Create family */}
          {mode === 'create' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#5C3D2E]/10 p-8">
              <button onClick={() => { setMode('choose'); setError('') }} className="text-[#5C3D2E] text-sm mb-4 hover:underline">← Back</button>
              <h2 className="text-2xl font-bold text-[#5C3D2E] mb-2">Name your family</h2>
              <p className="text-gray-500 mb-6">Choose something warm and recognisable — like "The Garcia Family" or "Nana's Stories".</p>

              <div className="space-y-2 mb-6">
                <Label htmlFor="familyName">Family name</Label>
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
            <div className="bg-white rounded-2xl shadow-sm border border-[#5C3D2E]/10 p-8">
              <button onClick={() => { setMode('choose'); setError('') }} className="text-[#5C3D2E] text-sm mb-4 hover:underline">← Back</button>
              <h2 className="text-2xl font-bold text-[#5C3D2E] mb-2">Join your family</h2>
              <p className="text-gray-500 mb-6">Ask a family member for their 6-character invite code and enter it below.</p>

              <div className="space-y-2 mb-6">
                <Label htmlFor="inviteCode">Invite code</Label>
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

              <Button size="lg" variant="accent" className="w-full text-lg" onClick={joinFamily} disabled={loading}>
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
