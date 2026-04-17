import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Incorrect email or password. Please try again.'); return }
    navigate('/library')
  }

  return (
    <div className="min-h-screen bg-[#3B2B3A] flex flex-col">
      <AppHeader showBack backTo="/welcome" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-[#F5E9E0] tracking-tight">Welcome back</h2>
          <p className="text-[#D5D9EC]/60 mt-1">Your family's stories are waiting.</p>
        </div>

        <div className="bg-[#F5E9E0] rounded-3xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#3B2B3A]">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#3B2B3A]">Password</Label>
              <Input id="password" type="password" placeholder="Your password" value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full text-lg rounded-2xl py-7 font-bold" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span> : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[#D5D9EC]/50 mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#D95D39] font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
