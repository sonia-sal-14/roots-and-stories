import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, BookOpen } from 'lucide-react'

const LANGUAGES = [
  'English', 'Spanish', 'Hindi', 'Mandarin', 'Arabic',
  'French', 'Tagalog', 'Portuguese', 'Other',
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [language, setLanguage] = useState('English')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    if (!displayName.trim()) {
      setError('Please enter your name.')
      return
    }

    setLoading(true)

    try {
      let photoUrl: string | null = null

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, photoFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }

      // Upsert family_members row (no family_group_id yet — added at FamilySetup)
      // We store the profile in localStorage temporarily until family is set up
      localStorage.setItem('pending_profile', JSON.stringify({
        display_name: displayName.trim(),
        native_language: language,
        photo_url: photoUrl,
      }))

      navigate('/family-setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 pt-8 pb-4">
        <BookOpen className="w-7 h-7 text-[#C8860A] mr-2" />
        <span className="text-xl font-bold text-[#5C3D2E]">Roots & Stories</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[#5C3D2E]/10 p-8">
            <h2 className="text-3xl font-bold text-[#5C3D2E] mb-2">Tell us about you</h2>
            <p className="text-gray-500 mb-8">This helps your family recognise who recorded each story.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo upload */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#FDF6EE] border-2 border-dashed border-[#5C3D2E]/30 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-[#5C3D2E]/40" />
                    )}
                  </div>
                  <label
                    htmlFor="photo"
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#C8860A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#a36e08] transition-colors shadow"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">Optional profile photo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Your name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Grandma Rosa, Uncle David"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-400">This is how you'll appear to your family.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Your native language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">The language you're most comfortable speaking in.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full text-lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Continue →'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
