import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Story, FamilyMember, Chapter } from '@/types/database'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import {
  Play, Pause, ArrowLeft,
  Calendar, User, Mic,
} from 'lucide-react'

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [story, setStory] = useState<Story | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
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

    // Resolve audio URL — new stories store a path, old ones store a full URL
    if (storyData.audio_url) {
      if (storyData.audio_url.startsWith('http')) {
        // Old format: full public URL — use as-is (will break once bucket is private)
        setAudioUrl(storyData.audio_url)
      } else {
        // New format: storage path — generate a 1-hour signed URL
        const { data: signed } = await supabase.storage
          .from('story-audio')
          .createSignedUrl(storyData.audio_url, 3600)
        if (signed) setAudioUrl(signed.signedUrl)
      }
    }

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
      <div className="min-h-screen bg-[#3B2B3A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#D95D39] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#F5E9E0] font-medium">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#3B2B3A] flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-4">{error || 'Story not found.'}</p>
        <Button onClick={() => navigate('/library')}>Back to Library</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
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
            <div className="flex items-center gap-2 bg-[#F5E9E0] rounded-full px-4 py-2 shadow-sm">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.display_name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#3B3B58] flex items-center justify-center">
                  <User className="w-3 h-3 text-[#D5D9EC]" />
                </div>
              )}
              <span className="text-sm font-semibold text-[#3B2B3A]">{member.display_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#F5E9E0] rounded-full px-4 py-2 shadow-sm">
            <Mic className="w-4 h-4 text-[#D95D39]" />
            <span className="text-sm font-semibold text-[#3B2B3A]">{story.original_language}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#F5E9E0] rounded-full px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-[#3B2B3A]/40" />
            <span className="text-sm font-semibold text-[#3B2B3A]">{formatDate(story.created_at)}</span>
          </div>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-[#F5E9E0] rounded-2xl shadow-lg p-5">
            <audio
              ref={audioRef}
              src={audioUrl}
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
                className="w-14 h-14 rounded-full bg-[#3B2B3A] flex items-center justify-center flex-shrink-0 hover:bg-[#D95D39] transition-colors shadow"
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
                    background: `linear-gradient(to right, #D95D39 ${progress}%, #3B2B3A20 ${progress}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-[#3B2B3A]/50 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcript section */}
        {story.transcript_english && (
          <div className="bg-[#F5E9E0] rounded-2xl shadow-lg p-5">
            <h3 className="font-bold text-[#3B2B3A] text-base mb-3">Transcript</h3>
            <p className="text-[#3B2B3A]/70 leading-relaxed text-base">
              {story.transcript_english}
            </p>
          </div>
        )}

        {/* Back button */}
        <Button
          variant="outline"
          className="w-full border-[#F5E9E0]/25 text-[#F5E9E0] hover:bg-[#F5E9E0]/08"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>
    </div>
  )
}
