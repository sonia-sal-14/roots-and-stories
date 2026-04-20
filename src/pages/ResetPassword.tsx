import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords don\'t match.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError('Something went wrong. Please try again or request a new reset link.'); return }

    // Success — redirect to library
    navigate('/library', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader title="Set new password" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-[#F5E9E0] tracking-tight">New password</h2>
          <p className="text-[#D5D9EC]/60 mt-1">Choose something secure — at least 8 characters.</p>
        </div>

        <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#3B2B3A]">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[#3B2B3A]">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Same password again"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full text-lg rounded-2xl py-7 font-bold" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</span>
                : 'Set new password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
