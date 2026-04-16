import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/profile-setup')
  }

  return (
    <div className="min-h-screen bg-[#FDF6EE] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 pt-8 pb-4">
        <button onClick={() => navigate('/welcome')} className="text-[#5C3D2E] hover:opacity-70 transition-opacity mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <BookOpen className="w-7 h-7 text-[#C8860A] mr-2" />
        <span className="text-xl font-bold text-[#5C3D2E]">Roots & Stories</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[#5C3D2E]/10 p-8">
            <h2 className="text-3xl font-bold text-[#5C3D2E] mb-2">Create account</h2>
            <p className="text-gray-500 mb-8">Join and start preserving your family's stories.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
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
                    Creating account...
                  </span>
                ) : 'Create account'}
              </Button>
            </form>

            <p className="text-center text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#C8860A] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
