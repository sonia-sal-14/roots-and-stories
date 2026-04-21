export interface TranscribeResult {
  transcript_original: string
  transcript_english: string
  suggested_chapter: 'Childhood' | 'Cultural Heritage' | 'Family & Traditions' | 'Recent Memories' | 'Other'
}

export class AIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AIError'
  }
}

export async function transcribeAndTranslate(
  audioBase64: string,
  mimeType: string,
  language: string
): Promise<TranscribeResult> {
  // Attach the current user's session token so the serverless function can
  // verify identity and enforce per-user rate limits.
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'transcribe_and_translate',
      payload: { audioBase64, mimeType, language },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    if (response.status === 429) {
      throw new AIError(errorData.error ?? "You've reached today's recording limit. Come back tomorrow!")
    }
    if (response.status === 401) {
      throw new AIError(errorData.error ?? 'Please sign in to record a story.')
    }
    throw new AIError(errorData.error ?? `Request failed with status ${response.status}`)
  }

  const data = await response.json() as TranscribeResult
  return data
}

/** Convert a Blob to a base64 string */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:audio/webm;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
