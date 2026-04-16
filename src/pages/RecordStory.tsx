import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transcribeAndTranslate, blobToBase64 } from '@/lib/api'
import { PromptBrowser } from '@/components/PromptBrowser'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, Square, Sparkles, Play, Pause } from 'lucide-react'

const LANGUAGES = [
  // Global
  'English', 'Arabic', 'French', 'Mandarin', 'Portuguese', 'Spanish',
  // South & Southeast Asian
  'Bengali', 'Gujarati', 'Hindi', 'Marathi', 'Punjabi', 'Tamil', 'Telugu', 'Tagalog',
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
  const [showPrompts, setShowPrompts] = useState(false)

  // Error
  const [error, setError] = useState('')

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

      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
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
            <div className="text-center mb-10">
              <p className="text-[#F5E9E0] text-lg">Press the button and start speaking.</p>
              <p className="text-[#D5D9EC]/60 text-sm mt-1">Speak naturally — we'll handle the rest.</p>
            </div>

            <button
              onClick={startRecording}
              className="w-40 h-40 rounded-full bg-[#D95D39] shadow-[0_8px_32px_rgba(217,93,57,0.5)] flex items-center justify-center hover:bg-[#B84A2A] active:scale-95 transition-all mb-10 group"
            >
              <Mic className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
            </button>

            <p className="text-[#D95D39] font-semibold text-lg mb-8">Press to Record</p>

            {/* Language selector */}
            <div className="w-full bg-[#F5E9E0]/08 rounded-2xl p-4 mb-4">
              <div className="space-y-2">
                <Label className="text-[#F5E9E0]">I will speak in...</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title input */}
            <div className="w-full bg-[#F5E9E0]/08 rounded-2xl p-4 mb-4">
              <div className="space-y-2">
                <Label className="text-[#F5E9E0]">Story title (optional)</Label>
                <Input
                  placeholder="Leave blank — AI will suggest one"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Prompt browser */}
            <button
              onClick={() => setShowPrompts(true)}
              className="flex items-center gap-2 text-[#D95D39] font-semibold text-base hover:opacity-75 transition-opacity"
            >
              <Sparkles className="w-5 h-5" />
              Need inspiration? ✨
            </button>
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
            <div className="text-5xl font-mono font-bold text-[#F5E9E0] mb-10">
              {formatTime(elapsed)}
            </div>

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
                    <SelectContent>
                      {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-[#F5E9E0]/08 rounded-2xl p-4">
                <div className="space-y-2">
                  <Label className="text-[#F5E9E0]">Story title (optional)</Label>
                  <Input
                    placeholder="Leave blank — AI will suggest one"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
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
            <div className="w-20 h-20 border-4 border-[#D95D39] border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-xl font-semibold text-[#F5E9E0] text-center">
              {PROCESSING_MESSAGES[processingState]}
            </p>
            <p className="text-[#D5D9EC]/60 text-sm mt-3">This takes about 15–30 seconds.</p>
          </div>
        )}

        {/* Mic error (idle) */}
        {error && recordingState === 'idle' && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mt-6">
            {error}
          </div>
        )}
      </div>

      <PromptBrowser
        open={showPrompts}
        onClose={() => setShowPrompts(false)}
        onSelect={text => { setTitle(text); setShowPrompts(false) }}
      />
    </div>
  )
}
