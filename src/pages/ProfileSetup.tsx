import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera } from 'lucide-react'

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
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    setError('')
    setLoading(true)

    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, photoFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }

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
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader title="Tell us about you" subtitle="Step 1 of 2" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#F5E9E0] tracking-tight">Your profile</h2>
          <p className="text-[#D5D9EC]/60 mt-1">This is how your family will see you.</p>
        </div>

        <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div className="flex flex-col items-center pb-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-[#3B2B3A]/10 border-2 border-dashed border-[#D95D39]/30 flex items-center justify-center overflow-hidden">
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <Camera className="w-8 h-8 text-[#3B2B3A]/30" />}
                </div>
                <label htmlFor="photo" className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D95D39] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#B84A2A] transition-colors shadow">
                  <Camera className="w-4 h-4 text-white" />
                </label>
                <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <p className="text-xs text-[#3B2B3A]/50 mt-2">Optional photo</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#3B2B3A]">Your name</Label>
              <Input id="displayName" placeholder='e.g. "Grandma Rosa"' value={displayName}
                onChange={e => setDisplayName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-[#3B2B3A]">Your native language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>}

            <Button type="submit" size="lg" className="w-full text-lg rounded-2xl py-7 font-bold" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</span> : 'Continue →'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
