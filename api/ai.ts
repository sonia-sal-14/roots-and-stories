import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const VALID_CHAPTERS = [
  'Childhood',
  'Cultural Heritage',
  'Family & Traditions',
  'Recent Memories',
  'Other',
] as const

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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mimeType as 'audio/webm' | 'audio/mp4' | 'audio/mpeg' | 'audio/wav' | 'audio/ogg',
              data: audioBase64,
            },
          },
          {
            type: 'text',
            text: `This is a family memory story recording in ${language}.

Please do the following:
1. Transcribe the audio exactly as spoken in the original language (${language}).
2. Translate the story into English (if it's already in English, repeat the transcription).
3. Suggest which chapter this story best fits into. Choose EXACTLY one of these options:
   - Childhood
   - Cultural Heritage
   - Family & Traditions
   - Recent Memories
   - Other

Respond with ONLY valid JSON in this exact format, no other text:
{
  "transcript_original": "the transcription in the original language",
  "transcript_english": "the English translation",
  "suggested_chapter": "one of the five chapter options"
}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract JSON from response (handle cases where model adds extra text)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI')
  }

  const parsed = JSON.parse(jsonMatch[0]) as TranscribeResult

  // Validate suggested_chapter
  if (!VALID_CHAPTERS.includes(parsed.suggested_chapter as typeof VALID_CHAPTERS[number])) {
    parsed.suggested_chapter = 'Other'
  }

  return parsed
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
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
