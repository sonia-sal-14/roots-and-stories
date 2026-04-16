import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Chapter } from '@/types/database'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen } from 'lucide-react'

interface LocationState {
  title: string
  language: string
  audioBlob: Blob
  mimeType: string
  transcript_original: string
  transcript_english: string
  ai_suggested_chapter: string
}

export default function ChapterConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = location.state as LocationState | null

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [title, setTitle] = useState(state?.title ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [familyGroupId, setFamilyGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (!state) { navigate('/record'); return }
    loadChapters()
  }, [user])

  const loadChapters = async () => {
    if (!user) return

    const { data: member } = await supabase
      .from('family_members')
      .select('family_group_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member) return
    setFamilyGroupId(member.family_group_id)

    const { data: chapterData } = await supabase
      .from('chapters')
      .select('*')
      .eq('family_group_id', member.family_group_id)
      .order('sort_order')

    if (chapterData) {
      setChapters(chapterData)
      // Pre-select the AI suggested chapter
      const suggested = chapterData.find(
        c => c.title === state?.ai_suggested_chapter
      )
      setSelectedChapterId(suggested?.id ?? chapterData[0]?.id ?? '')
    }
  }

  const saveStory = async () => {
    if (!user || !state || !familyGroupId) return
    setError('')
    setSaving(true)

    try {
      // 1. Upload audio to Supabase Storage
      const ext = state.mimeType.split('/')[1]?.split(';')[0] ?? 'webm'
      const audioPath = `${familyGroupId}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('story-audio')
        .upload(audioPath, state.audioBlob, { contentType: state.mimeType })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage
        .from('story-audio')
        .getPublicUrl(audioPath)

      // 2. Insert story
      const { error: storyError } = await supabase.from('stories').insert({
        family_group_id: familyGroupId,
        chapter_id: selectedChapterId || null,
        created_by: user.id,
        title: title.trim() || 'Untitled story',
        original_language: state.language,
        audio_url: urlData.publicUrl,
        transcript_original: state.transcript_original,
        transcript_english: state.transcript_english,
        ai_suggested_chapter: state.ai_suggested_chapter,
      })

      if (storyError) throw new Error(storyError.message)

      navigate('/library')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!state) return null

  return (
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      <AppHeader showBack backTo="/record" title="Review your story" subtitle="Check the transcript and choose a chapter" />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* AI suggested chapter badge */}
        <div className="flex items-center gap-2 bg-[#C8860A]/10 border border-[#C8860A]/30 rounded-xl px-4 py-3">
          <span className="text-lg">✨</span>
          <div>
            <div className="text-xs text-[#C8860A] font-semibold uppercase tracking-wide">AI suggested</div>
            <div className="font-bold text-[#5C3D2E]">{state.ai_suggested_chapter}</div>
          </div>
        </div>

        {/* English transcript */}
        <div className="bg-white rounded-2xl border border-[#5C3D2E]/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#C8860A]" />
            <span className="text-sm font-semibold text-[#5C3D2E]">English transcript</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">
            {state.transcript_english}
          </p>
        </div>

        {/* Original transcript (if different language) */}
        {state.language !== 'English' && state.transcript_original && (
          <div className="bg-white rounded-2xl border border-[#5C3D2E]/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#5C3D2E]" />
              <span className="text-sm font-semibold text-[#5C3D2E]">Original ({state.language})</span>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">
              {state.transcript_original}
            </p>
          </div>
        )}

        {/* Story title */}
        <div className="space-y-2">
          <Label>Story title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give this story a title"
          />
        </div>

        {/* Chapter selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Save to chapter
          </Label>
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a chapter..." />
            </SelectTrigger>
            <SelectContent>
              {chapters.map(ch => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.title}
                  {ch.title === state.ai_suggested_chapter && ' ✨'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          size="lg"
          className="w-full text-lg"
          onClick={saveStory}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving your story...
            </span>
          ) : 'Save story to library 📖'}
        </Button>

        <button
          onClick={() => navigate('/record')}
          className="w-full text-center text-sm text-gray-400 hover:text-[#5C3D2E] transition-colors py-2"
        >
          ← Go back and re-record
        </button>
      </div>
    </div>
  )
}
