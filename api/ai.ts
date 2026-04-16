import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const VALID_CHAPTERS = [
  'Childhood',
  'Cultural Heritage',
  'Family & Traditions',
  'Recent Memories',
  'Other',
] as const

// ISO 639-1 codes for Whisper language hints
const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Arabic: 'ar',
  French: 'fr',
  Mandarin: 'zh',
  Portuguese: 'pt',
  Spanish: 'es',
  Bengali: 'bn',
  Gujarati: 'gu',
  Hindi: 'hi',
  Marathi: 'mr',
  Punjabi: 'pa',
  Tamil: 'ta',
  Telugu: 'te',
  Tagalog: 'tl',
  Japanese: 'ja',
  Korean: 'ko',
}

function getMimeExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
  }
  return map[mimeType] ?? 'webm'
}

type Action = 'transcribe_and_translate'

interface TranscribePayload {
  audioBase64: string
  mimeType: string
  language: string
}

interface TranscribeResult {
  transcript_original: string
  transcript_english: string
  suggested_chapter: string
}

async function transcribeAndTranslate(
  payload: TranscribePayload
): Promise<TranscribeResult> {
  const { audioBase64, mimeType, language } = payload

  // ── Step 1: Transcribe with OpenAI Whisper ─────────────────────────────────
  const audioBuffer = Buffer.from(audioBase64, 'base64')
  const ext = getMimeExtension(mimeType)
  const audioFile = new File([audioBuffer], `recording.${ext}`, { type: mimeType })

  const whisperLang = LANGUAGE_CODES[language] // undefined = Whisper auto-detects

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    ...(whisperLang ? { language: whisperLang } : {}),
  })

  const transcript_original = transcription.text

  // ── Step 2: Translate + categorize with Claude ─────────────────────────────
  const isEnglish = language === 'English'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `This is a family memory story transcribed from ${language}:

"${transcript_original}"

Please do the following:
${isEnglish
    ? '1. The story is already in English — repeat it as-is for the English transcript.'
    : '1. Translate the story into warm, natural English.'}
2. Suggest which chapter this story best fits. Choose EXACTLY one of:
   - Childhood
   - Cultural Heritage
   - Family & Traditions
   - Recent Memories
   - Other

Respond with ONLY valid JSON, no other text:
{
  "transcript_english": "the English text",
  "suggested_chapter": "one of the five options"
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid response format from AI')

  const parsed = JSON.parse(jsonMatch[0]) as {
    transcript_english: string
    suggested_chapter: string
  }

  if (!VALID_CHAPTERS.includes(parsed.suggested_chapter as typeof VALID_CHAPTERS[number])) {
    parsed.suggested_chapter = 'Other'
  }

  return {
    transcript_original,
    transcript_english: parsed.transcript_english,
    suggested_chapter: parsed.suggested_chapter,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
  }

  const { action, payload } = req.body as { action: Action; payload: unknown }

  if (!action || !payload) {
    return res.status(400).json({ error: 'Missing action or payload' })
  }

  try {
    if (action === 'transcribe_and_translate') {
      const result = await transcribeAndTranslate(payload as TranscribePayload)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (err) {
    console.error(`[api/ai] Error in action "${action}":`, err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return res.status(500).json({ error: message })
  }
}
