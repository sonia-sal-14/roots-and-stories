import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Admin Supabase client — bypasses RLS so we can verify tokens and write usage logs
// SUPABASE_SERVICE_ROLE_KEY must be set in Vercel environment variables
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } }
)

const DAILY_LIMIT = Number(process.env.DAILY_RECORDING_LIMIT ?? 20)

const VALID_CHAPTERS = [
  'Childhood',
  'Cultural Heritage',
  'Family & Traditions',
  'Recent Memories',
  'Other',
] as const

// ISO 639-1 codes for Whisper language hints
// Only languages officially supported by Whisper as explicit hints.
// Unsupported ones (Gujarati, Bengali, Punjabi, Telugu) are omitted —
// Whisper will auto-detect them, which still works well in practice.
const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Arabic: 'ar',
  French: 'fr',
  Mandarin: 'zh',
  Portuguese: 'pt',
  Spanish: 'es',
  Hindi: 'hi',
  Marathi: 'mr',
  Urdu: 'ur',
  Tamil: 'ta',
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

// ── Rate-limit helpers ────────────────────────────────────────────────────────

async function getUserIdFromToken(token: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; count: number }> {
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  // Read current count (may not exist yet)
  const { data } = await supabaseAdmin
    .from('usage_logs')
    .select('recording_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  const currentCount = data?.recording_count ?? 0

  if (currentCount >= DAILY_LIMIT) {
    return { allowed: false, count: currentCount }
  }

  // Upsert: insert first row or increment existing
  await supabaseAdmin.from('usage_logs').upsert(
    { user_id: userId, date: today, recording_count: currentCount + 1 },
    { onConflict: 'user_id,date' }
  )

  return { allowed: true, count: currentCount + 1 }
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

  // ── Auth verification ──────────────────────────────────────────────────────
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // If the env var isn't set yet, let the request through with a warning
    // (temporary — remove after deploying properly)
    console.warn('[api/ai] SUPABASE_SERVICE_ROLE_KEY not set — skipping auth + rate limit')
  } else {
    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' })
    }

    const { allowed, count } = await checkAndIncrementUsage(userId)
    if (!allowed) {
      console.warn(`[api/ai] Rate limit hit for user ${userId}: ${count}/${DAILY_LIMIT} today`)
      return res.status(429).json({
        error: `You've reached today's limit of ${DAILY_LIMIT} recordings. Come back tomorrow!`,
      })
    }
  }

  // ── Dispatch action ────────────────────────────────────────────────────────
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
