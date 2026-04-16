import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF6EE] via-[#f5e6d3] to-[#ede0cc] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-12 pb-4">
        <BookOpen className="w-10 h-10 text-[#C8860A] mr-3" />
        <span className="text-2xl font-bold text-[#5C3D2E]">Roots & Stories</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md text-center">
          {/* Decorative element */}
          <div className="w-24 h-24 bg-[#5C3D2E] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="text-4xl">🌳</span>
          </div>

          <h1 className="text-4xl font-bold text-[#5C3D2E] mb-4 leading-tight">
            Your family's voice,<br />for every generation.
          </h1>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed">
            Record stories in any language. We'll transcribe, translate, and preserve them for your whole family — forever.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full text-xl py-7"
              onClick={() => navigate('/signup')}
            >
              Create an account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full text-xl py-7"
              onClick={() => navigate('/signin')}
            >
              Sign in
            </Button>
          </div>

          {/* Trust message */}
          <p className="text-sm text-gray-500 mt-8">
            🔒 Your stories are private and secure.
            Only your family can access them.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-sm text-gray-400">
        Made with ❤️ for families everywhere
      </div>
    </div>
  )
}
