import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transcribeAndTranslate, blobToBase64 } from '@/lib/api'
import { AppHeader } from '@/components/AppHeader'
import { TutorialBanner } from '@/components/TutorialBanner'
import { useTutorial } from '@/hooks/useTutorial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import type { StoryPrompt } from '@/types/database'
import { Mic, Square, Sparkles, Play, Pause, RefreshCw, ArrowLeft } from 'lucide-react'

const MAX_RECORDING_SECS = 30 * 60 // 30 minutes — adjust as needed
const WARN_BEFORE_SECS = 2 * 60   // show warning with 2 minutes left

const LANGUAGES = [
  // Global
  'English', 'Arabic', 'French', 'Mandarin', 'Portuguese', 'Spanish',
  // South & Southeast Asian
  'Bengali', 'Gujarati', 'Hindi', 'Marathi', 'Punjabi', 'Tamil', 'Telugu', 'Tagalog', 'Urdu',
  // East Asian
  'Japanese', 'Korean',
  // Other
  'Other',
]

type RecordingState = 'idle' | 'recording' | 'preview'
type ProcessingState = 'idle' | 'listening' | 'translating' | 'finishing'

const PROCESSING_MESSAGES: Record<ProcessingState, string> = {
  idle: '',
  listening: '🎧 Listening to your story...',
  translating: '🌍 Translating...',
  finishing: '✨ Almost ready...',
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function RecordStory() {
  const navigate = useNavigate()

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('English')

  // Prompts: 'closed' | 'single' (one suggestion + shuffle) | 'all' (browse list)
  const [promptView, setPromptView] = useState<'closed' | 'single' | 'all'>('closed')
  const [prompts, setPrompts] = useState<StoryPrompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0)

  // Error
  const [error, setError] = useState('')

  // Tutorial
  const { step, advance, skip } = useTutorial()

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    setError('')
    if (step === '4') skip()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setRecordingState('preview')
      }

      recorder.start(250)
      mediaRecorderRef.current = recorder
      setRecordingState('recording')
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= MAX_RECORDING_SECS) {
            clearInterval(timerRef.current!)
            mediaRecorderRef.current?.stop()
          }
          return next
        })
      }, 1000)
    } catch {
      setError('Microphone access is needed to record. Please allow access in your browser settings and try again.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const reRecord = () => {
    setRecordingState('idle')
    setAudioBlob(null)
    setAudioUrl(null)
    setElapsed(0)
    setIsPlaying(false)
  }

  const processStory = async () => {
    if (!audioBlob) return
    setError('')

    try {
      setProcessingState('listening')
      const base64 = await blobToBase64(audioBlob)

      setProcessingState('translating')
      const mimeType = audioBlob.type || 'audio/webm'
      const result = await transcribeAndTranslate(base64, mimeType, language)

      setProcessingState('finishing')
      await new Promise(r => setTimeout(r, 600))

      navigate('/confirm-chapter', {
        state: {
          title: title.trim() || result.suggested_chapter + ' memory',
          language,
          audioBlob,
          mimeType,
          transcript_original: result.transcript_original,
          transcript_english: result.transcript_english,
          ai_suggested_chapter: result.suggested_chapter,
        },
      })
    } catch (err) {
      setProcessingState('idle')
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.')
    }
  }

  const openPrompts = async () => {
    if (promptView !== 'closed') {
      setPromptView('closed')
      return
    }
    setPromptView('single')
    if (prompts.length > 0) {
      setCurrentPromptIdx(Math.floor(Math.random() * prompts.length))
      return
    }
    setPromptsLoading(true)
    const { data } = await supabase.from('story_prompts').select('*').order('category')
    if (data && data.length > 0) {
      setPrompts(data)
      setCurrentPromptIdx(Math.floor(Math.random() * data.length))
    }
    setPromptsLoading(false)
  }

  const shufflePrompt = () => {
    if (prompts.length < 2) return
    let next = currentPromptIdx
    while (next === currentPromptIdx) {
      next = Math.floor(Math.random() * prompts.length)
    }
    setCurrentPromptIdx(next)
  }

  const usePrompt = (text: string) => {
    setTitle(text)
    setPromptView('closed')
    if (step === '2') advance()
  }

  // Group prompts by category for the "see all" view
  const promptsByCategory = prompts.reduce<Record<string, StoryPrompt[]>>((acc, p) => {
    const cat = p.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const isProcessing = processingState !== 'idle'

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
      <AppHeader showBack backTo="/library" title="Record a story" subtitle="Speak in any language" />

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 max-w-lg mx-auto w-full">

        {/* ── IDLE: Big record button ── */}
        {recordingState === 'idle' && (
          <div className="flex flex-col items-center w-full">

            {/* Language selector — first, so it's set before recording */}
            <div className={`w-full bg-[#F5E9E0]/08 rounded-2xl p-4 mb-6 ${step === '3' ? 'tutorial-glow' : ''}`}>
              <div className="space-y-2">
                <Label className="text-[#F5E9E0]">I will speak in...</Label>
                <Select
                  value={language}
                  onValueChange={v => { setLanguage(v); if (step === '3') advance() }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Record button with glow rings */}
            <div className="relative flex items-center justify-center mb-6 mt-4">
              {/* Outer decorative ring */}
              <div
                className="absolute w-56 h-56 rounded-full border border-[#D95D39]/20 pointer-events-none animate-glow-pulse-delay"
              />
              {/* Inner decorative ring */}
              <div
                className="absolute w-48 h-48 rounded-full border border-[#D95D39]/30 pointer-events-none animate-glow-pulse"
              />
              {/* Mic button */}
              <button
                onClick={startRecording}
                className={`relative w-36 h-36 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150 ${step === '4' ? 'tutorial-glow' : 'animate-pulse-ring'}`}
                style={{
                  background: 'linear-gradient(145deg, #E06040, #C84828)',
                }}
              >
                {/* Inset shine */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, transparent 60%)' }}
                />
                <Mic className="w-14 h-14 text-white relative z-10" />
              </button>
            </div>

            <p className="text-[#D95D39] font-semibold text-lg mb-8">Press to Record</p>

            {/* Title input */}
            <div className="w-full bg-[#F5E9E0]/08 rounded-2xl p-4 mb-4">
              <div className="space-y-2">
                <Label className="text-[#F5E9E0]">Story title (optional)</Label>
                <Input
                  placeholder=""
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
            </div>

            {/* "Need inspiration?" trigger */}
            <button
              onClick={openPrompts}
              className={`flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-full transition-all active:scale-95 ${step === '2' ? 'tutorial-glow' : ''}`}
              style={{
                background: promptView !== 'closed' ? 'rgba(217,93,57,0.18)' : 'rgba(217,93,57,0.08)',
                border: '1px solid rgba(217,93,57,0.25)',
                color: '#D95D39',
              }}
            >
              <Sparkles className="w-4 h-4" />
              Need inspiration?
            </button>

            {/* Inline prompt area */}
            {promptView !== 'closed' && (
              <div className="w-full mt-4">
                {promptsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[#D95D39] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : prompts.length === 0 ? (
                  <p className="text-[#D5D9EC]/50 text-sm py-6 text-center">No prompts available right now.</p>
                ) : promptView === 'single' ? (
                  <div className="space-y-3">
                    {/* Single suggested prompt card */}
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: 'rgba(245,233,224,0.07)',
                        border: '1px solid rgba(217,93,57,0.25)',
                        boxShadow: '0 0 24px rgba(217,93,57,0.08)',
                      }}
                    >
                      <div className="text-[10px] font-bold text-[#D95D39] uppercase tracking-widest mb-2">
                        {prompts[currentPromptIdx]?.category}
                      </div>
                      <p className="text-[#F5E9E0] text-base leading-relaxed mb-4">
                        {prompts[currentPromptIdx]?.prompt_text}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={shufflePrompt}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[#F5E9E0] text-sm font-semibold transition-colors active:scale-95"
                          style={{
                            background: 'rgba(245,233,224,0.08)',
                            border: '1px solid rgba(245,233,224,0.15)',
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Try another
                        </button>
                        <button
                          onClick={() => usePrompt(prompts[currentPromptIdx].prompt_text)}
                          className="flex-1 bg-[#D95D39] text-white text-sm font-semibold px-3 py-2.5 rounded-xl hover:bg-[#B84A2A] transition-colors active:scale-95"
                        >
                          Use this
                        </button>
                      </div>
                    </div>

                    {/* See all link */}
                    <button
                      onClick={() => setPromptView('all')}
                      className="w-full text-center text-xs text-[#D5D9EC]/50 hover:text-[#F5E9E0] transition-colors py-1"
                    >
                      See all prompts →
                    </button>
                  </div>
                ) : (
                  /* All prompts grouped by category */
                  <div className="space-y-4">
                    <button
                      onClick={() => setPromptView('single')}
                      className="flex items-center gap-1.5 text-xs text-[#D5D9EC]/60 hover:text-[#F5E9E0] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to suggestion
                    </button>

                    {Object.entries(promptsByCategory).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <div className="text-[10px] font-bold text-[#D95D39] uppercase tracking-widest px-1">
                          {category}
                        </div>
                        {items.map(prompt => (
                          <button
                            key={prompt.id}
                            onClick={() => usePrompt(prompt.prompt_text)}
                            className="w-full text-left rounded-xl p-3.5 transition-all active:scale-[0.99]"
                            style={{
                              background: 'rgba(245,233,224,0.07)',
                              border: '1px solid rgba(245,233,224,0.12)',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(217,93,57,0.12)'
                              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(217,93,57,0.3)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,233,224,0.07)'
                              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,233,224,0.12)'
                            }}
                          >
                            <p className="text-[#F5E9E0] text-sm leading-relaxed">
                              {prompt.prompt_text}
                            </p>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RECORDING ── */}
        {recordingState === 'recording' && (
          <div className="flex flex-col items-center w-full">
            <div className="text-center mb-10">
              <p className="text-[#F5E9E0] font-semibold text-lg">Recording...</p>
              <p className="text-[#D5D9EC]/60 text-sm mt-1">Speak naturally. Tap stop when done.</p>
            </div>

            {/* Animated waveform bars */}
            <div className="flex items-center gap-1.5 mb-10" style={{height: '80px'}}>
              {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 1, 0.55, 0.85, 0.4].map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-[#D95D39]"
                  style={{
                    height: `${h * 64}px`,
                    animation: `wave ${0.8 + (i % 4) * 0.15}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.07}s`,
                    opacity: 0.7 + h * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-5xl font-mono font-bold text-[#F5E9E0] mb-4">
              {formatTime(elapsed)}
            </div>

            {/* Time limit warning */}
            {elapsed >= MAX_RECORDING_SECS - WARN_BEFORE_SECS && (
              <div className="text-[#D95D39] text-sm font-semibold mb-6">
                {formatTime(MAX_RECORDING_SECS - elapsed)} remaining — recording will stop automatically
              </div>
            )}
            {elapsed < MAX_RECORDING_SECS - WARN_BEFORE_SECS && <div className="mb-6" />}

            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-[#F5E9E0]/10 border-4 border-[#D95D39] flex items-center justify-center hover:bg-[#F5E9E0]/20 transition-colors shadow-lg"
            >
              <Square className="w-8 h-8 text-[#D95D39] fill-current" />
            </button>
            <p className="text-[#D5D9EC]/60 text-sm mt-4">Tap to stop</p>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {recordingState === 'preview' && !isProcessing && (
          <div className="flex flex-col items-center w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#D95D39]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-[#F5E9E0]">Recording complete!</h2>
              <p className="text-[#D5D9EC]/60 text-sm mt-1">{formatTime(elapsed)} recorded</p>
            </div>

            {/* Audio preview */}
            {audioUrl && (
              <div className="w-full bg-[#F5E9E0] rounded-2xl border border-[#3B2B3A]/10 p-5 mb-6 flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="w-12 h-12 rounded-full bg-[#3B2B3A] flex items-center justify-center flex-shrink-0 hover:bg-[#D95D39] transition-colors"
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5 text-white fill-current" />
                    : <Play className="w-5 h-5 text-white fill-current ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#3B2B3A]">Preview your recording</div>
                  <div className="text-xs text-[#3B2B3A]/60">{formatTime(elapsed)} · {language}</div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}

            {/* Language & Title */}
            <div className="w-full space-y-4 mb-6">
              <div className="bg-[#F5E9E0]/08 rounded-2xl p-4">
                <div className="space-y-2">
                  <Label className="text-[#F5E9E0]">Language spoken</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-[#F5E9E0]/08 rounded-2xl p-4">
                <div className="space-y-2">
                  <Label className="text-[#F5E9E0]">Story title (optional)</Label>
                  <Input
                    placeholder=""
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="w-full bg-[#D95D39]/12 border border-[#D95D39]/35 rounded-xl px-4 py-3 text-[#F5E9E0] text-sm mb-4">
                {error}
              </div>
            )}

            <Button size="lg" className="w-full text-lg mb-3" onClick={processStory}>
              Process Story ✨
            </Button>
            <button
              onClick={reRecord}
              className="text-sm text-[#F5E9E0]/50 hover:text-[#F5E9E0] transition-colors"
            >
              Re-record
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center w-full flex-1">
            {/* Dual counter-rotating spinner */}
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-[#D95D39]/20 border-t-[#D95D39] animate-spin" />
              <div
                className="absolute inset-2 rounded-full border-4 border-[#D95D39]/10 border-b-[#D95D39] animate-spin-reverse"
              />
            </div>
            <p className="text-xl font-semibold text-[#F5E9E0] text-center">
              {PROCESSING_MESSAGES[processingState]}
            </p>
            <p className="text-[#D5D9EC]/60 text-sm mt-3">This takes about 15–30 seconds.</p>
          </div>
        )}

        {/* Mic error (idle) */}
        {error && recordingState === 'idle' && (
          <div className="w-full bg-[#D95D39]/12 border border-[#D95D39]/35 rounded-xl px-4 py-3 text-[#F5E9E0] text-sm mt-6">
            {error}
          </div>
        )}
      </div>


      {/* Tutorial banner — steps 2, 3, 4 (only on idle) */}
      {recordingState === 'idle' && step === '2' && (
        <TutorialBanner
          step={2}
          body="Tap 'Need inspiration?' to pick a prompt"
          onSkip={skip}
        />
      )}
      {recordingState === 'idle' && step === '3' && (
        <TutorialBanner
          step={3}
          body="Choose the language you'll speak in"
          onSkip={skip}
        />
      )}
      {recordingState === 'idle' && step === '4' && (
        <TutorialBanner
          step={4}
          body="Press and hold to record your story"
          onSkip={skip}
        />
      )}
    </div>
  )
}
