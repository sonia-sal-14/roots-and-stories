import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Chapter, Story, FamilyMember, FamilyGroup } from '@/types/database'
import { StoryCard } from '@/components/StoryCard'
import { ChapterModal } from '@/components/ChapterModal'
import { Button } from '@/components/ui/button'
import {
  Mic, ChevronDown, ChevronUp,
  Plus, LogOut, ArrowUp, ArrowDown,
} from 'lucide-react'

const CHAPTER_EMOJIS: Record<string, string> = {
  'Childhood': '🌱',
  'Cultural Heritage': '🏺',
  'Family & Traditions': '🤝',
  'Recent Memories': '⭐',
}
const chapterEmoji = (title: string) => CHAPTER_EMOJIS[title] ?? '📖'

export default function Library() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set())
  const [showChapterModal, setShowChapterModal] = useState(false)

  // Fetch everything
  const loadData = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      // 1. Get user's family member record to find their group
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (memberError || !memberData) {
        // Show error rather than redirect (prevents redirect loop)
        setError('no-family')
        setLoading(false)
        return
      }

      const groupId = memberData.family_group_id

      // 2. Fetch in parallel
      const [groupRes, chaptersRes, storiesRes, membersRes] = await Promise.all([
        supabase.from('family_groups').select('*').eq('id', groupId).single(),
        supabase.from('chapters').select('*').eq('family_group_id', groupId).order('sort_order'),
        supabase.from('stories').select('*').eq('family_group_id', groupId).order('sort_order'),
        supabase.from('family_members').select('*').eq('family_group_id', groupId),
      ])

      if (groupRes.data) setFamilyGroup(groupRes.data)
      if (chaptersRes.data) {
        setChapters(chaptersRes.data)
        // Open all chapters by default
        setOpenChapters(new Set(chaptersRes.data.map(c => c.id)))
      }
      if (storiesRes.data) setStories(storiesRes.data)
      if (membersRes.data) setMembers(membersRes.data)
    } catch (err) {
      setError('Failed to load your library. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user])

  const toggleChapter = (id: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const moveChapter = async (chapter: Chapter, direction: 'up' | 'down') => {
    const idx = chapters.findIndex(c => c.id === chapter.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= chapters.length) return

    const other = chapters[swapIdx]
    const newChapters = [...chapters]
    newChapters[idx] = { ...chapter, sort_order: other.sort_order }
    newChapters[swapIdx] = { ...other, sort_order: chapter.sort_order }
    newChapters.sort((a, b) => a.sort_order - b.sort_order)
    setChapters(newChapters)

    await Promise.all([
      supabase.from('chapters').update({ sort_order: other.sort_order }).eq('id', chapter.id),
      supabase.from('chapters').update({ sort_order: chapter.sort_order }).eq('id', other.id),
    ])
  }

  const getMemberById = (userId: string | null) =>
    members.find(m => m.user_id === userId)

  const getStoriesForChapter = (chapterId: string) =>
    stories.filter(s => s.chapter_id === chapterId)

  const uncategorisedStories = stories.filter(s => !s.chapter_id)

  const handleSignOut = async () => {
    await signOut()
    navigate('/welcome')
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#3B2B3A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#D95D39] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#F5E9E0] font-medium">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (error === 'no-family') {
    return (
      <div className="min-h-screen bg-[#3B2B3A] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🏡</div>
          <h2 className="text-2xl font-bold text-[#F5E9E0] mb-2">No family found</h2>
          <p className="text-[#D5D9EC]/60 mb-6">You're not linked to a family group yet. Create one or join an existing one.</p>
          <Button size="lg" className="w-full mb-3" onClick={() => navigate('/family-setup')}>
            Set up your family
          </Button>
          <button onClick={handleSignOut} className="text-sm text-[#D5D9EC]/50 hover:text-[#F5E9E0]">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#3B2B3A] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadData}>Try again</Button>
        </div>
      </div>
    )
  }

  // ── Main UI ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#3B2B3A]">
      {/* Safe area spacer for iOS status bar */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      {/* Floating glass header */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2" style={{ top: 'env(safe-area-inset-top)' }}>
        <div
          className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3 rounded-2xl border border-[#F5E9E0]/12"
          style={{
            background: 'rgba(59, 43, 58, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0">
              <img src="/logo-orange.png" alt="Kahani" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-black text-[#F5E9E0] text-base tracking-tight leading-tight">
                {familyGroup?.name ?? 'kahani'}
              </div>
              <div className="text-xs text-[#D5D9EC]/50">
                Invite: <span className="font-mono font-bold tracking-widest text-[#D95D39]">{familyGroup?.invite_code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/record')}
              className="flex items-center gap-2 bg-[#D95D39] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#B84A2A] transition-colors shadow-[0_4px_14px_rgba(217,93,57,0.4)]"
            >
              <Mic className="w-4 h-4" />
              <span>Record</span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 text-[#D5D9EC]/40 hover:text-[#F5E9E0] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Empty state */}
        {chapters.length === 0 && stories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-[#F5E9E0] mb-2">
              Your family's story starts here.
            </h2>
            <p className="text-[#D5D9EC]/60 mb-8">
              Record your first memory and it will appear here for your whole family.
            </p>
            <Button size="lg" onClick={() => navigate('/record')} className="gap-2">
              <Mic className="w-5 h-5" />
              Record your first story
            </Button>
          </div>
        )}

        {/* Chapters accordion */}
        {chapters.map((chapter, idx) => {
          const chapterStories = getStoriesForChapter(chapter.id)
          const isOpen = openChapters.has(chapter.id)

          return (
            <div key={chapter.id} className="bg-[#F5E9E0] rounded-3xl shadow-lg overflow-hidden">
              {/* Chapter header */}
              <div className="flex items-center px-5 py-4">
                <button
                  className="flex-1 flex items-center gap-3 text-left"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D95D39] to-[#E8845E] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(217,93,57,0.35)]">
                    <span className="text-xl">{chapterEmoji(chapter.title)}</span>
                  </div>
                  <div>
                    <div className="font-black text-[#3B2B3A] text-base tracking-tight">{chapter.title}</div>
                    <div className="text-xs text-[#3B2B3A]/50 mt-0.5">
                      {chapterStories.length === 0
                        ? 'No stories yet'
                        : `${chapterStories.length} ${chapterStories.length === 1 ? 'story' : 'stories'}`}
                    </div>
                  </div>
                  <div className="ml-auto">
                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-[#3B2B3A]/30" />
                      : <ChevronDown className="w-5 h-5 text-[#3B2B3A]/30" />}
                  </div>
                </button>

                {/* Reorder buttons */}
                <div className="flex gap-1 ml-2">
                  <button onClick={() => moveChapter(chapter, 'up')} disabled={idx === 0}
                    className="p-1.5 rounded-xl text-[#3B2B3A]/30 hover:text-[#3B2B3A] hover:bg-[#3B2B3A]/08 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveChapter(chapter, 'down')} disabled={idx === chapters.length - 1}
                    className="p-1.5 rounded-xl text-[#3B2B3A]/30 hover:text-[#3B2B3A] hover:bg-[#3B2B3A]/08 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stories list */}
              {isOpen && (
                <div className="border-t border-[#3B2B3A]/08 px-4 py-3 space-y-3 bg-[#3B2B3A]/05">
                  {chapterStories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#3B2B3A]/50 text-sm">No stories here yet.</p>
                      <button onClick={() => navigate('/record')} className="text-[#D95D39] font-semibold text-sm mt-1 hover:underline">Record one →</button>
                    </div>
                  ) : (
                    chapterStories.map(story => (
                      <StoryCard key={story.id} story={story} member={getMemberById(story.created_by)} />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Uncategorised stories */}
        {uncategorisedStories.length > 0 && (
          <div className="bg-[#F5E9E0] rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3B2B3A]/08">
              <div className="font-bold text-[#3B2B3A]/50 text-sm uppercase tracking-wide">Uncategorised</div>
            </div>
            <div className="px-4 py-3 space-y-3 bg-[#3B2B3A]/05">
              {uncategorisedStories.map(story => (
                <StoryCard
                  key={story.id}
                  story={story}
                  member={getMemberById(story.created_by)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add chapter button */}
        <button
          onClick={() => setShowChapterModal(true)}
          className="w-full py-4 border-2 border-dashed border-[#F5E9E0]/20 rounded-2xl text-[#F5E9E0]/40 hover:border-[#F5E9E0]/40 hover:text-[#F5E9E0] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add a chapter
        </button>

        {/* Bottom spacer for floating button + safe area */}
        <div style={{ height: 'calc(env(safe-area-inset-bottom) + 88px)' }} />
      </div>

      {/* Floating record button on mobile */}
      <div className="fixed right-6 sm:hidden" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button
          onClick={() => navigate('/record')}
          className="w-16 h-16 bg-[#D95D39] rounded-full shadow-lg flex items-center justify-center hover:bg-[#B84A2A] transition-colors shadow-[0_4px_16px_rgba(217,93,57,0.5)]"
        >
          <Mic className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Chapter modal */}
      {familyGroup && (
        <ChapterModal
          open={showChapterModal}
          onClose={() => setShowChapterModal(false)}
          familyGroupId={familyGroup.id}
          nextSortOrder={chapters.length}
          onCreated={loadData}
        />
      )}
    </div>
  )
}
