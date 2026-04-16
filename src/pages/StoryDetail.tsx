import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Story, FamilyMember, Chapter } from '@/types/database'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Play, Pause, ArrowLeft,
  Calendar, User, Mic, Globe,
} from 'lucide-react'

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [story, setStory] = useState<Story | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!id) return
    loadStory()
  }, [id])

  const loadStory = async () => {
    setLoading(true)
    setError('')

    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id!)
      .single()

    if (storyError || !storyData) {
      setError('Story not found.')
      setLoading(false)
      return
    }

    setStory(storyData)

    // Fetch member and chapter in parallel
    const [memberRes, chapterRes] = await Promise.all([
      storyData.created_by
        ? supabase.from('family_members').select('*').eq('user_id', storyData.created_by).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      storyData.chapter_id
        ? supabase.from('chapters').select('*').eq('id', storyData.chapter_id).single()
        : Promise.resolve({ data: null }),
    ])

    if (memberRes.data) setMember(memberRes.data)
    if (chapterRes.data) setChapter(chapterRes.data)
    setLoading(false)
  }

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = value
    setCurrentTime(value)
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#5C3D2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5C3D2E] font-medium">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex flex-col items-center justify-center px-6">
        <p className="text-red-600 mb-4">{error || 'Story not found.'}</p>
        <Button onClick={() => navigate('/library')}>Back to Library</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      <AppHeader
        showBack
        backTo="/library"
        title={story.title}
        subtitle={chapter ? `${chapter.title}` : undefined}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Meta info */}
        <div className="flex flex-wrap gap-3">
          {member && (
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-[#5C3D2E]/10 shadow-sm">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.display_name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#5C3D2E] flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-sm font-semibold text-[#5C3D2E]">{member.display_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-[#5C3D2E]/10 shadow-sm">
            <Mic className="w-4 h-4 text-[#C8860A]" />
            <span className="text-sm font-semibold text-[#5C3D2E]">{story.original_language}</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-[#5C3D2E]/10 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{formatDate(story.created_at)}</span>
          </div>
        </div>

        {/* Audio Player */}
        {story.audio_url && (
          <div className="bg-white rounded-2xl border border-[#5C3D2E]/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#C8860A]" />
              <span className="text-sm font-semibold text-[#5C3D2E]">
                Listen in {story.original_language}
              </span>
            </div>

            <audio
              ref={audioRef}
              src={story.audio_url}
              onTimeUpdate={() => {
                if (!audioRef.current) return
                setCurrentTime(audioRef.current.currentTime)
                setProgress(audioRef.current.duration
                  ? (audioRef.current.currentTime / audioRef.current.duration) * 100
                  : 0)
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) setDuration(audioRef.current.duration)
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Play button + scrubber */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-[#5C3D2E] flex items-center justify-center flex-shrink-0 hover:bg-[#4a3124] transition-colors shadow"
              >
                {isPlaying
                  ? <Pause className="w-6 h-6 text-white fill-current" />
                  : <Play className="w-6 h-6 text-white fill-current ml-0.5" />}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #5C3D2E ${progress}%, #e5e7eb ${progress}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcripts */}
        {(story.transcript_original || story.transcript_english) && (
          <div className="bg-white rounded-2xl border border-[#5C3D2E]/10 shadow-sm overflow-hidden">
            <Tabs defaultValue="english">
              <div className="px-5 pt-5">
                <TabsList className="w-full">
                  <TabsTrigger value="english" className="flex-1">English</TabsTrigger>
                  <TabsTrigger value="original" className="flex-1">
                    {story.original_language === 'English' ? 'Original' : story.original_language}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="english" className="px-5 pb-5">
                {story.transcript_english ? (
                  <p className="text-gray-700 leading-relaxed text-base">
                    {story.transcript_english}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No English transcript available.</p>
                )}
              </TabsContent>

              <TabsContent value="original" className="px-5 pb-5">
                {story.transcript_original ? (
                  <p className="text-gray-700 leading-relaxed text-base">
                    {story.transcript_original}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No original transcript available.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Back button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>
    </div>
  )
}
