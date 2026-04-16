import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Chapter, Story, FamilyMember, FamilyGroup } from '@/types/database'
import { StoryCard } from '@/components/StoryCard'
import { ChapterModal } from '@/components/ChapterModal'
import { Button } from '@/components/ui/button'
import {
  BookOpen, Mic, ChevronDown, ChevronUp,
  Plus, LogOut, ArrowUp, ArrowDown,
} from 'lucide-react'

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
        .single()

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
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#5C3D2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5C3D2E] font-medium">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (error === 'no-family') {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🏡</div>
          <h2 className="text-2xl font-bold text-[#5C3D2E] mb-2">No family found</h2>
          <p className="text-gray-500 mb-6">You're not linked to a family group yet. Create one or join an existing one.</p>
          <Button size="lg" className="w-full mb-3" onClick={() => navigate('/family-setup')}>
            Set up your family
          </Button>
          <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>Try again</Button>
        </div>
      </div>
    )
  }

  // ── Main UI ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      {/* Header */}
      <div className="bg-white border-b border-[#5C3D2E]/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#C8860A]" />
            <div>
              <div className="font-bold text-[#5C3D2E] leading-tight">
                {familyGroup?.name ?? 'Our Family'}
              </div>
              <div className="text-xs text-gray-400">
                Code: <span className="font-mono font-semibold tracking-wider">{familyGroup?.invite_code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="accent"
              onClick={() => navigate('/record')}
              className="flex items-center gap-1.5"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Record</span>
            </Button>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-[#5C3D2E] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Empty state */}
        {chapters.length === 0 && stories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-[#5C3D2E] mb-2">
              Your family's story starts here.
            </h2>
            <p className="text-gray-500 mb-8">
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
            <div key={chapter.id} className="bg-white rounded-2xl border border-[#5C3D2E]/10 overflow-hidden shadow-sm">
              {/* Chapter header */}
              <div className="flex items-center px-5 py-4">
                <button
                  className="flex-1 flex items-center gap-3 text-left"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#5C3D2E]/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#5C3D2E]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#5C3D2E]">{chapter.title}</div>
                    <div className="text-xs text-gray-400">
                      {chapterStories.length === 0
                        ? 'No stories yet'
                        : `${chapterStories.length} ${chapterStories.length === 1 ? 'story' : 'stories'}`}
                    </div>
                  </div>
                  <div className="ml-auto">
                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Reorder buttons */}
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() => moveChapter(chapter, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-md text-gray-300 hover:text-[#5C3D2E] hover:bg-[#FDF6EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveChapter(chapter, 'down')}
                    disabled={idx === chapters.length - 1}
                    className="p-1.5 rounded-md text-gray-300 hover:text-[#5C3D2E] hover:bg-[#FDF6EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stories list */}
              {isOpen && (
                <div className="border-t border-[#5C3D2E]/5 px-4 py-3 space-y-3 bg-[#FDF6EE]/50">
                  {chapterStories.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm">
                        No stories in this chapter yet. Record one!
                      </p>
                    </div>
                  ) : (
                    chapterStories.map(story => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        member={getMemberById(story.created_by)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Uncategorised stories */}
        {uncategorisedStories.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#5C3D2E]/10 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#5C3D2E]/5">
              <div className="font-bold text-gray-400 text-sm uppercase tracking-wide">Uncategorised</div>
            </div>
            <div className="px-4 py-3 space-y-3 bg-[#FDF6EE]/50">
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
          className="w-full py-4 border-2 border-dashed border-[#5C3D2E]/20 rounded-2xl text-[#5C3D2E]/50 hover:border-[#5C3D2E]/40 hover:text-[#5C3D2E] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add a chapter
        </button>

        {/* Bottom Record button (mobile) */}
        <div className="h-6" />
      </div>

      {/* Floating record button on mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          onClick={() => navigate('/record')}
          className="w-16 h-16 bg-[#C8860A] rounded-full shadow-lg flex items-center justify-center hover:bg-[#a36e08] transition-colors"
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
