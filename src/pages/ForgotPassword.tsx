import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) { setError('Something went wrong. Please try again.'); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader showBack backTo="/signin" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-[#F5E9E0] tracking-tight">Reset password</h2>
          <p className="text-[#D5D9EC]/60 mt-1">We'll send a reset link to your email.</p>
        </div>

        {sent ? (
          <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg text-center">
            <div className="text-5xl mb-4">📬</div>
            <h3 className="text-xl font-bold text-[#3B2B3A] mb-2">Check your email</h3>
            <p className="text-[#3B2B3A]/60 text-sm leading-relaxed">
              We sent a password reset link to <span className="font-semibold text-[#3B2B3A]">{email}</span>.
              Click the link in that email to set a new password.
            </p>
            <p className="text-[#3B2B3A]/40 text-xs mt-4">Didn't get it? Check your spam folder.</p>
          </div>
        ) : (
          <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#3B2B3A]">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
              )}

              <Button type="submit" size="lg" className="w-full text-lg rounded-2xl py-7 font-bold" disabled={loading}>
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span>
                  : 'Send reset link'}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-[#D5D9EC]/50 mt-6 text-sm">
          Remember it?{' '}
          <Link to="/signin" className="text-[#D95D39] font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
