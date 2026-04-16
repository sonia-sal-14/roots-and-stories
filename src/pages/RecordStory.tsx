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
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      <AppHeader showBack backTo="/library" title="Record a story" subtitle="Speak in any language" />

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 max-w-lg mx-auto w-full">

        {/* ── IDLE: Big record button ── */}
        {recordingState === 'idle' && (
          <div className="flex flex-col items-center w-full">
            <div className="text-center mb-10">
              <p className="text-gray-500 text-lg">Press the button and start speaking.</p>
              <p className="text-gray-400 text-sm mt-1">Speak naturally — we'll handle the rest.</p>
            </div>

            <button
              onClick={startRecording}
              className="w-40 h-40 rounded-full bg-[#5C3D2E] shadow-2xl flex items-center justify-center hover:bg-[#4a3124] active:scale-95 transition-all mb-10 group"
            >
              <Mic className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
            </button>

            <p className="text-[#5C3D2E] font-semibold text-lg mb-8">Press to Record</p>

            {/* Language selector */}
            <div className="w-full space-y-2 mb-4">
              <Label>I will speak in...</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Title input */}
            <div className="w-full space-y-2 mb-4">
              <Label>Story title (optional)</Label>
              <Input
                placeholder="Leave blank — AI will suggest one"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Prompt browser */}
            <button
              onClick={() => setShowPrompts(true)}
              className="flex items-center gap-2 text-[#C8860A] font-semibold text-base hover:opacity-75 transition-opacity"
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
              <p className="text-[#5C3D2E] font-semibold text-lg">Recording...</p>
              <p className="text-gray-400 text-sm mt-1">Speak naturally. Tap stop when done.</p>
            </div>

            {/* Pulsing mic */}
            <div className="relative mb-10">
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
              <div className="w-40 h-40 rounded-full bg-red-500 shadow-2xl flex items-center justify-center relative">
                <Mic className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Timer */}
            <div className="text-5xl font-mono font-bold text-[#5C3D2E] mb-10">
              {formatTime(elapsed)}
            </div>

            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-white border-4 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg"
            >
              <Square className="w-8 h-8 text-red-500 fill-current" />
            </button>
            <p className="text-gray-400 text-sm mt-4">Tap to stop</p>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {recordingState === 'preview' && !isProcessing && (
          <div className="flex flex-col items-center w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-[#5C3D2E]">Recording complete!</h2>
              <p className="text-gray-400 text-sm mt-1">{formatTime(elapsed)} recorded</p>
            </div>

            {/* Audio preview */}
            {audioUrl && (
              <div className="w-full bg-white rounded-2xl border border-[#5C3D2E]/10 p-5 mb-6 flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="w-12 h-12 rounded-full bg-[#5C3D2E] flex items-center justify-center flex-shrink-0 hover:bg-[#4a3124] transition-colors"
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5 text-white fill-current" />
                    : <Play className="w-5 h-5 text-white fill-current ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#5C3D2E]">Preview your recording</div>
                  <div className="text-xs text-gray-400">{formatTime(elapsed)} · {language}</div>
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
              <div className="space-y-2">
                <Label>Language spoken</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Story title (optional)</Label>
                <Input
                  placeholder="Leave blank — AI will suggest one"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
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
              className="text-sm text-gray-400 hover:text-[#5C3D2E] transition-colors"
            >
              Re-record
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center w-full flex-1">
            <div className="w-20 h-20 border-4 border-[#5C3D2E] border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-xl font-semibold text-[#5C3D2E] text-center">
              {PROCESSING_MESSAGES[processingState]}
            </p>
            <p className="text-gray-400 text-sm mt-3">This takes about 15–30 seconds.</p>
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
