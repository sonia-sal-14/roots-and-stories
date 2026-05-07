import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Story, FamilyMember, Chapter } from '@/types/database'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import {
  Play, Pause, ArrowLeft,
  Calendar, User, Mic, Trash2,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playError, setPlayError] = useState('')

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

    // Resolve audio URL — new stories store a path, old ones store a full URL.
    // The bucket is now private, so even old stories with full public URLs
    // need to be re-signed.
    if (storyData.audio_url) {
      let storagePath: string | null = null

      // Extract storage path from a Supabase public URL, e.g.
      // https://<project>.supabase.co/storage/v1/object/public/story-audio/<path>
      const publicMatch = storyData.audio_url.match(/\/storage\/v1\/object\/(?:public|sign)\/story-audio\/(.+?)(?:\?|$)/)
      if (publicMatch) {
        storagePath = decodeURIComponent(publicMatch[1])
      } else if (!storyData.audio_url.startsWith('http')) {
        // Relative path — already a storage path
        storagePath = storyData.audio_url
      }

      if (storagePath) {
        const { data: signed, error: signErr } = await supabase.storage
          .from('story-audio')
          .createSignedUrl(storagePath, 3600)
        if (signErr) console.error('[StoryDetail] sign error:', signErr)
        if (signed) setAudioUrl(signed.signedUrl)
      } else {
        // Genuinely external URL — use as-is
        setAudioUrl(storyData.audio_url)
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

  const handleDelete = async () => {
    if (!story) return
    setDeleting(true)

    // Delete audio from storage if we have a path
    if (story.audio_url) {
      let storagePath: string | null = null
      const publicMatch = story.audio_url.match(/\/storage\/v1\/object\/(?:public|sign)\/story-audio\/(.+?)(?:\?|$)/)
      if (publicMatch) {
        storagePath = decodeURIComponent(publicMatch[1])
      } else if (!story.audio_url.startsWith('http')) {
        storagePath = story.audio_url
      }
      if (storagePath) {
        await supabase.storage.from('story-audio').remove([storagePath])
      }
    }

    await supabase.from('stories').delete().eq('id', story.id)
    navigate('/library')
  }

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

  const togglePlay = async () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('[StoryDetail] play() failed:', err)
        setPlayError(err instanceof Error ? err.message : 'Could not play audio.')
        setIsPlaying(false)
      }
    }
  }

  // ── Dynamic waveform bars ───────────────────────────────
  // Deterministic per-story heights so the pattern is stable across renders.
  const WAVEFORM_BARS = 22
  const seededRandom = (seed: string, i: number) => {
    let h = 0
    const s = seed + i
    for (let j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) >>> 0
    return ((h % 1000) / 1000)
  }
  const barHeights = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const r = seededRandom(story?.id ?? 'x', i)
    return 0.35 + r * 0.65 // 0.35 → 1.0
  })

  const seekToBar = (i: number) => {
    if (!audioRef.current || !duration) return
    const t = ((i + 0.5) / WAVEFORM_BARS) * duration
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const playheadIndex = duration > 0
    ? Math.floor((currentTime / duration) * WAVEFORM_BARS)
    : -1

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
        right={
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl text-[#F5E9E0]/50 hover:text-[#D95D39] hover:bg-[#F5E9E0]/08 transition-colors"
            aria-label="Delete story"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        }
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
            {playError && (
              <div className="bg-[#D95D39]/10 border border-[#D95D39]/30 rounded-xl px-3 py-2 text-[#D95D39] text-xs mb-3">
                {playError}
              </div>
            )}
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={() => {
                if (!audioRef.current) return
                setCurrentTime(audioRef.current.currentTime)
              }}
              onLoadedMetadata={() => {
                const a = audioRef.current
                if (!a) return
                // Chrome MediaRecorder WebM bug: duration is reported as Infinity
                // until the file is fully scanned. Seeking past the end forces
                // the browser to compute the real duration, then we seek back.
                if (!isFinite(a.duration)) {
                  a.currentTime = 1e10
                } else {
                  setDuration(a.duration)
                }
              }}
              onDurationChange={() => {
                const a = audioRef.current
                if (!a) return
                if (isFinite(a.duration) && a.duration > 0) {
                  setDuration(a.duration)
                  // If we forced a seek to find the duration, snap back to start.
                  if (a.currentTime > a.duration) {
                    a.currentTime = 0
                    setCurrentTime(0)
                  }
                }
              }}
              onEnded={() => setIsPlaying(false)}
              onError={() => setPlayError('Could not load audio. The recording may be unavailable.')}
            />

            {/* Play button + dynamic waveform scrubber */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow active:scale-95 ${
                  isPlaying ? 'bg-[#D95D39]' : 'bg-[#3B2B3A] hover:bg-[#D95D39]'
                }`}
              >
                {isPlaying
                  ? <Pause className="w-6 h-6 text-white fill-current" />
                  : <Play className="w-6 h-6 text-white fill-current ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                {/* Waveform bars */}
                <div className="flex items-center justify-between gap-[3px] h-12">
                  {barHeights.map((h, i) => {
                    const isPlayed = i < playheadIndex
                    const isPlayhead = i === playheadIndex
                    const barH = isPlayhead && isPlaying ? Math.min(1, h + 0.15) : h
                    return (
                      <button
                        key={i}
                        onClick={() => seekToBar(i)}
                        className="flex-1 rounded-full transition-all duration-150 cursor-pointer"
                        style={{
                          height: `${barH * 100}%`,
                          background: isPlayhead
                            ? '#D95D39'
                            : isPlayed
                              ? '#D95D39'
                              : '#3B2B3A22',
                          boxShadow: isPlayhead && isPlaying
                            ? '0 0 12px rgba(217,93,57,0.7), 0 0 4px rgba(217,93,57,0.9)'
                            : 'none',
                          transform: isPlayhead && isPlaying ? 'scaleY(1.08)' : 'scaleY(1)',
                        }}
                        aria-label={`Seek to ${formatTime((i / WAVEFORM_BARS) * duration)}`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs font-mono text-[#3B2B3A]/50 mt-1.5">
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

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-[#3B2B3A] border border-[#F5E9E0]/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-[#F5E9E0] font-bold text-lg mb-2">Delete this story?</h2>
            <p className="text-[#F5E9E0]/60 text-sm mb-6">This recording will be permanently deleted and cannot be recovered.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-[#F5E9E0]/20 text-[#F5E9E0] text-sm font-semibold hover:bg-[#F5E9E0]/08 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-[#D95D39] text-white text-sm font-semibold hover:bg-[#B84A2A] transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
